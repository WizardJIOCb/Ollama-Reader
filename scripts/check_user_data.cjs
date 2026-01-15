const { Client } = require('pg');

const userId = '5c575c31-f654-48dc-b686-6bc6d4f51662';

const client = new Client({
  connectionString: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public'
});

async function checkUserData() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');
    
    // 1. Проверяем информацию о пользователе
    console.log('\n👤 Информация о пользователе:');
    const userInfo = await client.query(`
      SELECT id, username, email, full_name, access_level, created_at
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (userInfo.rows.length === 0) {
      console.log('❌ Пользователь не найден!');
      return;
    }
    
    const user = userInfo.rows[0];
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email || 'не указан'}`);
    console.log(`Full Name: ${user.full_name || 'не указан'}`);
    console.log(`Access Level: ${user.access_level}`);
    console.log(`Created: ${user.created_at}`);
    
    // 2. Проверяем уведомления
    console.log('\n🔔 Проверяем уведомления...');
    const notifications = await client.query(`
      SELECT 
        type,
        read_status,
        created_at,
        content
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    
    console.log(`Всего последних уведомлений: ${notifications.rows.length}`);
    const unreadNotifications = notifications.rows.filter(n => !n.read_status);
    console.log(`Непрочитанных: ${unreadNotifications.length}`);
    
    if (unreadNotifications.length > 0) {
      console.log('\nНепрочитанные уведомления:');
      unreadNotifications.forEach((notif, idx) => {
        console.log(`${idx + 1}. Тип: ${notif.type}, Дата: ${notif.created_at}`);
        console.log(`   Контент: ${JSON.stringify(notif.content)}`);
      });
    }
    
    // 3. Проверяем диалоги
    console.log('\n💬 Проверяем диалоги...');
    const conversations = await client.query(`
      SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        u1.username as user1_name,
        u2.username as user2_name,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.deleted_at IS NULL) as total_messages,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.recipient_id = $1 
         AND m.read_status = false
         AND m.deleted_at IS NULL) as unread_messages
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.updated_at DESC
    `, [userId]);
    
    console.log(`Всего диалогов: ${conversations.rows.length}`);
    
    if (conversations.rows.length > 0) {
      console.log('\nПоследние диалоги:');
      conversations.rows.slice(0, 5).forEach((conv, idx) => {
        const partner = conv.user1_name === user.username ? conv.user2_name : conv.user1_name;
        console.log(`${idx + 1}. С ${partner}`);
        console.log(`   ID: ${conv.id}`);
        console.log(`   Всего сообщений: ${conv.total_messages}`);
        console.log(`   Непрочитанных: ${conv.unread_messages}`);
        console.log(`   Последнее обновление: ${conv.updated_at}`);
      });
    }
    
    // 4. Проверяем участие в группах
    console.log('\n👥 Проверяем группы...');
    const groups = await client.query(`
      SELECT 
        g.id,
        g.name,
        g.description,
        gm.role,
        gm.joined_at,
        g.deleted_at,
        (SELECT COUNT(*) FROM group_members gm2 
         WHERE gm2.group_id = g.id) as member_count
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.user_id = $1
      ORDER BY gm.joined_at DESC
    `, [userId]);
    
    console.log(`Всего групп: ${groups.rows.length}`);
    const activeGroups = groups.rows.filter(g => !g.deleted_at);
    const deletedGroups = groups.rows.filter(g => g.deleted_at);
    console.log(`Активных: ${activeGroups.length}`);
    console.log(`Удалённых: ${deletedGroups.length}`);
    
    if (groups.rows.length > 0) {
      console.log('\nПоследние группы:');
      groups.rows.slice(0, 5).forEach((group, idx) => {
        const status = group.deleted_at ? '(УДАЛЕНА)' : '';
        console.log(`${idx + 1}. ${group.name} ${status}`);
        console.log(`   ID: ${group.id}`);
        console.log(`   Роль: ${group.role}`);
        console.log(`   Участников: ${group.member_count}`);
        console.log(`   Вступил: ${group.joined_at}`);
      });
    }
    
    // 5. Проверяем API endpoint для unread count
    console.log('\n🔢 Данные, которые возвращает API /api/conversations/unread-count:');
    
    const unreadConversations = await client.query(`
      SELECT 
        c.id as conversation_id,
        COUNT(m.id) as unread_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id 
        AND m.recipient_id = $1 
        AND m.read_status = false
        AND m.deleted_at IS NULL
      WHERE c.user1_id = $1 OR c.user2_id = $1
      GROUP BY c.id
      HAVING COUNT(m.id) > 0
    `, [userId]);
    
    const totalUnread = unreadConversations.rows.reduce((sum, c) => sum + parseInt(c.unread_count), 0);
    console.log(`Общее количество непрочитанных: ${totalUnread}`);
    
    if (unreadConversations.rows.length > 0) {
      console.log('Диалоги с непрочитанными:');
      unreadConversations.rows.forEach((conv, idx) => {
        console.log(`  ${idx + 1}. Conversation ${conv.conversation_id}: ${conv.unread_count} непрочитанных`);
      });
    }
    
    // РЕШЕНИЯ
    console.log('\n' + '='.repeat(60));
    console.log('РЕШЕНИЯ:');
    console.log('='.repeat(60));
    
    if (unreadNotifications.length > 0) {
      console.log('\n📝 Для очистки уведомлений:');
      console.log('node check_user_data.cjs --clear-notifications');
    }
    
    if (totalUnread > 0) {
      console.log('\n📝 Для очистки непрочитанных сообщений:');
      console.log('node check_user_data.cjs --mark-all-read');
    }
    
    if (unreadNotifications.length === 0 && totalUnread === 0) {
      console.log('\n✅ Всё чисто! Непрочитанных сообщений и уведомлений нет.');
      console.log('\n💡 Если в интерфейсе отображается значок непрочитанных:');
      console.log('   1. Очистите кэш браузера');
      console.log('   2. Выйдите и войдите заново');
      console.log('   3. Проверьте WebSocket соединение (F12 > Console)');
    }
    
    // Выполнение действий
    const args = process.argv.slice(2);
    
    if (args.includes('--clear-notifications')) {
      console.log('\n🔄 Отмечаем все уведомления как прочитанные...');
      const result = await client.query(`
        UPDATE notifications 
        SET read_status = true 
        WHERE user_id = $1 AND read_status = false
      `, [userId]);
      console.log(`✅ Отмечено: ${result.rowCount} уведомлений`);
    }
    
    if (args.includes('--mark-all-read')) {
      console.log('\n🔄 Отмечаем все сообщения как прочитанные...');
      const result = await client.query(`
        UPDATE messages 
        SET read_status = true 
        WHERE recipient_id = $1 
          AND read_status = false
          AND deleted_at IS NULL
      `, [userId]);
      console.log(`✅ Отмечено: ${result.rowCount} сообщений`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n✅ Соединение закрыто');
  }
}

checkUserData();
