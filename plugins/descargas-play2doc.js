import axios from "axios";
import yts from "yt-search";
import crypto from "crypto";

// Sistema de descargas activas por usuario
const userDownloads = new Map();

// Scraper savetube para videos
const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download",
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Postify/1.0.0",
  },
  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g);
      return Buffer.from(matches.join(""), "hex");
    },
    decrypt: async (enc) => {
      try {
        const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
        const data = Buffer.from(enc, "base64");
        const iv = data.slice(0, 16);
        const content = data.slice(16);
        const key = savetube.crypto.hexToBuffer(secretKey);
        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        let decrypted = decipher.update(content);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  youtube: (url) => {
    if (!url) return null;
    const a = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (let b of a) {
      if (b.test(url)) return url.match(b)[1];
    }
    return null;
  },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const { data: response } = await axios({
        method,
        url: `${
          endpoint.startsWith("http") ? "" : savetube.api.base
        }${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: savetube.headers,
        timeout: 30000,
      });
      return {
        status: true,
        code: 200,
        data: response,
      };
    } catch (error) {
      throw new Error(error);
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) throw new Error(response);
    return {
      status: true,
      code: 200,
      data: response.data.cdn,
    };
  },
  downloadVideo: async (link, quality = "720") => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "No link provided.",
      };
    }
    const id = savetube.youtube(link);
    if (!id) throw new Error("Invalid YouTube link.");
    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;
      const result = await savetube.request(
        `https://${cdn}${savetube.api.info}`,
        {
          url: `https://www.youtube.com/watch?v=${id}`,
        }
      );
      if (!result.status) return result;
      const decrypted = await savetube.crypto.decrypt(result.data.data);
      let dl;
      try {
        dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
          id: id,
          downloadType: "video",
          quality: quality,
          key: decrypted.key,
        });
      } catch (error) {
        throw new Error("Failed to get download link.");
      }
      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Unknown Title",
          type: "video",
          format: "mp4",
          thumbnail:
            decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration,
          quality: quality + "p",
        },
      };
    } catch (error) {
      throw new Error("An error occurred while processing your request.");
    }
  },
};

// Función para validar URLs de YouTube
function isValidYouTubeUrl(text) {
  try {
    const ytRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)/i;
    return ytRegex.test(text);
  } catch (error) {
    return false;
  }
}

// Función para extraer video ID de URL
function extractVideoId(url) {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Función para obtener información del video (URL o búsqueda)
async function obtenerInformacionVideo(text) {
  const esUrl = isValidYouTubeUrl(text);

  if (esUrl) {
    // Es una URL - obtener información directa
    const videoId = extractVideoId(text);
    if (!videoId) throw new Error("URL de YouTube no válida");

    try {
      const videoInfo = await yts({ videoId: videoId });
      if (!videoInfo?.title)
        throw new Error("No se pudo obtener información del video");

      return {
        videoId: videoId,
        url: `https://youtu.be/${videoId}`,
        title: videoInfo.title,
        author: { name: videoInfo.author?.name || "Desconocido" },
        duration: {
          seconds: videoInfo.seconds || 0,
          timestamp: videoInfo.timestamp || "00:00",
        },
        thumbnail:
          videoInfo.thumbnail ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        views: videoInfo.views || 0,
        ago: videoInfo.ago || "Desconocido",
      };
    } catch (error) {
      throw new Error(
        `Error al obtener información de la URL: ${error.message}`
      );
    }
  } else {
    // Es una búsqueda por texto
    try {
      const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(
        text
      )}`;
      const searchResponse = await axios.get(searchApi);
      const searchData = searchResponse.data;

      if (!searchData?.data || searchData.data.length === 0) {
        throw new Error(`No se encontraron resultados para "${text}"`);
      }

      const video = searchData.data[0];
      return {
        videoId: extractVideoId(video.url) || "unknown",
        url: video.url,
        title: video.title,
        author: { name: video.author?.name || "Desconocido" },
        duration: {
          timestamp: video.duration || "00:00",
          seconds: parseDuration(video.duration) || 0,
        },
        thumbnail: video.image || video.thumbnail,
        views: video.views || 0,
        ago: video.publishedAt || "Desconocido",
      };
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }
}

// Sistema de descarga con fallback
async function descargarVideoConFallback(videoUrl, videoDuration) {
  // Determinar calidad basada en duración para savetube
  let quality = "720";
  if (videoDuration > 600) quality = "480"; // >10 minutos
  if (videoDuration > 1800) quality = "360"; // >30 minutos

  console.log(`🎯 Obteniendo video...`);

  // PRIMERO: Intentar con savetube
  try {
    const result = await savetube.downloadVideo(videoUrl, quality);
    if (result?.status && result?.result?.download) {
      console.log(`✅ Video obtenido (${quality}p)`);
      return {
        url: result.result.download,
        quality: result.result.quality,
      };
    }
    throw new Error("No se pudo obtener el video");
  } catch (error) {
    console.log(`❌ Primer método falló: ${error.message}`);

    // SEGUNDO: Intentar con API Honduras
    try {
      console.log("🔄 Intentando método alternativo...");
      const apiUrl = `https://honduras-api.onrender.com/api/ytmp4?url=${encodeURIComponent(
        videoUrl
      )}`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.data?.éxito && response.data.descarga?.enlace) {
        console.log("✅ Video obtenido (360p)");
        return {
          url: response.data.descarga.enlace,
          quality: "360p",
        };
      }
      throw new Error("No se pudo obtener el enlace");
    } catch (apiError) {
      console.log(`❌ Segundo método falló: ${apiError.message}`);

      // TERCERO: APIs de fallback adicionales
      const fallbackAPIs = [
        {
          endpoint: (url) =>
            `https://api-adonix.ultraplus.click/download/ytvideo?apikey=${
              global.apikey || ""
            }&url=${encodeURIComponent(url)}`,
          parser: (data) => data?.downloadUrl || data?.url,
        },
        {
          endpoint: (url) =>
            `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${url}&type=mp4`,
          parser: (data) => data?.result?.url,
        },
        {
          endpoint: (url) =>
            `https://sky-api-ashy.vercel.app/download/ytmp4?url=${encodeURIComponent(
              url
            )}`,
          parser: (data) => data?.result?.url,
        },
        {
          endpoint: (url) =>
            `https://api.vreden.my.id/api/v1/download/youtube/video?url=${url}&quality=360`,
          parser: (data) => data?.result?.downloadUrl,
        },
      ];

      // Intentar APIs de fallback
      for (const api of fallbackAPIs) {
        try {
          console.log("🔄 Probando método adicional...");
          const apiUrl = api.endpoint(videoUrl);
          const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          const downloadUrl = api.parser(response.data);
          if (downloadUrl) {
            console.log("✅ Video obtenido (360p)");
            return {
              url: downloadUrl,
              quality: "360p",
            };
          }
        } catch (apiError) {
          console.log("❌ Método adicional falló");
          continue;
        }
      }

      throw new Error("No se pudo obtener el video. Intenta con otro enlace");
    }
  }
}

// Función para descargar video como buffer
async function descargarVideoBuffer(videoUrl) {
  try {
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "arraybuffer",
      timeout: 300000, // 5 minutos para videos largos
      maxContentLength: 1500 * 1024 * 1024, // 1.5GB máximo
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
        "Accept-Encoding": "identity",
        Connection: "keep-alive",
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("El video descargado está vacío (0 bytes)");
    }

    const buffer = Buffer.from(response.data);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);

    console.log(`✅ Video descargado: ${sizeMB}MB`);

    return {
      buffer: buffer,
      sizeMB: sizeMB,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    throw new Error(`Error al descargar el video: ${error.message}`);
  }
}

// Función auxiliar para parsear duración
function parseDuration(durationStr) {
  try {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  } catch {
    return 0;
  }
}

// Handler principal
const handler = async (m, { conn, text, usedPrefix }) => {
  const userId = m.sender;
  const jid = m.chat;

  // Verificar si ya tiene descarga en curso
  if (userDownloads.has(userId)) {
    return conn.reply(jid, `⚙️ 𝙴𝚂𝙿𝙴𝚁𝙴 𝙰 𝚀𝚄𝙴 𝚂𝚄 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝚃𝙴𝚁𝙼𝙸𝙽𝙴`, m);
  }

  if (!text) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝚅𝙸𝙳𝙴𝙾*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}play2doc <𝚗𝚘𝚖𝚋𝚛𝚎/𝚎𝚗𝚕𝚊𝚌𝚎>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}play2doc 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝𝚊𝚕 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚘`,
      m
    );
  }

  userDownloads.set(userId, true);

  try {
    // Reacción de búsqueda (tuerca ⚙️)
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });

    // Obtener información del video (URL o búsqueda)
    const video = await obtenerInformacionVideo(text);

    // Mostrar información del video + "Procesando pedido..."
    const videoDetails =
      `⚙️ *𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾*\n\n` +
      `🎬 *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${video.title}\n` +
      `👤 *𝙲𝚊𝚗𝚊𝚕:* ${video.author.name}\n` +
      `⏱️ *𝙳𝚞𝚛𝚊𝚌𝚒𝚘́𝚗:* ${video.duration.timestamp}\n` +
      `👀 *𝚅𝚒𝚜𝚝𝚊𝚜:* ${(video.views || 0).toLocaleString()}\n` +
      `📅 *𝚂𝚞𝚋𝚒𝚍𝚘:* ${video.ago || "Desconocido"}\n\n` +
      `⏳ 𝙿𝚛𝚘𝚌𝚎𝚜𝚊𝚗𝚍𝚘 𝚙𝚎𝚍𝚒𝚍𝚘...`;

    // Enviar imagen con detalles
    await conn.sendMessage(
      jid,
      {
        image: { url: video.thumbnail },
        caption: videoDetails,
      },
      { quoted: m }
    );

    // Obtener calidad basada en duración
    const videoDuration = video.duration.seconds || 0;

    // Obtener video con sistema de fallback
    const downloadResult = await descargarVideoConFallback(
      video.url,
      videoDuration
    );

    if (!downloadResult?.url) {
      await conn.sendMessage(jid, {
        react: { text: "❌", key: m.key },
      });
      return conn.reply(jid, `❌ 𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝚅𝙸𝙳𝙴𝙾`, m);
    }

    // Descargar el video
    const videoData = await descargarVideoBuffer(downloadResult.url);

    if (!videoData.buffer || videoData.sizeBytes === 0) {
      throw new Error("El video se descargó vacío");
    }

    // **ENVIAR COMO DOCUMENTO** (MP4 como archivo) - SIN CAPTION
    const fileName = `${video.title
      .replace(/[<>:"/\\|?*]/g, "_")
      .substring(0, 64)}.mp4`;

    await conn.sendMessage(
      jid,
      {
        document: videoData.buffer,
        fileName: fileName,
        mimetype: "video/mp4",
      },
      { quoted: m } // Respondiendo al mensaje del usuario
    );

    // Reacción de éxito
    await conn.sendMessage(jid, {
      react: { text: "✅", key: m.key },
    });
  } catch (error) {
    console.error("❌ 𝙴𝚛𝚛𝚘𝚛 𝙿𝚕𝚊𝚢𝟸𝙳𝚘𝚌:", error);

    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(jid, `❌ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m);
  } finally {
    userDownloads.delete(userId);
  }
};

handler.help = ["play2doc"];
handler.tags = ["downloader"];
handler.command = ["play2doc"];

export default handler;
