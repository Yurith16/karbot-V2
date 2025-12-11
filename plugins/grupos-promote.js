const handler = async (
  m,
  { conn, text, participants, isAdmin, isBotAdmin, usedPrefix, command }
) => {
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

  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      `╭━━━〔 🚫  𝙺𝙰𝚁𝙱𝙾𝚃 🚫  〕━━━⬣
║ 🚫 𝙴𝚁𝚁𝙾𝚁: NO SOY ADMIN
║ 🚫 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ 🚫 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Necesito ser admin del grupo
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }

  if (!isAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      `╭━━━〔 🚫  𝙺𝙰𝚁𝙱𝙾𝚃 🚫  〕━━━⬣
║ 🚫 𝙴𝚁𝚁𝙾𝚁: NO ERES ADMIN
║ 🚫 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ 🚫 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Solo admins pueden promover
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }

  await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

  try {
    let targetUser = null;

    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetUser = m.mentionedJid[0];
    } else if (m.quoted) {
      targetUser = m.quoted.sender;
    }

    if (!targetUser) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: SIN USUARIO
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Menciona o responde a un usuario
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
    if (!groupMetadata) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: DATOS GRUPO
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Error al obtener datos
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    const userInGroup = groupMetadata.participants.find(
      (p) => p.id === targetUser
    );

    if (!userInGroup) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: NO EN GRUPO
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: El usuario no está en el grupo
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    if (userInGroup.admin === "admin" || userInGroup.admin === "superadmin") {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return conn.reply(
        m.chat,
        `╭━━━〔 ℹ️  𝙺𝙰𝚁𝙱𝙾𝚃 ℹ️  〕━━━⬣
║ ℹ️ 𝙸𝙽𝙵𝙾: YA ES ADMIN
║ ℹ️ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ℹ️ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: El usuario ya es administrador
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }

    await conn.groupParticipantsUpdate(m.chat, [targetUser], "promote");

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    return conn.reply(
      m.chat,
      `╭━━━〔 ✅  𝙺𝙰𝚁𝙱𝙾𝚃 ✅  〕━━━⬣
║ ✅ 𝙾𝙿𝙲𝙸Ó𝙽: USUARIO PROMOVIDO
║ ✅ 𝚄𝚂𝚄𝙰𝚁𝙸𝙾: @${targetUser.split("@")[0]}
║ ✅ 𝙰𝙲𝙲𝙸Ó𝙽: AHORA ES ADMINISTRADOR
║ ✅ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ✅ 𝙰𝙿𝙻𝙸𝙲𝙰 𝙰: ESTE CHAT
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m,
      { mentions: [targetUser] }
    );
  } catch (error) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

    if (error.message?.includes("not authorized")) {
      return conn.reply(
        m.chat,
        `╭━━━〔 🚫  𝙺𝙰𝚁𝙱𝙾𝚃 🚫  〕━━━⬣
║ 🚫 𝙴𝚁𝚁𝙾𝚁: SIN PERMISOS
║ 🚫 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ 🚫 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: No tengo permisos para promover
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    } else {
      return conn.reply(
        m.chat,
        `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: ERROR GENERAL
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: No se pudo promover al usuario
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
        m
      );
    }
  }
};

handler.help = ["promote @usuario"];
handler.tags = ["grupo"];
handler.command = /^(promote)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
