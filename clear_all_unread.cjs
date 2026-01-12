const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public'
});

async function clearAllUnread() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');
    
    // Получаем всех пользователей с непрочитанными сообщениями
    const usersWithUnread = await client.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(m.id) as unread_count
      FROM users u
      JOIN messages m ON m.recipient_id = u.id
      WHERE m.read_status = false 
        AND m.deleted_at IS NULL
      GROUP BY u.id, u.username, u.email
      ORDER BY unread_count DESC
    `);
    
    console.log(`📊 Найдено пользователей с непрочитанными сообщениями: ${usersWithUnread.rows.length}\n`);
    
    if (usersWithUnread.rows.length === 0) {
      console.log('✅ Все сообщения прочитаны!');
      return;
    }
    
    console.log('Список пользователей с непрочитанными:');
    usersWithUnread.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.username}: ${user.unread_count} непрочитанных`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'не указан'}\n`);
    });
    
    const args = process.argv.slice(2);
    
    if (args.includes('--clear-all')) {
      console.log('🔄 Отмечаем ВСЕ сообщения как прочитанные для всех пользователей...\n');
      
      for (const user of usersWithUnread.rows) {
        const result = await client.query(`
          UPDATE messages 
          SET read_status = true 
          WHERE recipient_id = $1 
            AND read_status = false
            AND deleted_at IS NULL
        `, [user.id]);
        
        const notifResult = await client.query(`
          UPDATE notifications
          SET read_status = true
          WHERE user_id = $1
            AND read_status = false
        `, [user.id]);
        
        console.log(`✅ ${user.username}: отмечено ${result.rowCount} сообщений, ${notifResult.rowCount} уведомлений`);
      }
      
      console.log('\n✅ Готово! Все непрочитанные сообщения отмечены как прочитанные.');
      
    } else {
      console.log('💡 Для очистки всех непрочитанных сообщений выполните:');
      console.log('node clear_all_unread.cjs --clear-all');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Соединение закрыто');
  }
}

clearAllUnread();
