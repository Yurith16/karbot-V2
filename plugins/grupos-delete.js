let handler = async (m, { conn, isGroup }) => {
  if (!m.quoted) {
    return conn.reply(
      m.chat,
      "❌ *𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰 𝚄𝙽 𝙼𝙴𝙽𝚂𝙰𝙹𝙴*\n\n▸ 𝚁𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊𝚕 𝚖𝚎𝚗𝚜𝚊𝚓𝚎 𝚚𝚞𝚎 𝚚𝚞𝚒𝚎𝚛𝚎𝚜 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚛",
      m
    );
  }

  try {
    const botJid = conn.decodeJid(conn.user.id);
    const senderJid = conn.decodeJid(m.sender);
    const quoted = m.quoted;
    const quotedJid = conn.decodeJid(quoted.sender);

    const stanzaId = quoted.id;
    const participant = quoted.participant || quotedJid;

    if (!stanzaId || !participant) {
      return conn.reply(
        m.chat,
        "❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚒𝚍𝚎𝚗𝚝𝚒𝚏𝚒𝚌𝚊𝚛 𝚎𝚕 𝚖𝚎𝚗𝚜𝚊𝚓𝚎",
        m
      );
    }

    // Reacción de procesamiento
    await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

    if (quotedJid === botJid) {
      // Eliminar mensaje propio del bot
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: true,
          id: stanzaId,
        },
      });
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      return;
    } else {
      // En grupos, verificar permisos
      if (isGroup) {
        const { participants } = await conn.groupMetadata(m.chat);
        const isAdmin = (jid) =>
          participants.some(
            (p) => p.id === jid && /admin|superadmin/i.test(p.admin || "")
          );

        if (!isAdmin(senderJid)) {
          await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
          return conn.reply(
            m.chat,
            "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚛 𝚖𝚎𝚗𝚜𝚊𝚓𝚎𝚜",
            m
          );
        }

        if (!isAdmin(botJid)) {
          await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
          return conn.reply(
            m.chat,
            "🚫 *𝙽𝙾 𝚂𝙾𝚈 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚘 𝚜𝚎𝚛 𝚊𝚍𝚖𝚒𝚗 𝚙𝚊𝚛𝚊 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚛 𝚖𝚎𝚗𝚜𝚊𝚓𝚎𝚜",
            m
          );
        }
      }

      // Eliminar mensaje de otro usuario
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: stanzaId,
          participant: participant,
        },
      });
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    }
  } catch (err) {
    console.error("[❌ ERROR delete]", err);
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    conn.reply(
      m.chat,
      "❌ *𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙴𝙻𝙸𝙼𝙸𝙽𝙰𝚁*\n\n▸ 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚙𝚞𝚎𝚍𝚎 𝚎𝚜𝚝𝚊𝚛 𝚕𝚒𝚖𝚒𝚝𝚊𝚗𝚍𝚘 𝚎𝚜𝚝𝚊 𝚊𝚌𝚌𝚒ó𝚗",
      m
    );
  }
};

handler.help = ["delete"];
handler.tags = ["grupo"];
handler.command = ["del", "delete"];
handler.botAdmin = true;
handler.admin = true;

export default handler;
