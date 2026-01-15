const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public'
});

async function findUser() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');
    
    // Получаем URL из аргументов
    const profileUrl = process.argv[2] || 'https://reader.market/profile/5c575c31-f654-48dc-b686-6bc6d4f51662';
    console.log(`\n🔍 Ищем пользователя по URL: ${profileUrl}`);
    
    // Извлекаем ID из URL
    const urlMatch = profileUrl.match(/profile\/([a-f0-9-]+)/);
    let userId = urlMatch ? urlMatch[1] : profileUrl;
    console.log(`Извлечённый ID: ${userId}`);
    
    // 1. Ищем по ID
    console.log('\n📊 Поиск по ID...');
    let user = await client.query(`
      SELECT id, username, email, full_name, access_level, created_at
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (user.rows.length === 0) {
      console.log('❌ Пользователь с таким ID не найден');
      
      // 2. Показываем всех пользователей
      console.log('\n📋 Список всех пользователей:');
      const allUsers = await client.query(`
        SELECT 
          id, 
          username, 
          email, 
          access_level, 
          created_at,
          (SELECT COUNT(*) FROM messages m 
           WHERE m.recipient_id = users.id 
           AND m.read_status = false 
           AND m.deleted_at IS NULL) as unread_count
        FROM users
        ORDER BY created_at DESC
        LIMIT 20
      `);
      
      console.log(`Найдено ${allUsers.rows.length} пользователей:`);
      allUsers.rows.forEach((u, idx) => {
        console.log(`\n${idx + 1}. ${u.username} (${u.access_level})`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Email: ${u.email || 'не указан'}`);
        console.log(`   Непрочитанных сообщений: ${u.unread_count}`);
        console.log(`   Создан: ${u.created_at}`);
        console.log(`   URL: https://reader.market/profile/${u.id}`);
      });
      
      // Ищем похожие ID
      console.log('\n🔍 Поиск похожих ID...');
      const similarIds = await client.query(`
        SELECT id, username
        FROM users
        WHERE id::text LIKE $1
        LIMIT 5
      `, [`%${userId.substring(0, 8)}%`]);
      
      if (similarIds.rows.length > 0) {
        console.log('Возможно, вы имели в виду:');
        similarIds.rows.forEach(u => {
          console.log(`  - ${u.username}: ${u.id}`);
        });
      }
      
    } else {
      const u = user.rows[0];
      console.log('\n✅ Пользователь найден!');
      console.log(`Username: ${u.username}`);
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email || 'не указан'}`);
      console.log(`Access Level: ${u.access_level}`);
      
      // Проверяем непрочитанные сообщения
      const unreadCount = await client.query(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE recipient_id = $1 
          AND read_status = false
          AND deleted_at IS NULL
      `, [u.id]);
      
      console.log(`\nНепрочитанных сообщений: ${unreadCount.rows[0].count}`);
      
      if (parseInt(unreadCount.rows[0].count) > 0) {
        console.log('\n💡 Для очистки выполните:');
        console.log(`node check_user_data.cjs ${u.id} --clear`);
      }
    }
    
    // Выполнение очистки
    const args = process.argv.slice(2);
    if (args.includes('--clear')) {
      console.log('\n🔄 Очищаем все непрочитанные сообщения...');
      const result = await client.query(`
        UPDATE messages 
        SET read_status = true 
        WHERE recipient_id = $1 
          AND read_status = false
          AND deleted_at IS NULL
      `, [userId]);
      console.log(`✅ Отмечено как прочитанные: ${result.rowCount} сообщений`);
      
      const notifResult = await client.query(`
        UPDATE notifications
        SET read_status = true
        WHERE user_id = $1
          AND read_status = false
      `, [userId]);
      console.log(`✅ Отмечено уведомлений: ${notifResult.rowCount}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Соединение закрыто');
  }
}

findUser();
