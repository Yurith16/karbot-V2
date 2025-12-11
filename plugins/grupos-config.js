let handler = async (
  m,
  { conn, args, usedPrefix, command, isAdmin, isBotAdmin, participants }
) => {
  if (!isAdmin) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚞𝚜𝚊𝚛 𝚎𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘",
      m
    );
  }

  const isClose = {
    abrir: "not_announcement",
    cerrar: "announcement",
    open: "not_announcement",
    close: "announcement",
  }[(args[0] || "").toLowerCase()];

  // 🟡 Mostrar botones si no hay argumento
  if (isClose === undefined) {
    await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

    const texto = `⚙️ *𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝚁 𝙶𝚁𝚄𝙿𝙾*\n\n▸ 𝚂𝚎𝚕𝚎𝚌𝚌𝚒𝚘𝚗𝚊 𝚞𝚗𝚊 𝚘𝚙𝚌𝚒ó𝚗:`;

    const botones = [
      {
        buttonId: `${usedPrefix + command} cerrar`,
        buttonText: { displayText: "🔒 𝙲𝙴𝚁𝚁𝙰𝚁" },
        type: 1,
      },
      {
        buttonId: `${usedPrefix + command} abrir`,
        buttonText: { displayText: "🔓 𝙰𝙱𝚁𝙸𝚁" },
        type: 1,
      },
    ];

    await conn.sendMessage(
      m.chat,
      {
        text: texto,
        footer: "KARBOT • 𝙰𝙳𝙼𝙸𝙽",
        buttons: botones,
        headerType: 4,
      },
      { quoted: m }
    );

    return;
  }

  // 🟢 Ejecutar la acción elegida
  await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
  await conn.groupSettingUpdate(m.chat, isClose);

  let message = "";
  if (args[0].toLowerCase() === "cerrar" || args[0].toLowerCase() === "close") {
    await conn.sendMessage(m.chat, { react: { text: "🔒", key: m.key } });
    message =
      "✅ *𝙶𝚁𝚄𝙿𝙾 𝙲𝙴𝚁𝚁𝙰𝙳𝙾*\n\n▸ 𝙴𝚕 𝚐𝚛𝚞𝚙𝚘 𝚊𝚑𝚘𝚛𝚊 𝚎𝚜𝚝á 𝚌𝚎𝚛𝚛𝚊𝚍𝚘\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚎𝚗𝚟𝚒𝚊𝚛 𝚖𝚎𝚗𝚜𝚊𝚓𝚎𝚜";
  } else {
    await conn.sendMessage(m.chat, { react: { text: "🔓", key: m.key } });
    message =
      "✅ *𝙶𝚁𝚄𝙿𝙾 𝙰𝙱𝙸𝙴𝚁𝚃𝙾*\n\n▸ 𝙴𝚕 𝚐𝚛𝚞𝚙𝚘 𝚊𝚑𝚘𝚛𝚊 𝚎𝚜𝚝á 𝚊𝚋𝚒𝚎𝚛𝚝𝚘\n▸ 𝚃𝚘𝚍𝚘𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚎𝚗𝚟𝚒𝚊𝚛 𝚖𝚎𝚗𝚜𝚊𝚓𝚎𝚜";
  }

  return conn.reply(m.chat, message, m);
};

handler.help = ["group <abrir/cerrar>"];
handler.tags = ["grupo"];
handler.command = ["group", "grupo", "cerrar", "abrir"];
handler.admin = true;
handler.botAdmin = true;

export default handler;
