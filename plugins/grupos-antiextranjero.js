let handler = async (m, { conn, usedPrefix, command, isAdmin, isROwner }) => {
  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return m.reply(
      "❌ *𝚂𝙾𝙻𝙾 𝙶𝚁𝚄𝙿𝙾𝚂*\n\n▸ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚏𝚞𝚗𝚌𝚒𝚘𝚗𝚊 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜"
    );
  }

  if (!isAdmin && !isROwner) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return m.reply(
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚞𝚜𝚊𝚛 𝚎𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘"
    );
  }

  let chat = global.db.data.chats[m.chat];
  let args = m.text.trim().split(" ").slice(1);
  let action = args[0]?.toLowerCase();

  // Verificar jerarquía
  const isJefe =
    isROwner || m.sender === m.chat.split("@")[0] + "@s.whatsapp.net";

  if (!action || (action !== "on" && action !== "off")) {
    await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
    let status = chat.antiExtranjero ? "✅ 𝙰𝙲𝚃𝙸𝚅𝙾" : "❌ 𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙾";
    return m.reply(
      `⚙️ *𝙰𝙽𝚃𝙸-𝙴𝚇𝚃𝚁𝙰𝙽𝙹𝙴𝚁𝙾*\n\n▸ 𝙴𝚜𝚝𝚊𝚍𝚘: ${status}\n▸ 𝚄𝚜𝚘: ${usedPrefix}antiextranjero <on/off>`
    );
  }

  if (action === "on") {
    if (chat.antiExtranjero) {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return m.reply(
        "ℹ️ *𝚈𝙰 𝙴𝚂𝚃𝙰 𝙰𝙲𝚃𝙸𝚅𝙾*\n\n▸ 𝙴𝚕 𝚊𝚗𝚝𝚒-𝚎𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘 𝚢𝚊 𝚎𝚜𝚝á 𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘"
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
    }

    chat.antiExtranjero = true;
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    const userMention = isJefe ? "👑 𝙹𝚎𝚏𝚎" : `@${m.sender.split("@")[0]}`;
    return m.reply(`✅ *𝙰𝙽𝚃𝙸-𝙴𝚇𝚃𝚁𝙰𝙽𝙹𝙴𝚁𝙾 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n\n▸ 𝙿𝚘𝚛: ${userMention}`);
  } else if (action === "off") {
    if (!chat.antiExtranjero) {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return m.reply(
        "ℹ️ *𝚈𝙰 𝙴𝚂𝚃𝙰 𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙾*\n\n▸ 𝙴𝚕 𝚊𝚗𝚝𝚒-𝚎𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘 𝚢𝚊 𝚎𝚜𝚝á 𝚍𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘"
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
    }

    chat.antiExtranjero = false;
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    const userMention = isJefe ? "👑 𝙹𝚎𝚏𝚎" : `@${m.sender.split("@")[0]}`;
    return m.reply(`✅ *𝙰𝙽𝚃𝙸-𝙴𝚇𝚃𝚁𝙰𝙽𝙹𝙴𝚁𝙾 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n\n▸ 𝙿𝚘𝚛: ${userMention}`);
  }
};

handler.help = ["antiextranjero <on/off>"];
handler.tags = ["grupo"];
handler.command = /^(antiextranjero|antiforeign|antiextrange)$/i;
handler.group = true;
handler.admin = true;

export default handler;
