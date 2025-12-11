import axios from "axios";
import ytSearch from "yt-search";
import crypto from "crypto";

// Sistema de descargas activas por usuario
const userDownloads = new Map();

// Scraper savetube para audio
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
        throw new Error("Error decrypting data");
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
        timeout: 30000,
      });
      return {
        status: true,
        code: 200,
        data: response,
      };
    } catch (error) {
      throw new Error("Request failed");
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
  downloadAudio: async (link) => {
    if (!link) throw new Error("No link provided");

    const id = savetube.youtube(link);
    if (!id) throw new Error("Invalid YouTube link");

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
          downloadType: "audio",
          quality: "128",
          key: decrypted.key,
        });
      } catch (error) {
        throw new Error("Failed to get download link");
      }

      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Unknown Title",
          type: "audio",
          format: "mp3",
          thumbnail:
            decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration,
          quality: "128",
        },
      };
    } catch (error) {
      throw new Error("An error occurred while processing your request");
    }
  },
};

// Función para validar URLs de YouTube
function isValidYouTubeUrl(text) {
  try {
    const ytRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|music\.youtube.com\/watch\?v=)/i;
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
      const videoInfo = await ytSearch({ videoId: videoId });
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
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        views: videoInfo.views || 0,
        ago: videoInfo.ago || "Desconocido",
      };
    } catch (error) {
      // Fallback con noembed
      try {
        const response = await axios.get(
          `https://noembed.com/embed?url=https://youtu.be/${videoId}`
        );
        const data = response.data;

        return {
          videoId: videoId,
          url: `https://youtu.be/${videoId}`,
          title: data.title || "Sin título",
          author: { name: data.author_name || "Desconocido" },
          duration: {
            timestamp: "00:00",
          },
          thumbnail:
            data.thumbnail_url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          views: 0,
          ago: "",
        };
      } catch (error) {
        throw new Error(
          `Error al obtener información de la URL: ${error.message}`
        );
      }
    }
  } else {
    // Es una búsqueda por texto
    try {
      const search = await ytSearch(text);
      if (!search.videos || search.videos.length === 0) {
        throw new Error(`No se encontraron resultados para "${text}"`);
      }

      const video = search.videos[0];
      return {
        videoId: extractVideoId(video.url) || "unknown",
        url: video.url,
        title: video.title,
        author: { name: video.author?.name || "Desconocido" },
        duration: {
          timestamp: video.timestamp || "00:00",
          seconds: video.seconds || 0,
        },
        thumbnail: video.thumbnail,
        views: video.views || 0,
        ago: video.ago || "Desconocido",
      };
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }
}

// Sistema de descarga con fallback (privado - sin mostrar fuente)
async function descargarAudioConFallback(videoUrl) {
  console.log("🎵 Obteniendo enlace de audio...");

  // PRIMERO: Intentar con savetube
  try {
    const result = await savetube.downloadAudio(videoUrl);
    if (result?.status && result?.result?.download) {
      console.log("✅ Enlace obtenido exitosamente");
      return {
        url: result.result.download,
        quality: "128kbps",
      };
    }
    throw new Error("No se pudo obtener el enlace");
  } catch (error) {
    console.log(`❌ Primer método falló: ${error.message}`);

    // SEGUNDO: Intentar con API Nekolabs
    try {
      console.log("🔄 Intentando método alternativo...");
      const apiUrl = `https://api.nekolabs.web.id/downloader/youtube/v1?url=${videoUrl}&format=mp3`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.data?.result?.downloadUrl) {
        console.log("✅ Enlace obtenido exitosamente");
        return {
          url: response.data.result.downloadUrl,
          quality: "128kbps",
        };
      }
      throw new Error("No se pudo obtener el enlace");
    } catch (error1) {
      console.log(`❌ Segundo método falló: ${error1.message}`);

      // TERCERO: Intentar con API FGSI
      try {
        console.log("🔄 Intentando método adicional...");
        const apiUrl = `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${videoUrl}&type=mp3`;
        const response = await axios.get(apiUrl, {
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.data?.data?.url) {
          console.log("✅ Enlace obtenido exitosamente");
          return {
            url: response.data.data.url,
            quality: "128kbps",
          };
        }
        throw new Error("No se pudo obtener el enlace");
      } catch (error2) {
        console.log(`❌ Tercer método falló: ${error2.message}`);

        // Métodos adicionales (sin logging de nombres específicos)
        const fallbackAPIs = [
          {
            endpoint: (url) =>
              `https://api-adonix.ultraplus.click/download/ytaudio?apikey=${
                global.apikey || ""
              }&url=${encodeURIComponent(url)}`,
            parser: (data) => data?.downloadUrl || data?.url,
          },
          {
            endpoint: (url) =>
              `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(
                url
              )}&type=mp3&apikey=${
                global.APIKeys?.["https://mayapi.ooguy.com"] || ""
              }`,
            parser: (data) => data?.url || data?.downloadUrl,
          },
          {
            endpoint: (url) =>
              `https://sky-api-ashy.vercel.app/download/ytmp3?url=${encodeURIComponent(
                url
              )}`,
            parser: (data) => data?.result?.url,
          },
        ];

        // Intentar métodos adicionales
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
              console.log("✅ Enlace obtenido exitosamente");
              return {
                url: downloadUrl,
                quality: "128kbps",
              };
            }
          } catch (apiError) {
            console.log("❌ Método adicional falló");
            continue;
          }
        }

        throw new Error("No se pudo obtener el audio. Intenta con otro enlace");
      }
    }
  }
}

// Función para descargar audio como buffer (optimizada)
async function descargarAudioBuffer(audioUrl) {
  try {
    const response = await axios({
      method: "GET",
      url: audioUrl,
      responseType: "arraybuffer",
      timeout: 180000,
      maxContentLength: 300 * 1024 * 1024,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
        "Accept-Encoding": "identity",
        Connection: "keep-alive",
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("El audio descargado está vacío");
    }

    const buffer = Buffer.from(response.data);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);

    console.log(`✅ Audio descargado: ${sizeMB}MB`);

    return {
      buffer: buffer,
      sizeMB: sizeMB,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    throw new Error(`Error al descargar el audio: ${error.message}`);
  }
}

// Handler principal para playdoc
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
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽 𝙰𝚄𝙳𝙸𝙾*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}playdoc <𝚗𝚘𝚖𝚋𝚛𝚎/𝚎𝚗𝚕𝚊𝚌𝚎>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}playdoc 𝚗𝚘𝚖𝚋𝚛𝚎 𝚍𝚎 𝚌𝚊𝚗𝚌𝚒𝚘́𝚗\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}playdoc 𝚑𝚝𝚝𝚙𝚜://𝚢𝚘𝚞𝚝𝚞.𝚋𝚎/𝚊𝚋𝚌𝟷𝟸𝟹`,
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

    // Mostrar información del video con imagen + "Procesando pedido..."
    const videoDetails =
      `⚙️ *𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝚅𝙸𝙳𝙴𝙾*\n\n` +
      `🎵 *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${video.title}\n` +
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

    // Obtener enlace de descarga
    const downloadResult = await descargarAudioConFallback(video.url);

    if (!downloadResult?.url) {
      await conn.sendMessage(jid, {
        react: { text: "❌", key: m.key },
      });
      return conn.reply(jid, `❌ 𝙽𝙾 𝚂𝙴 𝙿𝚄𝙳𝙾 𝙾𝙱𝚃𝙴𝙽𝙴𝚁 𝙴𝙻 𝙰𝚄𝙳𝙸𝙾`, m);
    }

    // Descargar el audio
    const audioData = await descargarAudioBuffer(downloadResult.url);

    if (!audioData.buffer || audioData.sizeBytes === 0) {
      throw new Error("El audio se descargó vacío");
    }

    // **ENVIAR COMO DOCUMENTO** (MP3 como archivo) - SIN CAPTION
    const fileName = `${video.title
      .replace(/[<>:"/\\|?*]/g, "_")
      .substring(0, 64)}.mp3`;

    await conn.sendMessage(
      jid,
      {
        document: audioData.buffer,
        mimetype: "audio/mpeg",
        fileName: fileName,
      },
      { quoted: m } // Respondiendo al mensaje del usuario
    );

    // Reacción de éxito
    await conn.sendMessage(jid, {
      react: { text: "✅", key: m.key },
    });
  } catch (error) {
    console.error("❌ 𝙴𝚛𝚛𝚘𝚛 𝙿𝚕𝚊𝚢𝚍𝚘𝚌:", error);

    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(jid, `❌ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m);
  } finally {
    userDownloads.delete(userId);
  }
};

handler.help = ["playdoc"];
handler.tags = ["downloader"];
handler.command = ["playdoc"];

export default handler;
