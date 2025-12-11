import {
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  proto,
} from "@whiskeysockets/baileys";

let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: "👑", key: m.key } });

    const menuText = `👑 *𝙾𝚆𝙽𝙴𝚁 𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉*`;

    const imageUrl =
      "https://image2url.com/images/1765485895849-14e8c32d-ea3e-4b5b-9faf-67f5c8c97757.jpg";

    // Botón único para contacto
    const nativeButtons = [
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "📞 𝙲𝙾𝙽𝚃𝙰𝙲𝚃𝙰𝚁",
          url: "https://wa.me/50496926150",
        }),
      },
    ];

    // Imagen desde URL
    const media = await prepareWAMessageMedia(
      { image: { url: imageUrl } },
      { upload: conn.waUploadToServer }
    );
    const header = proto.Message.InteractiveMessage.Header.fromObject({
      hasMediaAttachment: true,
      imageMessage: media.imageMessage,
    });

    // Crear mensaje interactivo
    const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: menuText,
      }),
      header,
      nativeFlowMessage:
        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: nativeButtons,
        }),
    });

    const msg = generateWAMessageFromContent(
      m.chat,
      { interactiveMessage },
      { userJid: conn.user.jid, quoted: m }
    );
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch (e) {
    console.error("❌ Error en owner:", e);
    await conn.sendMessage(
      m.chat,
      {
        text: `❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚌𝚊𝚛𝚐𝚊𝚛 𝚕𝚊 𝚒𝚗𝚏𝚘𝚛𝚖𝚊𝚌𝚒ó𝚗\n▸ 𝙲𝚘𝚗𝚝𝚊𝚌𝚝𝚘: 573187418668`,
      },
      { quoted: m }
    );
  }
};

handler.help = ["owner"];
handler.tags = ["info"];
handler.command = ["owner", "creador"];

export default handler;
