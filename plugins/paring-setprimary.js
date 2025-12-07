// plugins/paring-setprimary.js

const handler = async (m, { conn, args, usedPrefix, command }) => {
  // Emoji de reacción inicial
  await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } });
  
  // Asegurarse de que la configuración del chat exista
  if (!global.db?.data?.chats?.[m.chat]) {
    return conn.reply(m.chat, `> ⚠︎ Error: La configuración de este grupo no está disponible.`, m);
  }
  const chat = global.db.data.chats[m.chat];

  // Determinar la acción: on, off, o estado actual
  const action = args[0]?.toLowerCase();

  if (!action) {
    // Si no se proporciona una acción, mostrar el estado actual
    const status = chat.onlyMainBot ? 'activado' : 'desactivado';
    await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });
    return conn.reply(m.chat, `> 🤖 El modo exclusivo (solo Bot Principal) está actualmente **${status}**.\n\n> Usa:\n> • *${usedPrefix + command} on* para activarlo.\n> • *${usedPrefix + command} off* para desactivarlo.`, m);
  }

  if (action === 'on') {
    if (chat.onlyMainBot) {
      await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } });
      return conn.reply(m.chat, `> ✅️ El modo exclusivo ya estaba activado.`, m);
    }
    chat.onlyMainBot = true;
    await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } });
    return conn.reply(m.chat, `> 🌱 Modo exclusivo **activado**.\n> A partir de ahora, solo el Bot Principal responderá a los comandos en este grupo.`, m);
  }

  if (action === 'off') {
    if (!chat.onlyMainBot) {
      await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } });
      return conn.reply(m.chat, `> ✅️ El modo exclusivo ya estaba desactivado.`, m);
    }
    chat.onlyMainBot = false;
    await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
    return conn.reply(m.chat, `> ✖️ Modo exclusivo **desactivado**.\n> Ahora todos los bots (principal y sub-bots) podrán responder.`, m);
  }

  // Si la acción no es 'on' ni 'off'
  await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
  return conn.reply(m.chat, `> ❌ Opción no válida.\n\n> Usa:\n> • *${usedPrefix + command} on* para activar.\n> • *${usedPrefix + command} off* para desactivar.`, m);
};

handler.help = ['setprimary'];
handler.tags = ['group', 'admin'];
handler.command = ['setprimary'];
handler.group = true;
handler.admin = true;

export default handler;