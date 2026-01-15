const { Client } = require('pg');

const userId = '5c575c31-f654-48dc-b686-6bc6d4f51662';

const client = new Client({
  connectionString: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public'
});

async function clearUnreadMessages() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');
    
    // 1. Проверяем непрочитанные сообщения в личных диалогах
    console.log('\n📨 Проверяем непрочитанные сообщения в личных диалогах...');
    const conversationMessages = await client.query(`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.read_status,
        u.username as sender_username,
        m.conversation_id
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = $1 
        AND m.read_status = false
        AND m.deleted_at IS NULL
        AND m.conversation_id IS NOT NULL
      ORDER BY m.created_at DESC
    `, [userId]);
    
    console.log(`Найдено ${conversationMessages.rows.length} непрочитанных сообщений в личных диалогах`);
    
    if (conversationMessages.rows.length > 0) {
      console.log('\nПервые 5 сообщений:');
      conversationMessages.rows.slice(0, 5).forEach((msg, idx) => {
        console.log(`${idx + 1}. От: ${msg.sender_username}, Дата: ${msg.created_at}`);
        console.log(`   Текст: ${msg.content.substring(0, 50)}...`);
        console.log(`   ID: ${msg.id}`);
        console.log(`   Conversation ID: ${msg.conversation_id}`);
      });
    }
    
    // 2. Проверяем статистику по диалогам
    console.log('\n📊 Проверяем статистику по диалогам...');
    const conversations = await client.query(`
      SELECT 
        c.id as conversation_id,
        u1.username as user1,
        u2.username as user2,
        COUNT(m.id) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN messages m ON m.conversation_id = c.id 
        AND m.recipient_id = $1 
        AND m.read_status = false
        AND m.deleted_at IS NULL
      WHERE c.user1_id = $1 OR c.user2_id = $1
      GROUP BY c.id, u1.username, u2.username
      HAVING COUNT(m.id) > 0
      ORDER BY unread_count DESC
    `, [userId]);
    
    if (conversations.rows.length > 0) {
      console.log(`\nНайдено ${conversations.rows.length} диалогов с непрочитанными сообщениями:`);
      conversations.rows.forEach((conv, idx) => {
        console.log(`${idx + 1}. ${conv.user1} ↔ ${conv.user2}: ${conv.unread_count} непрочитанных`);
        console.log(`   Conversation ID: ${conv.conversation_id}`);
      });
    }
    
    // ОПЦИИ ОЧИСТКИ
    console.log('\n' + '='.repeat(60));
    console.log('ОПЦИИ ОЧИСТКИ:');
    console.log('='.repeat(60));
    
    const totalUnread = conversationMessages.rows.length;
    
    if (totalUnread === 0) {
      console.log('✅ Непрочитанных сообщений не найдено!');
      return;
    }
    
    console.log(`\nВсего непрочитанных сообщений: ${totalUnread}`);
    console.log('\nЧтобы отметить все сообщения как прочитанные, выполните:');
    console.log('\n--- ВАРИАНТ 1: Отметить все личные сообщения как прочитанные ---');
    console.log('node clear_unread_messages.cjs --mark-read-conversations');
    
    console.log('\n--- ВАРИАНТ 2: Удалить все непрочитанные сообщения (софт-удаление) ---');
    console.log('node clear_unread_messages.cjs --soft-delete');
    
    console.log('\n--- ВАРИАНТ 3: Удалить конкретный диалог ---');
    if (conversations.rows.length > 0) {
      console.log(`node clear_unread_messages.cjs --delete-conversation ${conversations.rows[0].conversation_id}`);
    }
    
    // Выполнение действий
    const args = process.argv.slice(2);
    
    if (args.includes('--mark-read-conversations')) {
      console.log('\n🔄 Отмечаем все сообщения как прочитанные...');
      const result = await client.query(`
        UPDATE messages 
        SET read_status = true 
        WHERE recipient_id = $1 
          AND read_status = false
          AND deleted_at IS NULL
          AND conversation_id IS NOT NULL
      `, [userId]);
      console.log(`✅ Отмечено как прочитанные: ${result.rowCount} сообщений`);
    }
    
    if (args.includes('--soft-delete')) {
      console.log('\n🗑️  Выполняем софт-удаление непрочитанных сообщений...');
      const result = await client.query(`
        UPDATE messages 
        SET deleted_at = NOW(),
            deleted_by = $1
        WHERE recipient_id = $1 
          AND read_status = false
          AND deleted_at IS NULL
          AND conversation_id IS NOT NULL
      `, [userId]);
      console.log(`✅ Удалено: ${result.rowCount} сообщений`);
    }
    
    const deleteConvIdx = args.findIndex(arg => arg === '--delete-conversation');
    if (deleteConvIdx !== -1 && args[deleteConvIdx + 1]) {
      const conversationId = args[deleteConvIdx + 1];
      console.log(`\n🗑️  Удаляем все сообщения в диалоге ${conversationId}...`);
      const result = await client.query(`
        UPDATE messages 
        SET deleted_at = NOW(),
            deleted_by = $1
        WHERE conversation_id = $2
          AND deleted_at IS NULL
      `, [userId, conversationId]);
      console.log(`✅ Удалено: ${result.rowCount} сообщений из диалога`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n✅ Соединение закрыто');
  }
}

clearUnreadMessages();
