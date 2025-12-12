import { convertAndDownload } from "../lib/cnvDownloader.js";
import axios from "axios";
import yts from "yt-search";
import crypto from "crypto";

// Sistema de descargas activas por usuario
const userDownloads = new Map();

// Límites de tamaño
const MAX_VIDEO_SIZE_MB = 1300; // 1.3GB para videos largos
const MAX_AUDIO_SIZE_MB = 20;

const AUDIO_COMMANDS = ["ytmp3", "yta", "ytaudio", "yt2"];
const VIDEO_COMMANDS = ["ytmp4", "ytv", "ytvideo"];

// Scraper savetube para videos mejorado
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
        throw new Error("Decryption failed: " + error.message);
      }
    },
  },
  youtube: (url) => {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
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
        timeout: 45000, // 45 segundos para videos largos
      });
      return {
        status: true,
        code: 200,
        data: response,
      };
    } catch (error) {
      throw new Error("Request failed: " + error.message);
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) throw new Error("CDN request failed");
    return {
      status: true,
      code: 200,
      data: response.data.cdn,
    };
  },
  // Nueva función para obtener todas las calidades disponibles
  getAvailableQualities: async (link) => {
    if (!link) return [];
    const id = savetube.youtube(link);
    if (!id) throw new Error("Invalid YouTube link.");

    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return [];
      const cdn = cdnx.data;
      const result = await savetube.request(
        `https://${cdn}${savetube.api.info}`,
        {
          url: `https://www.youtube.com/watch?v=${id}`,
        }
      );
      if (!result.status) return [];
      const decrypted = await savetube.crypto.decrypt(result.data.data);

      // Retornar calidades disponibles (ejemplo: podría incluir 2160)
      const availableQualities = [];
      if (decrypted.qualities) {
        return decrypted.qualities;
      }

      // Calidades por defecto si no hay información específica
      return ["144", "240", "360", "480", "720", "1080", "1440", "2160"];
    } catch (error) {
      console.error("Error getting qualities:", error);
      return ["144", "240", "360", "480", "720", "1080"];
    }
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
        // Intentar con calidad más baja si falla la solicitada
        if (quality === "2160") {
          console.log(`⚠️ 2160p falló, intentando 1080p...`);
          quality = "1080";
          dl = await savetube.request(
            `https://${cdn}${savetube.api.download}`,
            {
              id: id,
              downloadType: "video",
              quality: quality,
              key: decrypted.key,
            }
          );
        } else if (quality === "1440") {
          console.log(`⚠️ 1440p falló, intentando 1080p...`);
          quality = "1080";
          dl = await savetube.request(
            `https://${cdn}${savetube.api.download}`,
            {
              id: id,
              downloadType: "video",
              quality: quality,
              key: decrypted.key,
            }
          );
        } else {
          throw new Error("Failed to get download link.");
        }
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
      throw new Error(
        "An error occurred while processing your request: " + error.message
      );
    }
  },
};

// Función para descargar video con sistema de fallback
async function descargarVideoConFallback(videoUrl, quality = "720") {
  console.log(`🎯 Intentando savetube con calidad: ${quality}p`);

  // PRIMERO: Intentar con savetube
  try {
    const result = await savetube.downloadVideo(videoUrl, quality);
    if (result?.status && result?.result?.download) {
      console.log(`✅ Éxito con savetube (${quality}p)`);
      return {
        url: result.result.download,
        quality: result.result.quality,
        source: "savetube",
        title: result.result.title,
        duration: result.result.duration,
      };
    }
    throw new Error("Savetube no devolvió enlace");
  } catch (error) {
    console.log(`❌ Savetube falló: ${error.message}`);

    // SEGUNDO: Intentar con API alternativa (solo para calidades bajas)
    if (["144", "240", "360", "480"].includes(quality)) {
      try {
        console.log("🔄 Intentando con API alternativa...");
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
          console.log("✅ Éxito con API alternativa (360p)");
          return {
            url: response.data.descarga.enlace,
            quality: "360p",
            source: "backup_api",
          };
        }
      } catch (apiError) {
        console.log(`❌ API alternativa falló: ${apiError.message}`);
      }
    }
    throw new Error(`No se pudo descargar el video en calidad ${quality}p`);
  }
}

// Función para descargar video como buffer con manejo de tiempos largos
async function descargarVideoBuffer(videoUrl) {
  try {
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "arraybuffer",
      timeout: 300000, // 5 minutos para videos largos
      maxContentLength: 1365 * 1024 * 1024, // 1.3GB máximo
      maxBodyLength: 1365 * 1024 * 1024, // 1.3GB máximo
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
      onDownloadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (percent % 25 === 0) {
          // Mostrar cada 25%
          console.log(`📥 Descargando: ${percent}%`);
        }
      },
    });

    return {
      buffer: Buffer.from(response.data),
      size: response.data.length,
    };
  } catch (error) {
    throw new Error(`Error al descargar el video: ${error.message}`);
  }
}

// Función para extraer ID de YouTube
function extractVideoId(link) {
  if (link.includes("youtu.be/")) {
    return link.split("youtu.be/")[1].split("?")[0];
  } else if (link.includes("youtube.com/watch?v=")) {
    return link.split("v=")[1].split("&")[0];
  }
  return null;
}

// Función para validar calidad de video (incluye 4K)
function validarCalidadVideo(quality, videoDuration = 0) {
  const calidadesValidas = [
    "144",
    "240",
    "360",
    "480",
    "720",
    "1080",
    "1440",
    "2160",
  ];

  // Si se especifica calidad, validarla
  if (quality) {
    if (calidadesValidas.includes(quality)) {
      // Para videos muy largos, sugerir calidad más baja automáticamente
      if (videoDuration > 3600) {
        // Más de 1 hora
        if (["1440", "2160"].includes(quality)) {
          console.log(
            `⚠️ Video muy largo (${videoDuration}s), bajando calidad a 1080p`
          );
          return "1080";
        }
      }
      return quality;
    } else {
      // Si la calidad no es válida, usar por defecto basado en duración
      console.log(
        `⚠️ Calidad "${quality}" no válida, usando calidad automática`
      );
    }
  }

  // Calidad automática basada en duración
  if (videoDuration <= 300) {
    // ≤5 minutos
    return "720";
  } else if (videoDuration <= 900) {
    // 5-15 minutos
    return "480";
  } else if (videoDuration <= 1800) {
    // 15-30 minutos
    return "360";
  } else {
    // >30 minutos
    return "240";
  }
}

function validarBitrateAudio(bitrate) {
  const bitratesValidos = ["64", "128", "192", "256", "320"];
  if (bitratesValidos.includes(bitrate)) return bitrate;
  return "320";
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  const userId = m.sender;
  const jid = m.chat;

  // Verificar si ya tiene descarga en curso
  if (userDownloads.has(userId)) {
    return conn.reply(jid, `⚙️ 𝙴𝚂𝙿𝙴𝚁𝙴 𝙰 𝚀𝚄𝙴 𝚂𝚄 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝚃𝙴𝚁𝙼𝙸𝙽𝙴`, m);
  }

  const rawInput = (text || "").trim();
  const lowerCommand = (command || "").toLowerCase();
  const isAudioCommand = AUDIO_COMMANDS.includes(lowerCommand);
  const isVideoCommand = VIDEO_COMMANDS.includes(lowerCommand);
  const mode = isVideoCommand ? "video" : "audio";
  const isAudio = mode === "audio";

  let linkPart = rawInput;
  let qualityPart = "";

  // Parsear entrada
  if (rawInput.includes("|")) {
    const parts = rawInput.split("|");
    linkPart = (parts[0] || "").trim();
    qualityPart = (parts[1] || "").trim();
  } else if (args.length > 1) {
    linkPart = args[0];
    qualityPart = args.slice(1).join(" ");
  }

  if (!linkPart) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝙴𝙽𝙻𝙰𝙲𝙴 𝙳𝙴 𝚈𝙾𝚄𝚃𝚄𝙱𝙴*\n\n` +
        `▸ *𝚄𝚜𝚘:* ${usedPrefix}${command} <𝚞𝚛𝚕> | <𝚌𝚊𝚕𝚒𝚍𝚊𝚍>\n` +
        `▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘 𝚟𝚒𝚍𝚎𝚘:* ${usedPrefix}ytmp4 https://youtu.be/abc123 | 1080\n` +
        `▸ *𝙲𝚊𝚕𝚒𝚍𝚊𝚍𝚎𝚜 𝚟𝚒𝚍𝚎𝚘:* 144, 240, 360, 480, 720, 1080, 1440, 2160\n` +
        `▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘 𝚊𝚞𝚍𝚒𝚘:* ${usedPrefix}ytmp3 https://youtu.be/abc123 | 320\n` +
        `▸ *𝙱𝚒𝚝𝚛𝚊𝚝𝚎𝚜 𝚊𝚞𝚍𝚒𝚘:* 64, 128, 192, 256, 320`,
      m
    );
  }

  // Verificar si es URL de YouTube
  if (!linkPart.includes("youtube.com") && !linkPart.includes("youtu.be")) {
    return conn.reply(
      jid,
      `❌ 𝙴𝙽𝙻𝙰𝙲𝙴 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙾\n` + `▸ 𝙸𝚗𝚐𝚛𝚎𝚜𝚊 𝚞𝚗𝚊 𝚄𝚁𝙻 𝚟á𝚕𝚒𝚍𝚊 𝚍𝚎 𝚈𝚘𝚞𝚃𝚞𝚋𝚎`,
      m
    );
  }

  userDownloads.set(userId, true);

  try {
    // Reacción de búsqueda
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });

    // Extraer ID del video
    const videoId = extractVideoId(linkPart);
    if (!videoId || videoId.length !== 11) {
      throw new Error("𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙴𝚇𝚃𝚁𝙰𝙴𝚁 𝙴𝙻 𝙸𝙳 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾");
    }

    // Obtener información con yts
    const search = await yts({ videoId: videoId });
    if (!search) {
      throw new Error("𝚅𝙸𝙳𝙴𝙾 𝙽𝙾 𝙴𝙽𝙲𝙾𝙽𝚃𝚁𝙰𝙳𝙾");
    }

    // Configurar calidad según comando
    let quality = "";
    if (isAudio) {
      // Para audio: usar el sistema actual con cnvDownloader
      const audioBitrate = qualityPart
        ? validarBitrateAudio(qualityPart)
        : "320";

      // Mostrar información del video solo (sin mensaje adicional)
      await conn.sendMessage(
        jid,
        {
          image: { url: search.thumbnail },
          caption:
            `⚙️ *𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾*\n\n` +
            `🎬 *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${search.title}\n` +
            `👤 *𝙲𝚊𝚗𝚊𝚕:* ${search.author?.name || "Desconocido"}\n` +
            `⏱️ *𝙳𝚞𝚛𝚊𝚌𝚒𝚘́𝚗:* ${search.timestamp}\n` +
            `👀 *𝚅𝚒𝚜𝚝𝚊𝚜:* ${search.views?.toLocaleString() || "0"}\n\n` +
            `⏳ *𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙰𝚄𝙳𝙸𝙾...*` +
            `${
              audioBitrate !== "320" ? `\n▸ *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${audioBitrate}𝚔𝚋𝚙𝚜` : ""
            }`,
        },
        { quoted: m }
      );

      // Reacción de procesamiento
      await conn.sendMessage(jid, {
        react: { text: "⏳", key: m.key },
      });

      // CONVERTIR Y DESCARGAR AUDIO usando el sistema actual
      const result = await convertAndDownload(linkPart, {
        format: "mp3",
        audioBitrate,
        vCodec: "h264",
        timeout: 240000, // 4 minutos para audios largos
      });

      const fileSizeMB = (result.size / (1024 * 1024)).toFixed(1);

      // Verificar límites de WhatsApp
      if (fileSizeMB > MAX_AUDIO_SIZE_MB) {
        throw new Error(
          `𝙴𝙻 𝙰𝚄𝙳𝙸𝙾 (${fileSizeMB}𝙼𝙱) 𝙴𝚇𝙲𝙴𝙳𝙴 𝙴𝙻 𝙻𝙸́𝙼𝙸𝚃𝙴 𝙳𝙴 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 (${MAX_AUDIO_SIZE_MB}𝙼𝙱)`
        );
      }

      const fileName = `[KARBOT] ${search.title
        .substring(0, 50)
        .replace(/[<>:"/\\|?*]/g, "_")}.mp3`;

      // ENVIAR AUDIO (sin mensaje adicional después)
      await conn.sendMessage(
        jid,
        {
          audio: result.buffer,
          mimetype: "audio/mpeg",
          fileName: fileName,
          ptt: false,
        },
        { quoted: m }
      );

      // Reacción de éxito
      await conn.sendMessage(jid, {
        react: { text: "✅", key: m.key },
      });
    } else {
      // Para video: usar el sistema savetube
      const videoDuration = search.seconds || 0;
      const videoQuality = validarCalidadVideo(qualityPart, videoDuration);

      // Mostrar información del video con calidad seleccionada
      await conn.sendMessage(
        jid,
        {
          image: { url: search.thumbnail },
          caption:
            `⚙️ *𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾*\n\n` +
            `🎬 *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${search.title}\n` +
            `👤 *𝙲𝚊𝚗𝚊𝚕:* ${search.author?.name || "Desconocido"}\n` +
            `⏱️ *𝙳𝚞𝚛𝚊𝚌𝚒𝚘́𝚗:* ${search.timestamp}\n` +
            `👀 *𝚅𝚒𝚜𝚝𝚊𝚜:* ${search.views?.toLocaleString() || "0"}\n\n` +
            `⏳ *𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝚅𝙸𝙳𝙴𝙾...*` +
            `\n▸ *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${videoQuality}𝚙`,
        },
        { quoted: m }
      );

      // Reacción de procesamiento
      await conn.sendMessage(jid, {
        react: { text: "⏳", key: m.key },
      });

      // DESCARGAR VIDEO usando savetube con fallback
      const downloadResult = await descargarVideoConFallback(
        linkPart,
        videoQuality
      );

      if (!downloadResult?.url) {
        throw new Error("𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝚅𝙸𝙳𝙴𝙾");
      }

      // Descargar buffer del video
      const videoData = await descargarVideoBuffer(downloadResult.url);
      const fileSizeMB = (videoData.size / (1024 * 1024)).toFixed(1);

      const fileName = `[KARBOT] ${search.title
        .substring(0, 50)
        .replace(/[<>:"/\\|?*]/g, "_")}.mp4`;

      // Determinar cómo enviar el video basado en tamaño
      const maxVideoSizeNative = 80 * 1024 * 1024; // 80MB para video nativo

      if (videoData.size <= maxVideoSizeNative) {
        try {
          // Intentar enviar como video nativo
          await conn.sendMessage(
            jid,
            {
              video: videoData.buffer,
              mimetype: "video/mp4",
              fileName: fileName,
            },
            { quoted: m }
          );
        } catch (videoError) {
          console.log(
            "⚠️ Falló envío nativo, enviando como documento:",
            videoError.message
          );
          // Fallback a documento
          await conn.sendMessage(
            jid,
            {
              document: videoData.buffer,
              mimetype: "video/mp4",
              fileName: fileName,
            },
            { quoted: m }
          );
        }
      } else {
        // Video muy grande (>80MB), enviar siempre como documento
        await conn.sendMessage(
          jid,
          {
            document: videoData.buffer,
            mimetype: "video/mp4",
            fileName: fileName,
          },
          { quoted: m }
        );
      }

      // Reacción de éxito
      await conn.sendMessage(jid, {
        react: { text: "✅", key: m.key },
      });
    }
  } catch (error) {
    console.error(`❌ 𝙴𝚛𝚛𝚘𝚛 ${isAudio ? "𝚈𝚃𝙼𝙿𝟹" : "𝚈𝚃𝙼𝙿𝟺"}:`, error);

    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(
      jid,
      `❌ 𝙴𝚁𝚁𝙾𝚁: ${error.message || "𝙴𝚁𝚁𝙾𝚁 𝙳𝙴𝚂𝙲𝙾𝙽𝙾𝙲𝙸𝙳𝙾"}\n` +
        `▸ 𝚅𝚎𝚛𝚒𝚏𝚒𝚌𝚊 𝚚𝚞𝚎 𝚎𝚕 𝚟𝚒𝚍𝚎𝚘 𝚗𝚘 𝚎𝚜𝚝é́ 𝚛𝚎𝚜𝚝𝚛𝚒𝚗𝚐𝚒𝚍𝚘\n` +
        `▸ 𝙸𝚗𝚝𝚎𝚗𝚝𝚊 𝚌𝚘𝚗 𝚘𝚝𝚛𝚘 𝚎𝚗𝚕𝚊𝚌𝚎\n` +
        `${
          isAudio ? "▸ 𝙿𝚛𝚞𝚎𝚋𝚊 𝚌𝚘𝚗 𝚖𝚎𝚗𝚘𝚜 𝚋𝚒𝚝𝚛𝚊𝚝𝚎" : "▸ 𝙿𝚛𝚞𝚎𝚋𝚊 𝚌𝚘𝚗 𝚖𝚎𝚗𝚘𝚜 𝚌𝚊𝚕𝚒𝚍𝚊𝚍"
        }`,
      m
    );
  } finally {
    userDownloads.delete(userId);
  }
};

handler.help = [
  "ytmp3 <url> | <calidad>",
  "ytmp4 <url> | <calidad>",
];
handler.tags = ["downloader"];
handler.command = /^(ytmp3|ytmp4|yta|ytaudio|ytv|ytvideo)$/i;

export default handler;
