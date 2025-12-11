import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";
import crypto from "crypto";

// Sistema de descargas activas por usuario
const userDownloads = new Map();

// Scraper savetube para videos (soporte 1080p máximo, 360p mínimo)
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

// Función para validar URL de YouTube
function isValidYouTubeUrl(text) {
  try {
    const ytRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)/i;
    return ytRegex.test(text);
  } catch {
    return false;
  }
}

// Función para extraer video ID
function extractVideoId(url) {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Sistema de descarga con fallback (calidad 1080p máximo, 360p mínimo)
async function descargarVideoConFallback(videoUrl, videoDuration) {
  // Determinar calidad basada en duración (máximo 1080p, mínimo 360p)
  let quality = "720"; // calidad por defecto

  // Videos muy cortos (menos de 5 minutos) - máxima calidad
  if (videoDuration < 300) {
    quality = "1080"; // <5 minutos
  }
  // Videos cortos (5-10 minutos) - alta calidad
  else if (videoDuration < 600) {
    quality = "720"; // 5-10 minutos
  }
  // Videos medianos (10-20 minutos) - calidad media
  else {
    quality = "480"; // 10-20 minutos (mínimo 360p)
  }

  console.log(`🎯 Obteniendo video con calidad: ${quality}p`);

  // PRIMERO: Intentar con savetube con la calidad determinada
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
    console.log(`❌ Savetube falló: ${error.message}`);

    // SEGUNDO: APIs de fallback
    const fallbackAPIs = [
      {
        name: "𝙰𝙿𝙸 𝙰𝚍𝚘𝚗𝚒𝚡",
        endpoint: (url) =>
          `https://api-adonix.ultraplus.click/download/ytvideo?apikey=${
            global.apikey || ""
          }&url=${encodeURIComponent(url)}`,
        parser: (data) => data?.downloadUrl || data?.url,
      },
      {
        name: "𝙷𝚘𝚗𝚍𝚞𝚛𝚊𝚜 𝙰𝙿𝙸",
        endpoint: (url) =>
          `https://honduras-api.onrender.com/api/ytmp4?url=${encodeURIComponent(
            url
          )}`,
        parser: (data) => (data?.éxito ? data.descarga?.enlace : null),
      },
      {
        name: "𝙵𝙶𝚂𝙸 𝙰𝙿𝙸",
        endpoint: (url) =>
          `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${url}&type=mp4`,
        parser: (data) => data?.result?.url,
      },
      {
        name: "𝚂𝚔𝚢 𝙰𝙿𝙸",
        endpoint: (url) =>
          `https://sky-api-ashy.vercel.app/download/ytmp4?url=${encodeURIComponent(
            url
          )}`,
        parser: (data) => data?.result?.url,
      },
      {
        name: "𝚅𝚛𝚎𝚍𝚎𝚗 𝙰𝙿𝙸",
        endpoint: (url) =>
          `https://api.vreden.my.id/api/v1/download/youtube/video?url=${url}&quality=360`,
        parser: (data) => data?.result?.downloadUrl,
      },
    ];

    // Intentar APIs de fallback
    for (const api of fallbackAPIs) {
      try {
        console.log(`🔄 Intentando con ${api.name}...`);
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
          console.log(`✅ Éxito con ${api.name} (360p)`);
          return {
            url: downloadUrl,
            quality: "360p", // Fallback a 360p
          };
        }
      } catch (apiError) {
        console.log(`❌ ${api.name} falló: ${apiError.message}`);
        continue;
      }
    }

    throw new Error("No se pudo obtener el video. Intenta con otro enlace");
  }
}

// Función para buscar video por texto
async function buscarVideoPorTexto(text) {
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
      videoId: video.id || "unknown",
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

// Handler para video normal (videos cortos hasta 20 minutos)
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
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝚅𝙸𝙳𝙴𝙾*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}play2 <𝚗𝚘𝚖𝚋𝚛𝚎/𝚎𝚗𝚕𝚊𝚌𝚎>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}play2 𝚝𝚛𝚊𝚒𝚌𝚒𝚘𝚗𝚎𝚛𝚊`,
      m
    );
  }

  userDownloads.set(userId, true);

  try {
    // Reacción de búsqueda (tuerca ⚙️)
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });

    let videoInfo;

    // Verificar si es URL o texto
    const isUrl = isValidYouTubeUrl(text);

    if (isUrl) {
      // Es una URL - obtener información directa
      const videoId = extractVideoId(text);
      if (!videoId) throw new Error("URL no válida");

      const search = await yts({ videoId: videoId });
      if (!search) throw new Error("Video no encontrado");

      // Verificar duración (máximo 20 minutos = 1200 segundos)
      if (search.seconds > 1200) {
        throw new Error(
          `El video supera los 20 minutos. Usa *${usedPrefix}play2doc* para videos largos`
        );
      }

      videoInfo = {
        videoId,
        url: `https://youtu.be/${videoId}`,
        title: search.title || "Sin título",
        author: { name: search.author?.name || "Desconocido" },
        duration: {
          seconds: search.seconds || 0,
          timestamp: search.timestamp || "00:00",
        },
        thumbnail:
          search.thumbnail ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        views: search.views || 0,
        ago: search.ago || "Desconocido",
      };
    } else {
      // Es una búsqueda por texto
      videoInfo = await buscarVideoPorTexto(text);

      // Verificar duración (máximo 20 minutos = 1200 segundos)
      if (videoInfo.duration.seconds > 1200) {
        throw new Error(
          `El video supera los 20 minutos. Usa *${usedPrefix}play2doc* para videos largos`
        );
      }
    }

    // Mostrar información del video + "Procesando pedido..."
    const videoDetails =
      `⚙️ *𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾*\n\n` +
      `🎬 *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${videoInfo.title}\n` +
      `👤 *𝙲𝚊𝚗𝚊𝚕:* ${videoInfo.author.name}\n` +
      `⏱️ *𝙳𝚞𝚛𝚊𝚌𝚒𝚘́𝚗:* ${videoInfo.duration.timestamp}\n` +
      `👀 *𝚅𝚒𝚜𝚝𝚊𝚜:* ${(videoInfo.views || 0).toLocaleString()}\n` +
      `📅 *𝚂𝚞𝚋𝚒𝚍𝚘:* ${videoInfo.ago || "Desconocido"}\n\n` +
      `⏳ 𝙿𝚛𝚘𝚌𝚎𝚜𝚊𝚗𝚍𝚘 𝚙𝚎𝚍𝚒𝚍𝚘...`;

    // Enviar imagen con detalles
    await conn.sendMessage(
      jid,
      {
        image: { url: videoInfo.thumbnail },
        caption: videoDetails,
      },
      { quoted: m }
    );

    // Obtener enlace de descarga con calidad automática
    const downloadResult = await descargarVideoConFallback(
      videoInfo.url,
      videoInfo.duration.seconds
    );

    if (!downloadResult?.url) {
      await conn.sendMessage(jid, {
        react: { text: "❌", key: m.key },
      });
      return conn.reply(jid, `❌ 𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝚅𝙸𝙳𝙴𝙾`, m);
    }

    // Descargar video
    const response = await fetch(downloadResult.url);
    const videoBuffer = await response.buffer();
    const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

    // Enviar video según tamaño
    const fileName = `${videoInfo.title
      .replace(/[<>:"/\\|?*]/g, "_")
      .substring(0, 50)}.mp4`;

    if (parseFloat(fileSizeMB) > 50) {
      // Mayor a 50MB, enviar como documento
      await conn.sendMessage(
        jid,
        {
          document: videoBuffer,
          mimetype: "video/mp4",
          fileName: fileName,
        },
        { quoted: m }
      );
    } else {
      // Menor a 50MB, enviar como video normal
      await conn.sendMessage(
        jid,
        {
          video: videoBuffer,
          caption: `🎬 *${videoInfo.title}*\n⏱️ ${videoInfo.duration.timestamp} | 📊 ${fileSizeMB}MB | 🔗 ${downloadResult.quality}`,
        },
        { quoted: m }
      );
    }

    // Reacción de éxito
    await conn.sendMessage(jid, {
      react: { text: "✅", key: m.key },
    });
  } catch (error) {
    console.error("❌ 𝙴𝚛𝚛𝚘𝚛 𝙿𝚕𝚊𝚢𝟸:", error);

    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(jid, `❌ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m);
  } finally {
    userDownloads.delete(userId);
  }
};

handler.help = ["play2"];
handler.tags = ["downloader"];
handler.command = ["play2"];

export default handler;
