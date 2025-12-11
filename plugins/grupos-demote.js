const handler = async (
  m,
  { conn, text, participants, isAdmin, isBotAdmin }
) => {
  if (!m.isGroup) {
    return conn.reply(
      m.chat,
      "❌ *𝚂𝙾𝙻𝙾 𝙶𝚁𝚄𝙿𝙾𝚂*\n\n▸ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚏𝚞𝚗𝚌𝚒𝚘𝚗𝚊 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜",
      m
    );
  }

  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝚂𝙾𝚈 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚘 𝚜𝚎𝚛 𝚊𝚍𝚖𝚒𝚗 𝚙𝚊𝚛𝚊 𝚚𝚞𝚒𝚝𝚊𝚛 𝚊𝚍𝚖𝚒𝚗𝚜",
      m
    );
  }

  if (!isAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚚𝚞𝚒𝚝𝚊𝚛 𝚊𝚍𝚖𝚒𝚗𝚜",
      m
    );
  }

  let targetUser = null;

  // Buscar usuario mencionado
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    targetUser = m.mentionedJid[0];
  }
  // Buscar usuario del mensaje citado
  else if (m.quoted) {
    targetUser = m.quoted.sender;
  }

  if (!targetUser) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝙼𝙴𝙽𝙲𝙸𝙾𝙽𝙰 𝚄𝙽 𝚄𝚂𝚄𝙰𝚁𝙸𝙾*\n\n▸ 𝙼𝚎𝚗𝚌𝚒𝚘𝚗𝚊 𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊 𝚞𝚗 𝚞𝚜𝚞𝚊𝚛𝚒𝚘",
      m
    );
  }

  // Verificar que está en el grupo
  const userInGroup = participants.find((p) => p.id === targetUser);
  if (!userInGroup) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝚄𝚂𝚄𝙰𝚁𝙸𝙾 𝙽𝙾 𝙴𝚂𝚃Á*\n\n▸ 𝙴𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘 𝚗𝚘 𝚎𝚜𝚝á 𝚎𝚗 𝚎𝚕 𝚐𝚛𝚞𝚙𝚘",
      m
    );
  }

  // No quitar admin al creador
  if (userInGroup.admin === "superadmin") {
    await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    return conn.reply(
      m.chat,
      "👑 *𝙽𝙾 𝚂𝙴 𝙿𝚄𝙴𝙳𝙴*\n\n▸ 𝙽𝚘 𝚙𝚞𝚎𝚍𝚘 𝚚𝚞𝚒𝚝𝚊𝚛 𝚊𝚍𝚖𝚒𝚗 𝚊𝚕 𝚌𝚛𝚎𝚊𝚍𝚘𝚛",
      m
    );
  }

  // Verificar si es admin
  if (userInGroup.admin !== "admin") {
    await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
    return conn.reply(
      m.chat,
      "ℹ️ *𝚈𝙰 𝙽𝙾 𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝙴𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘 𝚢𝚊 𝚗𝚘 𝚎𝚜 𝚊𝚍𝚖𝚒𝚗",
      m
    );
  }

  // Reacción de procesamiento
  await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

  try {
    await conn.groupParticipantsUpdate(m.chat, [targetUser], "demote");
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    return conn.reply(
      m.chat,
      `✅ *𝙰𝙳𝙼𝙸𝙽 𝚀𝚄𝙸𝚃𝙰𝙳𝙾*\n\n▸ @${
        targetUser.split("@")[0]
      } 𝚑𝚊 𝚜𝚒𝚍𝚘 𝚚𝚞𝚒𝚝𝚊𝚍𝚘 𝚍𝚎 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜`,
      m,
      { mentions: [targetUser] }
    );
  } catch (error) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚚𝚞𝚒𝚝𝚊𝚛 𝚊𝚍𝚖𝚒𝚗 𝚊𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘",
      m
    );
  }
};

handler.help = ["demote @usuario"];
handler.tags = ["grupo"];
handler.command = /^(demote|quitaradmin)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
