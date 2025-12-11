let handler = async (m, { conn, participants, isAdmin, isBotAdmin }) => {
  if (!isAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛 𝚞𝚜𝚞𝚊𝚛𝚒𝚘𝚜",
      m
    );
  }

  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝚂𝙾𝚈 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚘 𝚜𝚎𝚛 𝚊𝚍𝚖𝚒𝚗 𝚙𝚊𝚛𝚊 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛 𝚞𝚜𝚞𝚊𝚛𝚒𝚘𝚜",
      m
    );
  }

  let mentionedJid = await m.mentionedJid;
  let user =
    mentionedJid && mentionedJid.length
      ? mentionedJid[0]
      : m.quoted && (await m.quoted.sender)
      ? await m.quoted.sender
      : null;

  if (!user) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝙼𝙴𝙽𝙲𝙸𝙾𝙽𝙰 𝚄𝙽 𝚄𝚂𝚄𝙰𝚁𝙸𝙾*\n\n▸ 𝙼𝚎𝚗𝚌𝚒𝚘𝚗𝚊 𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊 𝚞𝚗 𝚞𝚜𝚞𝚊𝚛𝚒𝚘",
      m
    );
  }

  try {
    const groupInfo = await conn.groupMetadata(m.chat);
    const ownerGroup =
      groupInfo.owner || m.chat.split`-`[0] + "@s.whatsapp.net";
    const ownerBot = global.owner?.[0]?.[0] + "@s.whatsapp.net" || "";

    if (user === conn.user.jid) {
      await conn.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });
      return conn.reply(
        m.chat,
        "🤖 *𝙽𝙾 𝙿𝚄𝙴𝙳𝙾*\n\n▸ 𝙽𝚘 𝚙𝚞𝚎𝚍𝚘 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛𝚖𝚎 𝚊 𝚖í 𝚖𝚒𝚜𝚖𝚘",
        m
      );
    }

    if (user === ownerGroup) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
      return conn.reply(
        m.chat,
        "👑 *𝙽𝙾 𝙿𝚄𝙴𝙳𝙾*\n\n▸ 𝙽𝚘 𝚙𝚞𝚎𝚍𝚘 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛 𝚊𝚕 𝚌𝚛𝚎𝚊𝚍𝚘𝚛 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘",
        m
      );
    }

    if (user === ownerBot) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
      return conn.reply(
        m.chat,
        "👑 *𝙽𝙾 𝙿𝚄𝙴𝙳𝙾*\n\n▸ 𝙽𝚘 𝚙𝚞𝚎𝚍𝚘 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛 𝚊𝚕 𝚍𝚞𝚎𝚗̃𝚘 𝚍𝚎𝚕 𝚋𝚘𝚝",
        m
      );
    }

    // Reacción de procesamiento
    await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

    // Expulsar al usuario
    await conn.groupParticipantsUpdate(m.chat, [user], "remove");

    // Reacción de éxito
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    // Mensaje de confirmación
    return conn.reply(
      m.chat,
      `✅ *𝚄𝚂𝚄𝙰𝚁𝙸𝙾 𝙴𝚇𝙿𝚄𝙻𝚂𝙰𝙳𝙾*\n\n▸ @${
        user.split("@")[0]
      } 𝚑𝚊 𝚜𝚒𝚍𝚘 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘`,
      m,
      { mentions: [user] }
    );
  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛 𝚊𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘",
      m
    );
  }
};

handler.help = ["kick @usuario"];
handler.tags = ["grupo"];
handler.command = ["kick", "expulsar"];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
