let handler = async (m, { conn, usedPrefix, command, isAdmin, isROwner }) => {
  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: SOLO GRUPOS
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Solo funciona en grupos
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }

  // Verificar jerarquía
  const isJefe =
    isROwner || m.sender === m.chat.split("@")[0] + "@s.whatsapp.net";

  if (!isAdmin && !isROwner) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      `╭━━━〔 🚫  𝙺𝙰𝚁𝙱𝙾𝚃 🚫  〕━━━⬣
║ 🚫 𝙴𝚁𝚁𝙾𝚁: NO ERES ADMIN
║ 🚫 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ 🚫 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Solo admins pueden configurar
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }

  let chat = global.db.data.chats[m.chat];
  let args = m.text.trim().split(" ").slice(1);
  let action = args[0]?.toLowerCase();

  if (!action || (action !== "on" && action !== "off")) {
    await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
    let status = chat.adminmode ? "🟢 ACTIVO" : "🔴 INACTIVO";
    return conn.reply(
      m.chat,
      `╭━━━〔 ⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️  〕━━━⬣
║ ⚙️ 𝙾𝙿𝙲𝙸Ó𝙽: MODO ADMIN
║ ⚙️ 𝙴𝚂𝚃𝙰𝙳𝙾: ${status}
║ ⚙️ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Bot solo responde a admins
║ ⚙️ 𝚄𝚂𝙾: ${usedPrefix}admin <on/off>
║ ⚙️ 𝙰𝙿𝙻𝙸𝙲𝙰 𝙰: ESTE CHAT
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }

  if (action === "on") {
    if (chat.adminmode) {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ℹ️  𝙺𝙰𝚁𝙱𝙾𝚃 ℹ️  〕━━━⬣
║ ℹ️ 𝙸𝙽𝙵𝙾: YA ACTIVADO
║ ℹ️ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ℹ️ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: El modo admin ya está activo
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
    }

    chat.adminmode = true;
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    const userMention = isJefe ? "👑 𝙹𝙴𝙵𝙴" : `@${m.sender.split("@")[0]}`;
    return conn.reply(
      m.chat,
      `╭━━━〔 ✅  𝙺𝙰𝚁𝙱𝙾𝚃 ✅  〕━━━⬣
║ ✅ 𝙾𝙿𝙲𝙸Ó𝙽: MODO ADMIN ACTIVADO
║ ✅ 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙳𝙾 𝙿𝙾𝚁: ${userMention}
║ ✅ 𝙴𝚂𝚃𝙰𝙳𝙾: 🟢 SOLO ADMINS
║ ✅ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Bot solo responde a admins
║ ✅ 𝙰𝙿𝙻𝙸𝙲𝙰 𝙰: ESTE CHAT
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  } else if (action === "off") {
    if (!chat.adminmode) {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ℹ️  𝙺𝙰𝚁𝙱𝙾𝚃 ℹ️  〕━━━⬣
║ ℹ️ 𝙸𝙽𝙵𝙾: YA INACTIVO
║ ℹ️ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ℹ️ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: El modo admin ya está inactivo
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
    }

    chat.adminmode = false;
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    const userMention = isJefe ? "👑 𝙹𝙴𝙵𝙴" : `@${m.sender.split("@")[0]}`;
    return conn.reply(
      m.chat,
      `╭━━━〔 ✅  𝙺𝙰𝚁𝙱𝙾𝚃 ✅  〕━━━⬣
║ ✅ 𝙾𝙿𝙲𝙸Ó𝙽: MODO ADMIN DESACTIVADO
║ ✅ 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙳𝙾 𝙿𝙾𝚁: ${userMention}
║ ✅ 𝙴𝚂𝚃𝙰𝙳𝙾: 🔴 TODOS LOS USUARIOS
║ ✅ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Bot responde a todos
║ ✅ 𝙰𝙿𝙻𝙸𝙲𝙰 𝙰: ESTE CHAT
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }
};

handler.help = ["admin <on/off>"];
handler.tags = ["grupo"];
handler.command = /^(admin)$/i;
handler.group = true;
handler.admin = true;

export default handler;
