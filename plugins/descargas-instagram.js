import axios from "axios";

// Función para crear barra de progreso
function createProgressBar(percentage) {
  const totalBars = 20;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
  return `[${bar}] ${percentage}%`;
}

// Función de descarga de Instagram
const instagramDownload = async (url) => {
  return new Promise(async (resolve) => {
    if (!url.match(/\/(reel|reels|p|stories|tv|s)\/[a-zA-Z0-9_-]+/i)) {
      return resolve({ status: false });
    }

    try {
      let jobId = await (
        await axios.post(
          "https://app.publer.io/hooks/media",
          {
            url: url,
            iphone: false,
          },
          {
            headers: {
              Accept: "/",
              "Accept-Encoding": "gzip, deflate, br, zstd",
              "Accept-Language": "es-ES,es;q=0.9",
              "Cache-Control": "no-cache",
              Origin: "https://publer.io",
              Pragma: "no-cache",
              Priority: "u=1, i",
              Referer: "https://publer.io/",
              "Sec-CH-UA":
                '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
              "Sec-CH-UA-Mobile": "?0",
              "Sec-CH-UA-Platform": '"Windows"',
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            },
          }
        )
      ).data.job_id;

      let status = "working";
      let jobStatusResponse;

      while (status !== "complete") {
        jobStatusResponse = await axios.get(
          `https://app.publer.io/api/v1/job_status/${jobId}`,
          {
            headers: {
              Accept: "application/json, text/plain, /",
              "Accept-Encoding": "gzip, deflate, br, zstd",
              "Accept-Language": "es-ES,es;q=0.9",
              "Cache-Control": "no-cache",
              Origin: "https://publer.io",
              Pragma: "no-cache",
              Priority: "u=1, i",
              Referer: "https://publer.io/",
              "Sec-CH-UA":
                '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
              "Sec-CH-UA-Mobile": "?0",
              "Sec-CH-UA-Platform": '"Windows"',
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            },
          }
        );
        status = jobStatusResponse.data.status;
      }

      let data = jobStatusResponse.data.payload.map((item) => {
        return {
          type: item.type === "photo" ? "image" : "video",
          url: item.path,
        };
      });

      resolve({
        status: true,
        data,
      });
    } catch (e) {
      resolve({
        status: false,
        msg: new Error(e).message,
      });
    }
  });
};

const handler = async (m, { conn, args, usedPrefix }) => {
  const jid = m.chat;
  const url = args[0];

  if (!url) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝚄𝚁𝙻*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}instagram <𝚎𝚗𝚕𝚊𝚌𝚎 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}instagram https://instagram.com/reel/...`,
      m
    );
  }

  let loadingMsg = null;

  try {
    // Reaccionar con espera
    await conn.sendMessage(jid, {
      react: { text: "⏳", key: m.key },
    });

    // Enviar mensaje inicial de carga
    loadingMsg = await conn.sendMessage(
      jid,
      {
        text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝚄𝚁𝙻...\n${createProgressBar(10)}`,
      },
      { quoted: m }
    );

    // Progreso de conexión
    await conn.sendMessage(jid, {
      text: `⚙️ 𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙽𝙳𝙾 𝙰 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼...\n${createProgressBar(30)}`,
      edit: loadingMsg.key,
    });

    // Intentar con el método principal (Publer)
    const img = await instagramDownload(url);

    // Progreso de análisis
    await conn.sendMessage(jid, {
      text: `⚙️ 𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾 𝙼𝙴𝙳𝙸𝙾𝚂...\n${createProgressBar(60)}`,
      edit: loadingMsg.key,
    });

    let mediaData = [];

    if (img.status && img.data && img.data.length > 0) {
      mediaData = img.data;

      // Progreso de preparación
      await conn.sendMessage(jid, {
        text: `⚙️ 𝙿𝚁𝙴𝙿𝙰𝚁𝙰𝙽𝙳𝙾 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰...\n${createProgressBar(80)}`,
        edit: loadingMsg.key,
      });
    } else {
      // Si falla el método principal, intentar con API Delirius
      await conn.sendMessage(jid, {
        text: `⚙️ 𝙸𝙽𝚃𝙴𝙽𝚃𝙰𝙽𝙳𝙾 𝙾𝚃𝚁𝙰 𝙰𝙿𝙸...\n${createProgressBar(50)}`,
        edit: loadingMsg.key,
      });

      const res = await axios.get(
        "https://delirius-apiofc.vercel.app/download/instagram",
        {
          params: { url: url },
        }
      );

      mediaData = res.data.data || [];
    }

    if (!mediaData || mediaData.length === 0) {
      await conn.sendMessage(jid, {
        react: { text: "❌", key: m.key },
      });

      await conn.sendMessage(jid, {
        text: `❌ 𝙽𝙾 𝙷𝙰𝚈 𝙼𝙴𝙳𝙸𝙾𝚂 𝙳𝙸𝚂𝙿𝙾𝙽𝙸𝙱𝙻𝙴𝚂`,
        edit: loadingMsg.key,
      });
      return;
    }

    // Progreso final
    await conn.sendMessage(jid, {
      text: `✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n${createProgressBar(100)}\n\n⚙️ 𝙴𝚗𝚟𝚒𝚊𝚗𝚍𝚘 ${
        mediaData.length
      } 𝚊𝚛𝚌𝚑𝚒𝚟𝚘(𝚜)...`,
      edit: loadingMsg.key,
    });

    // Cambiar reacción a descarga
    await conn.sendMessage(jid, {
      react: { text: "⬇️", key: m.key },
    });

    // Enviar medios
    for (let i = 0; i < mediaData.length; i++) {
      const item = mediaData[i];

      if (item.type === "image") {
        await conn.sendMessage(jid, {
          image: { url: item.url },
          caption: i === 0 ? `⚙️ *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*` : "",
        });
      } else if (item.type === "video") {
        await conn.sendMessage(jid, {
          video: { url: item.url },
          caption: i === 0 ? `⚙️ *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*` : "",
        });
      }

      // Pequeño delay entre envíos
      if (i < mediaData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    // Cambiar reacción a engranaje
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖:", error);

    // Cambiar reacción a error
    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    if (loadingMsg) {
      try {
        await conn.sendMessage(jid, {
          text: `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        await conn.reply(jid, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
      }
    } else {
      await conn.reply(jid, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
    }
  }
};

handler.command = [
  "instagram",
  "ig",
  "instagramdl",
  "igdl",
  "instagram2",
  "ig2",
  "instagramdl2",
  "igdl2",
  "instagram3",
  "ig3",
  "instagramdl3",
  "igdl3",
];

handler.help = ["instagram <url>"];
handler.tags = ["downloader"];

export default handler;
