import fetch from "node-fetch";

let handler = async (
  m,
  { conn, text, usedPrefix, command, isAdmin, isOwner, groupMetadata }
) => {
  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      `❌ *COMANDO SOLO PARA GRUPOS*\n\n▸ 𝚂𝚘𝚕𝚘 𝚙𝚞𝚎𝚍𝚎 𝚞𝚜𝚊𝚛𝚜𝚎 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜`,
      m
    );
  }

  const chat = global.db.data.chats[m.chat];

  // Verificar si es admin/owner
  const participants = await conn
    .groupMetadata(m.chat)
    .catch(() => ({ participants: [] }));
  const user = participants.participants.find((p) => p.id === m.sender);
  const isUserAdmin =
    user && (user.admin === "admin" || user.admin === "superadmin");
  const isJefe = isOwner || (user && user.admin === "superadmin"); // Jefe = Owner o superadmin

  if (!isUserAdmin && !isOwner) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      `🚫 *NO ERES ADMIN*\n\n▸ 𝚂𝚘𝚕𝚘 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚌𝚊𝚖𝚋𝚒𝚊𝚛 𝚎𝚕 𝚙𝚛𝚎𝚏𝚒𝚓𝚘`,
      m
    );
  }

  const args = text.split(" ");
  const subcmd = args[0]?.toLowerCase();

  if (command === "setprefix") {
    if (!subcmd) {
      // Mostrar prefijo actual
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });

      const currentPrefix = chat.prefix || "𝙶𝚕𝚘𝚋𝚊𝚕𝚎𝚜";
      const customPrefixes = chat.prefixes || [];

      let mensaje = `⚙️ *𝙿𝚁𝙴𝙵𝙸𝙹𝙾 𝙰𝙲𝚃𝚄𝙰𝙻*\n\n`;
      mensaje += `▸ 𝙿𝚛𝚎𝚏𝚒𝚓𝚘: ${currentPrefix}\n`;

      if (customPrefixes.length > 0) {
        mensaje += `▸ 𝙰𝚍𝚒𝚌𝚒𝚘𝚗𝚊𝚕𝚎𝚜:\n`;
        customPrefixes.forEach((p, i) => {
          mensaje += `  • ${p}\n`;
        });
      }

      mensaje += `\n📝 *𝚄𝚜𝚘:* ${usedPrefix}setprefix <𝚙𝚛𝚎𝚏𝚒𝚓𝚘>`;

      return conn.reply(m.chat, mensaje, m);
    }

    const newPrefix = args[0];

    // Validaciones breves
    if (newPrefix.length > 3) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(
        m.chat,
        `❌ 𝙼𝙰𝚇 3 𝙲𝙰𝚁𝙰𝙲𝚃𝙴𝚁𝙴𝚂\n\n▸ 𝙴𝚕 𝚙𝚛𝚎𝚏𝚒𝚓𝚘 𝚗𝚘 𝚙𝚞𝚎𝚍𝚎 𝚜𝚎𝚛 𝚝𝚊𝚗 𝚕𝚊𝚛𝚐𝚘`,
        m
      );
    }

    if (newPrefix.includes(" ")) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(
        m.chat,
        `❌ 𝚂𝙸𝙽 𝙴𝚂𝙿𝙰𝙲𝙸𝙾𝚂\n\n▸ 𝙽𝚘 𝚞𝚜𝚎𝚜 𝚎𝚜𝚙𝚊𝚌𝚒𝚘𝚜 𝚎𝚗 𝚎𝚕 𝚙𝚛𝚎𝚏𝚒𝚓𝚘`,
        m
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } }); // Jefe/Owner
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } }); // Admin normal
    }

    // Guardar el prefijo
    const oldPrefix = chat.prefix;
    chat.prefix = newPrefix;

    if (!chat.prefixes) chat.prefixes = [];
    if (!chat.prefixes.includes(newPrefix)) {
      chat.prefixes.push(newPrefix);
    }

    // Reacción de éxito
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    // Mensaje breve de confirmación
    const mensajeConfirmacion =
      `✅ *𝙿𝚁𝙴𝙵𝙸𝙹𝙾 𝙲𝙰𝙼𝙱𝙸𝙰𝙳𝙾*\n\n` +
      `▸ 𝙰𝚗𝚝𝚎𝚛𝚒𝚘𝚛: ${oldPrefix || "𝙶𝚕𝚘𝚋𝚊𝚕𝚎𝚜"}\n` +
      `▸ 𝙽𝚞𝚎𝚟𝚘: ${newPrefix}\n` +
      `▸ 𝙲𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊𝚍𝚘 𝚙𝚘𝚛: ${isJefe ? "👑 𝙹𝚎𝚏𝚎" : "⚙️ 𝙰𝚍𝚖𝚒𝚗"}`;

    return conn.reply(m.chat, mensajeConfirmacion, m);
  } else if (command === "delprefix") {
    // Verificar si hay prefijo personalizado
    if (!chat.prefix) {
      await conn.sendMessage(m.chat, { react: { text: "ℹ️", key: m.key } });
      return conn.reply(
        m.chat,
        `ℹ️ *𝚂𝙸𝙽 𝙿𝚁𝙴𝙵𝙸𝙹𝙾 𝙿𝙴𝚁𝚂𝙾𝙽𝙰𝙻*\n\n▸ 𝙴𝚕 𝚐𝚛𝚞𝚙𝚘 𝚢𝚊 𝚞𝚜𝚊 𝚙𝚛𝚎𝚏𝚒𝚓𝚘𝚜 𝚐𝚕𝚘𝚋𝚊𝚕𝚎𝚜`,
        m
      );
    }

    // Reacción según jerarquía
    if (isJefe) {
      await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });
    } else {
      await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });
    }

    // Quitar prefijo personalizado
    const oldPrefix = chat.prefix;
    chat.prefix = null;

    if (chat.prefixes) {
      const index = chat.prefixes.indexOf(oldPrefix);
      if (index > -1) {
        chat.prefixes.splice(index, 1);
      }
    }

    // Reacción de éxito
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    // Mensaje breve
    return conn.reply(
      m.chat,
      `✅ *𝙿𝚁𝙴𝙵𝙸𝙹𝙾 𝙴𝙻𝙸𝙼𝙸𝙽𝙰𝙳𝙾*\n\n▸ 𝚂𝚎 𝚎𝚕𝚒𝚖𝚒𝚗𝚘́: ${oldPrefix}\n▸ 𝚂𝚎 𝚛𝚎𝚜𝚝𝚊𝚞𝚛𝚊𝚗 𝚕𝚘𝚜 𝚙𝚛𝚎𝚏𝚒𝚓𝚘𝚜 𝚐𝚕𝚘𝚋𝚊𝚕𝚎𝚜`,
      m
    );
  }
};

handler.help = ["setprefix [prefijo]", "delprefix"];
handler.tags = ["grupo"];
handler.command = ["setprefix", "delprefix"];
handler.group = true;
handler.admin = true;

export default handler;
