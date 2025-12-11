const { generateWAMessageFromContent, proto } = await import(
  "@whiskeysockets/baileys"
);

let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup) {
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

  try {
    await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

    const groupCode = await conn.groupInviteCode(m.chat);
    const inviteLink = `https://chat.whatsapp.com/${groupCode}`;

    // Mensaje con botón interactivo para copiar
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `╭━━━〔 🔗  𝙺𝙰𝚁𝙱𝙾𝚃 🔗  〕━━━⬣
║ 🔗 𝙾𝙿𝙲𝙸Ó𝙽: LINK DEL GRUPO
║ 🔗 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Enlace de invitación
║ 🔗 𝙰𝙲𝙲𝙸Ó𝙽: Presiona el botón para copiar
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "ᴋᴀʀʙᴏᴛ • ɢʀᴏᴜᴘ ᴀᴅᴍɪɴ",
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: false,
              }),
              nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [
                    {
                      name: "cta_copy",
                      buttonParamsJson: JSON.stringify({
                        display_text: "📋 𝙲𝙾𝙿𝙸𝙰𝚁 𝙴𝙽𝙻𝙰𝙲𝙴",
                        copy_code: `${inviteLink}`,
                      }),
                    },
                  ],
                }),
            }),
          },
        },
      },
      { quoted: m }
    );

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id,
    });

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch (error) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      `╭━━━〔 ❌  𝙺𝙰𝚁𝙱𝙾𝚃 ❌  〕━━━⬣
║ ❌ 𝙴𝚁𝚁𝙾𝚁: NO SE PUDO GENERAR
║ ❌ 𝙲𝙾𝙼𝙰𝙽𝙳𝙼𝙾: ${usedPrefix}${command}
║ ❌ 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸Ó𝙽: Error al obtener enlace
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
      m
    );
  }
};

handler.help = ["link"];
handler.tags = ["grupo"];
handler.command = ["link", "enlace"];
handler.group = true;
handler.botAdmin = true;

export default handler;
