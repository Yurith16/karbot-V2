import getFacebookDownloadInfo from "../lib/fdownloader.js";

// Función para crear barra de progreso
function createProgressBar(percentage) {
  const totalBars = 20;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
  return `[${bar}] ${percentage}%`;
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  const targetUrl = text?.trim() || args?.[0];
  if (!targetUrl) {
    return conn.reply(
      m.chat,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝙴𝙽𝙻𝙰𝙲𝙴*\n\n▸ *𝚄𝚜𝚘:* ${
        usedPrefix + command
      } <𝚕𝚒𝚗𝚔 𝚍𝚎 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔>`,
      m
    );
  }

  let loadingMsg = null;

  try {
    // Reaccionar con emoji de espera
    await conn.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key },
    });

    // Enviar mensaje inicial de carga
    loadingMsg = await conn.sendMessage(
      m.chat,
      {
        text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙴𝙽𝙻𝙰𝙲𝙴...\n${createProgressBar(10)}`,
      },
      { quoted: m }
    );

    // Progreso de análisis
    await conn.sendMessage(m.chat, {
      text: `⚙️ 𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾 𝚅𝙸𝙳𝙴𝙾...\n${createProgressBar(40)}`,
      edit: loadingMsg.key,
    });

    const { formats } = await getFacebookDownloadInfo(targetUrl);

    const directFormats = formats.filter(
      (item) => item?.url && !item.requiresRender
    );
    if (!directFormats.length) {
      await conn.sendMessage(m.chat, {
        react: { text: "❌", key: m.key },
      });
      await conn.sendMessage(m.chat, {
        text: `❌ 𝙽𝙾 𝙷𝙰𝚈 𝙴𝙽𝙻𝙰𝙲𝙴𝚂 𝙳𝙸𝚁𝙴𝙲𝚃𝙾𝚂`,
        edit: loadingMsg.key,
      });
      return;
    }

    // Progreso de preparación
    await conn.sendMessage(m.chat, {
      text: `⚙️ 𝙿𝚁𝙴𝙿𝙰𝚁𝙰𝙽𝙳𝙾 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰...\n${createProgressBar(70)}`,
      edit: loadingMsg.key,
    });

    const chosen =
      directFormats.find((item) => item?.url && !item.requiresRender) ||
      directFormats[0];

    // Progreso final
    await conn.sendMessage(m.chat, {
      text: `✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n${createProgressBar(100)}`,
      edit: loadingMsg.key,
    });

    // Cambiar reacción a engranaje
    await conn.sendMessage(m.chat, {
      react: { text: "⚙️", key: m.key },
    });

    // Esperar 1 segundo antes de enviar
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Si el comando es fbaudio, enviar solo audio
    if (command === "fbaudio") {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: chosen.url },
          mimetype: "audio/mpeg",
          fileName: "facebook_audio.mp3",
          ptt: false,
        },
        { quoted: m }
      );
    } else {
      // Comando fb - enviar video con calidad
      await conn.sendMessage(
        m.chat,
        {
          video: { url: chosen.url },
          caption: `⚙️ *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n▸ *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${
            chosen.quality || chosen.label || "𝚂𝚝𝚊𝚗𝚍𝚊𝚛𝚍"
          }`,
        },
        { quoted: m }
      );
    }
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔:", error);

    // Cambiar reacción a error
    await conn.sendMessage(m.chat, {
      react: { text: "❌", key: m.key },
    });

    if (loadingMsg) {
      try {
        await conn.sendMessage(m.chat, {
          text: `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        await conn.reply(m.chat, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚛𝚘𝚛`, m);
      }
    } else {
      await conn.reply(m.chat, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
    }
  }
};

handler.help = ["fb", "fbaudio"];
handler.tags = ["downloader"];
handler.command = ["fb", "fbaudio"];

export default handler;
