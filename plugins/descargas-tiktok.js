import axios from "axios";
import cheerio from "cheerio";

// Sistema de descargas activas por usuario
const userDownloads = new Map();

// Métodos de descarga mejorados
async function tiktokApiDelirius(url) {
  try {
    const { data } = await axios.get(
      `https://api.delirius.store/download/tiktok?url=${encodeURIComponent(
        url
      )}`,
      {
        timeout: 20000,
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (data?.status && data?.data?.meta?.media) {
      const media = data.data.meta.media[0];

      // GALERÍA DE IMÁGENES
      if (
        media.type === "image" &&
        media.images &&
        Array.isArray(media.images)
      ) {
        const validImages = media.images.filter(
          (imgUrl) =>
            imgUrl &&
            imgUrl.startsWith("http") &&
            imgUrl.includes("tiktokcdn.com")
        );
        if (validImages.length > 0) {
          return {
            images: validImages,
            success: true,
            type: "images",
          };
        }
      }

      // VIDEO
      if (media.type === "video") {
        const videoUrl = media.org || media.hd || media.wm;
        if (videoUrl && videoUrl.startsWith("http")) {
          return {
            videoUrl,
            success: true,
            type: "video",
            title: data.data?.meta?.title || "TikTok Video",
            author: data.data?.meta?.author?.nickname || "Usuario TikTok",
          };
        }
      }
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

async function tiktokdlF(url) {
  try {
    const gettoken = await axios.get("https://tikdown.org/id", {
      timeout: 15000,
    });
    const $ = cheerio.load(gettoken.data);
    const token = $("#download-form > input[type=hidden]:nth-child(2)").attr(
      "value"
    );

    const param = { url: url, _token: token };
    const { data } = await axios.post(
      "https://tikdown.org/getAjax?",
      new URLSearchParams(Object.entries(param)),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 15000,
      }
    );

    const getdata = cheerio.load(data.html);
    if (data.status) {
      const videoUrl = getdata(
        "div.download-links > div:nth-child(1) > a"
      ).attr("href");
      return {
        videoUrl,
        success: true,
        type: "video",
      };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

async function tiktokApiSky(url) {
  try {
    const apiUrl = `https://api-sky.ultraplus.click/api/tiktok?url=${encodeURIComponent(
      url
    )}`;
    const response = await axios.get(apiUrl, { timeout: 60000 });

    if (response.data && response.data.url) {
      return {
        videoUrl: response.data.url,
        success: true,
        type: "video",
        title: response.data.title || "TikTok Video",
        author: response.data.author || "Usuario TikTok",
      };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

async function tiktokApiTikwm(url) {
  try {
    const res = await axios.get(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}?hd=1`,
      {
        timeout: 15000,
      }
    );

    const data = res.data?.data;
    if (!data?.play && !data?.music) return { success: false };

    return {
      videoUrl: data.play,
      musicUrl: data.music,
      success: true,
      type: "video",
      title: data.title || "TikTok Video",
      author: data.author?.nickname || "Usuario TikTok",
      duration: data.duration,
    };
  } catch (error) {
    return { success: false };
  }
}

async function tiktokApiDorratz(url) {
  try {
    const response = await axios.get(
      `https://api.dorratz.com/v2/tiktok-dl?url=${encodeURIComponent(url)}`,
      {
        timeout: 15000,
      }
    );
    const videoUrl = response.data.data.media.org;
    return {
      videoUrl,
      success: true,
      type: "video",
    };
  } catch (error) {
    return { success: false };
  }
}

async function tiktokApiDylux(url) {
  try {
    const response = await axios.get(
      `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(
        url
      )}`,
      {
        timeout: 15000,
      }
    );
    const videoUrl = response.data.video.noWatermark;
    return {
      videoUrl,
      success: true,
      type: "video",
    };
  } catch (error) {
    return { success: false };
  }
}

// Función para detectar si es URL de TikTok
function isTikTokUrl(text) {
  return /(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/.test(text);
}

// Handler principal
const handler = async (m, { conn, text, usedPrefix, command }) => {
  const userId = m.sender;
  const jid = m.chat;

  // Verificar si ya tiene descarga en curso
  if (userDownloads.has(userId)) {
    return conn.reply(jid, `⚙️ 𝙴𝚂𝙿𝙴𝚁𝙴 𝙰 𝚀𝚄𝙴 𝚂𝚄 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝚃𝙴𝚁𝙼𝙸𝙽𝙴`, m);
  }

  if (!text) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝙴𝙽𝙻𝙰𝙲𝙴 𝙳𝙴 𝚃𝙸𝙺𝚃𝙾𝙺*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}${command} <𝚞𝚛𝚕>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}${command} 𝚑𝚝𝚝𝚙𝚜://𝚟𝚖.𝚝𝚒𝚔𝚝𝚘𝚔.𝚌𝚘𝚖/𝚣/𝚊𝚋𝚌𝟷𝟸𝟹𝟺𝟻`,
      m
    );
  }

  if (!isTikTokUrl(text)) {
    return conn.reply(
      jid,
      `❌ 𝙴𝙽𝙻𝙰𝙲𝙴 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙾\n▸ 𝙸𝚗𝚐𝚛𝚎𝚜𝚊 𝚞𝚗𝚊 𝚄𝚁𝙻 𝚟á𝚕𝚒𝚍𝚊 𝚍𝚎 𝚃𝚒𝚔𝚃𝚘𝚔`,
      m
    );
  }

  userDownloads.set(userId, true);

  try {
    // Reacción de búsqueda (tuerca ⚙️)
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });

    // Mensaje de procesamiento
    const processingMsg = await conn.sendMessage(
      jid,
      {
        text: `⚙️ 𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾 𝙴𝙽𝙻𝙰𝙲𝙴 𝙳𝙴 𝚃𝚒𝚔𝚃𝚘𝚔...`,
      },
      { quoted: m }
    );

    // Intentar todas las APIs en orden
    const downloadAttempts = [
      () => tiktokApiDelirius(text), // 1. delirius.store (soporta imágenes)
      () => tiktokApiTikwm(text), // 2. tikwm.com (rápido y confiable)
      () => tiktokApiSky(text), // 3. api-sky
      () => tiktokdlF(text), // 4. tikdown.org
      () => tiktokApiDorratz(text), // 5. dorratz.com
      () => tiktokApiDylux(text), // 6. tiklydown
    ];

    let result = null;
    let methodUsed = "Primer método";

    for (let i = 0; i < downloadAttempts.length; i++) {
      try {
        console.log(`🔄 Intentando método ${i + 1}...`);
        result = await downloadAttempts[i]();

        if (result && result.success) {
          methodUsed = `Método ${i + 1}`;
          console.log(`✅ Éxito con ${methodUsed}`);
          break;
        }
      } catch (err) {
        console.log(`❌ Método ${i + 1} falló:`, err.message);
        continue;
      }
    }

    if (!result || !result.success) {
      throw new Error("𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝙲𝙾𝙽𝚃𝙴𝙽𝙸𝙳𝙾. 𝚅𝚎𝚛𝚒𝚏𝚒𝚌𝚊 𝚎𝚕 𝚎𝚗𝚕𝚊𝚌𝚎.");
    }

    // Reacción de procesamiento
    await conn.sendMessage(jid, {
      react: { text: "⏳", key: m.key },
    });

    await conn.sendMessage(jid, {
      text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙲𝙾𝙽𝚃𝙴𝙽𝙸𝙳𝙾 𝙳𝙴 𝚃𝚒𝚔𝚃𝚘𝚔...`,
      edit: processingMsg.key,
    });

    // Enviar contenido según lo obtenido
    if (result.type === "images" && result.images && result.images.length > 0) {
      // GALERÍA DE IMÁGENES
      console.log(`📸 Enviando galería con ${result.images.length} imágenes`);

      for (let i = 0; i < result.images.length; i++) {
        await conn.sendMessage(
          jid,
          {
            image: { url: result.images[i] },
            caption:
              i === 0
                ? `⚙️ *𝙶𝙰𝙻𝙴𝚁𝙸́𝙰 𝙳𝙴 𝙸𝙼Á𝙶𝙴𝙽𝙴𝚂*\n▸ 𝚃𝚘𝚝𝚊𝚕: ${result.images.length} 𝚒𝚖𝚊𝚐𝚎𝚗𝚎𝚜`
                : `📸 𝙸𝚖𝚊𝚐𝚎𝚗 ${i + 1}/${result.images.length}`,
          },
          i === 0 ? { quoted: m } : undefined
        );

        if (i < result.images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } else if (result.type === "video" && result.videoUrl) {
      // VIDEO

      // Verificar si es comando de audio
      if (
        command === "tiktokaudio" ||
        command === "tta" ||
        command === "ttaudio"
      ) {
        if (result.musicUrl) {
          // Enviar audio
          await conn.sendMessage(
            jid,
            {
              audio: { url: result.musicUrl },
              mimetype: "audio/mpeg",
              fileName: `tiktok_audio.mp3`,
              ptt: false,
            },
            { quoted: m }
          );
        } else {
          // Intentar obtener audio del método tikwm
          const audioResult = await tiktokApiTikwm(text);
          if (audioResult.musicUrl) {
            await conn.sendMessage(
              jid,
              {
                audio: { url: audioResult.musicUrl },
                mimetype: "audio/mpeg",
                fileName: `tiktok_audio.mp3`,
                ptt: false,
              },
              { quoted: m }
            );
          } else {
            throw new Error("𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝙰𝚄𝙳𝙸𝙾");
          }
        }
      } else {
        // Enviar video
        const caption =
          `⚙️ *𝚅𝙸𝙳𝙴𝙾 𝙳𝙴 𝚃𝚒𝚔𝚃𝚘𝚔*\n\n` +
          `🎬 ${result.title || "Video de TikTok"}\n` +
          `👤 ${result.author || "Usuario TikTok"}`;

        await conn.sendMessage(
          jid,
          {
            video: { url: result.videoUrl },
            caption: caption,
          },
          { quoted: m }
        );
      }
    } else {
      throw new Error("𝚃𝙸𝙿𝙾 𝙳𝙴 𝙲𝙾𝙽𝚃𝙴𝙽𝙸𝙳𝙾 𝙽𝙾 𝚂𝙾𝙿𝙾𝚁𝚃𝙰𝙳𝙾");
    }

    // Mensaje de éxito
    await conn.sendMessage(jid, {
      text: `✅ 𝙲𝙾𝙽𝚃𝙴𝙽𝙸𝙳𝙾 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝙳𝙾 𝙲𝙾𝚁𝚁𝙴𝙲𝚃𝙰𝙼𝙴𝙽𝚃𝙴`,
      edit: processingMsg.key,
    });

    // Reacción de éxito
    await conn.sendMessage(jid, {
      react: { text: "✅", key: m.key },
    });
  } catch (error) {
    console.error("❌ 𝙴𝚛𝚛𝚘𝚛 𝚃𝚒𝚔𝚃𝚘𝚔:", error);

    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(jid, `❌ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m);
  } finally {
    userDownloads.delete(userId);
  }
};

// Configuración de comandos
handler.help = ["tiktok", "tt", "tiktokaudio", "tta", "ttaudio"];
handler.tags = ["downloader"];
handler.command = ["tiktok", "tt", "tiktokaudio", "tta", "ttaudio"];

export default handler;
