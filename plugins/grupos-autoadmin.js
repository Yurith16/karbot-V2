let autoadminGlobal = global.autoadminGlobal ?? true;
global.autoadminGlobal = autoadminGlobal;

const handler = async (
  m,
  { conn, isAdmin, isBotAdmin, isROwner, usedPrefix, command, args }
) => {
  // Si el comando está desactivado globalmente
  if (!global.autoadminGlobal && !isROwner) {
    return conn.reply(
      m.chat,
      "❌ *𝚂𝙸𝚂𝚃𝙴𝙼𝙰 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n\n▸ 𝙴𝚕 𝚊𝚞𝚝𝚘𝚊𝚍𝚖𝚒𝚗 𝚎𝚜𝚝á 𝚍𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘 𝚐𝚕𝚘𝚋𝚊𝚕𝚖𝚎𝚗𝚝𝚎",
      m
    );
  }

  // Si el bot no es admin
  if (!isBotAdmin) {
    return conn.reply(
      m.chat,
      "❌ *𝙽𝙾 𝚂𝙾𝚈 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚘 𝚜𝚎𝚛 𝚊𝚍𝚖𝚒𝚗 𝚙𝚊𝚛𝚊 𝚙𝚛𝚘𝚖𝚘𝚟𝚎𝚛",
      m
    );
  }

  // Si ya es admin
  if (isAdmin) {
    return conn.reply(
      m.chat,
      "ℹ️ *𝚈𝙰 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚈𝚊 𝚝𝚒𝚎𝚗𝚎𝚜 𝚙𝚛𝚒𝚟𝚒𝚕𝚎𝚐𝚒𝚘𝚜 𝚍𝚎 𝚊𝚍𝚖𝚒𝚗",
      m
    );
  }

  try {
    // Reacción de espera
    await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });

    // Promover usuario
    await conn.groupParticipantsUpdate(m.chat, [m.sender], "promote");

    // Reacción de éxito
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    // Mensaje simple
    return conn.reply(
      m.chat,
      `✅ *𝙿𝚁𝙾𝙼𝙾𝚅𝙸𝙳𝙾 𝙰 𝙰𝙳𝙼𝙸𝙽*\n\n▸ @${
        m.sender.split("@")[0]
      } 𝚑𝚊 𝚜𝚒𝚍𝚘 𝚙𝚛𝚘𝚖𝚘𝚟𝚒𝚍𝚘 𝚊 𝚊𝚍𝚖𝚒𝚗𝚒𝚜𝚝𝚛𝚊𝚍𝚘𝚛`,
      m,
      { mentions: [m.sender] }
    );
  } catch (error) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚙𝚛𝚘𝚖𝚘𝚟𝚎𝚛 𝚊𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘",
      m
    );
  }
};

handler.help = ["autoadmin"];
handler.tags = ["grupo"];
handler.command = ["autoadmin"];
handler.group = true;

export default handler;
