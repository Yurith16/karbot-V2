let handler = async (
  m,
  { conn, args, usedPrefix, command, isAdmin, isBotAdmin }
) => {
  if (!m.isGroup) {
    return conn.reply(
      m.chat,
      "❌ *𝚂𝙾𝙻𝙾 𝙶𝚁𝚄𝙿𝙾𝚂*\n\n▸ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚏𝚞𝚗𝚌𝚒𝚘𝚗𝚊 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜",
      m
    );
  }

  if (!isAdmin) {
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚌𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊𝚛 𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔",
      m
    );
  }

  const action = args[0]?.toLowerCase();
  if (!global.antilink) global.antilink = {};

  if (!action) {
    const estado = global.antilink[m.chat] ? "✅ 𝙰𝙲𝚃𝙸𝚅𝙾" : "❌ 𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙾";
    await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
    return conn.reply(
      m.chat,
      `⚙️ *𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺*\n\n▸ 𝙴𝚜𝚝𝚊𝚍𝚘: ${estado}\n▸ 𝚄𝚜𝚘: ${usedPrefix}antilink <on/off>`,
      m
    );
  }

  if (action === "on" || action === "off") {
    // Reacción de procesamiento
    await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

    if (action === "on") {
      global.antilink[m.chat] = true;
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      return conn.reply(m.chat, "✅ *𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*", m);
    } else {
      delete global.antilink[m.chat];
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      return conn.reply(m.chat, "✅ *𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*", m);
    }
  }

  // Si no es on/off válido
  await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
  return conn.reply(
    m.chat,
    `❌ *𝙾𝙿𝙲𝙸𝙾́𝙽 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙰*\n\n▸ 𝚄𝚜𝚘: ${usedPrefix}antilink <on/off>`,
    m
  );
};

handler.before = async (m, { conn, isAdmin, isBotAdmin }) => {
  if (m.isBaileys || !m.isGroup || isAdmin || !global.antilink?.[m.chat])
    return;

  const text = m.text || m.caption || "";
  if (!text) return;

  // TODOS los enlaces prohibidos
  const links =
    /https?:\/\/[^\s]*|www\.[^\s]*|wa\.me\/[0-9]+|chat\.whatsapp\.com\/[A-Za-z0-9]+|t\.me\/[^\s]*|instagram\.com\/[^\s]*|facebook\.com\/[^\s]*|youtube\.com\/[^\s]*|youtu\.be\/[^\s]*|twitter\.com\/[^\s]*|x\.com\/[^\s]*|discord\.gg\/[^\s]*|tiktok\.com\/[^\s]*|bit\.ly\/[^\s]*|tinyurl\.com\/[^\s]*|goo\.gl\/[^\s]*|ow\.ly\/[^\s]*|buff\.ly\/[^\s]*|adf\.ly\/[^\s]*|shorte\.st\/[^\s]*|snip\.ly\/[^\s]*|cutt\.ly\/[^\s]*|is\.gd\/[^\s]*|v\.gd\/[^\s]*|cli\.gs\/[^\s]*|bc\.vc\/[^\s]*|tr\.im\/[^\s]*|prettylink\.pro\/[^\s]*|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi;

  if (links.test(text)) {
    try {
      // Eliminar mensaje inmediatamente
      if (isBotAdmin && m.key) {
        await conn.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.sender,
          },
        });
      }

      // Expulsar usuario inmediatamente
      if (isBotAdmin) {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
      }
    } catch (error) {
      // Silenciar errores
    }
  }
};

handler.help = ["antilink <on/off>"];
handler.tags = ["grupo"];
handler.command = ["antilink"];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
