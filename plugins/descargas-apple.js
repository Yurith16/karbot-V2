import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import { pipeline } from "node:stream/promises";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const BASE_URL = "https://aaplmusicdownloader.com";
const API_PATH = "/api/composer/swd.php";
const SONG_PAGE = "/song.php";
const DEFAULT_MIME = "application/x-www-form-urlencoded; charset=UTF-8";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const FALLBACK_FILENAME = "audio.m4a";

const { promises: fsp } = fs;
const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: BASE_URL,
    jar,
    withCredentials: true,
    headers: {
      "user-agent": DEFAULT_USER_AGENT,
      accept: "application/json, text/javascript, */*; q=0.01",
      referer: `${BASE_URL}${SONG_PAGE}`,
    },
  })
);

async function searchAppleMusic(query) {
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&limit=5`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
    });

    if (!response.data || !response.data.results) {
      throw new Error("𝚂𝚒𝚗 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜");
    }

    return response.data.results.map((track) => ({
      trackId: track.trackId,
      title: track.trackName || "𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘",
      artist: track.artistName || "𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘",
      album: track.collectionName || "𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘",
      artwork: track.artworkUrl100?.replace("100x100", "600x600") || null,
      appleUrl:
        track.trackViewUrl ||
        `https://music.apple.com/us/album/${track.collectionId}?i=${track.trackId}`,
    }));
  } catch (error) {
    throw new Error(`𝙱𝚞́𝚜𝚚𝚞𝚎𝚍𝚊 𝚏𝚊𝚕𝚕𝚘́: ${error.message}`);
  }
}

async function warmUpSession() {
  await client.get(SONG_PAGE, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    params: { cacheBust: Date.now() },
  });
}

function buildPayload({
  songName,
  artistName,
  appleUrl,
  quality,
  zipDownload,
  token,
}) {
  const payload = new URLSearchParams();
  payload.set("song_name", songName);
  payload.set("artist_name", artistName);
  payload.set("url", appleUrl);
  payload.set("token", token);
  payload.set("zip_download", String(Boolean(zipDownload)));
  payload.set("quality", quality);
  return payload.toString();
}

async function requestDownloadLink(params) {
  const body = buildPayload(params);
  const response = await client.post(API_PATH, body, {
    headers: {
      "content-type": DEFAULT_MIME,
      "x-requested-with": "XMLHttpRequest",
      origin: BASE_URL,
    },
  });
  if (
    !response.data ||
    response.data.status !== "success" ||
    !response.data.dlink
  ) {
    throw new Error(`𝙰𝙿𝙸 𝚜𝚒𝚗 𝚎𝚗𝚕𝚊𝚌𝚎`);
  }
  return response.data.dlink;
}

function inferFilename(downloadUrl) {
  try {
    const parsed = new URL(downloadUrl);
    const queryName = parsed.searchParams.get("fname");
    const fromQuery = queryName ? decodeURIComponent(queryName.trim()) : "";
    const pathCandidate = decodeURIComponent(
      parsed.pathname.split("/").pop() ?? ""
    ).trim();
    const picked = fromQuery || pathCandidate || FALLBACK_FILENAME;
    if (!path.extname(picked)) {
      return `${picked}.m4a`;
    }
    return picked;
  } catch {
    return FALLBACK_FILENAME;
  }
}

async function resolveOutputPath(downloadUrl) {
  const fallbackName = inferFilename(downloadUrl);
  const tempDir = path.join(process.cwd(), "tmp", "applemusic");
  await fsp.mkdir(tempDir, { recursive: true });
  return path.join(tempDir, fallbackName);
}

async function downloadFile(downloadUrl) {
  const destination = await resolveOutputPath(downloadUrl);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const response = await axios.get(downloadUrl, {
    responseType: "stream",
    headers: {
      referer: `${BASE_URL}${SONG_PAGE}`,
      "user-agent": DEFAULT_USER_AGENT,
      accept: "*/*",
    },
  });
  await pipeline(response.data, fs.createWriteStream(destination));
  return destination;
}

function pickMimetype(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a" || ext === ".mp4" || ext === ".aac") return "audio/mp4";
  return "audio/mp4";
}

// Función para crear barra de progreso
function createProgressBar(percentage) {
  const totalBars = 20;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
  return `[${bar}] ${percentage}%`;
}

// Función para extraer datos de URL de Apple Music
function extractFromAppleUrl(url) {
  try {
    const parsed = new URL(url);
    const trackIdMatch = url.match(/i=(\d+)/);
    const trackId = trackIdMatch ? trackIdMatch[1] : null;
    return { trackId, url: parsed.href };
  } catch {
    return { trackId: null, url };
  }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args.length) {
    return m.reply(
      `𝚄𝚜𝚘: ${usedPrefix}${command} 𝚗𝚘𝚖𝚋𝚛𝚎 𝚌𝚊𝚗𝚌𝚒𝚘́𝚗\n𝙴𝚓𝚎𝚖𝚙𝚕𝚘: ${usedPrefix}${command} 𝚋𝚕𝚊𝚗𝚔 𝚜𝚙𝚊𝚌𝚎`
    );
  }

  const input = args.join(" ");
  const isUrl = /^https?:\/\//i.test(input);
  let appleUrl = "";
  let songName = "";
  let artistName = "";

  // Variable para almacenar el mensaje
  let loadingMsg = null;

  try {
    // Enviar mensaje inicial
    loadingMsg = await conn.sendMessage(
      m.chat,
      {
        text: `⚙️ 𝙸𝙽𝙸𝙲𝙸𝙰𝙽𝙳𝙾...\n${createProgressBar(0)}`,
      },
      { quoted: m }
    );

    // ESPERAR 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Progreso más lento con MENOS actualizaciones
    const progressSteps = [
      { percent: 10, text: "𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙽𝙳𝙾..." },
      { percent: 25, text: "𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾..." },
      { percent: 40, text: "𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾..." },
      { percent: 60, text: "𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾..." },
      { percent: 80, text: "𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝙽𝙳𝙾..." },
      { percent: 100, text: "𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰𝙳𝙾" },
    ];

    for (let step of progressSteps) {
      const { percent, text } = step;
      try {
        await conn.sendMessage(m.chat, {
          text: `⚙️ ${text}\n${createProgressBar(percent)}`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        console.log("Error editando mensaje:", e.message);
        break;
      }

      // ESPERAR 1.5 segundos entre actualizaciones
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Realizar búsqueda después de mostrar progreso
    if (isUrl) {
      appleUrl = input;
      const urlData = extractFromAppleUrl(appleUrl);
      songName = "𝙰𝚙𝚙𝚕𝚎 𝙼𝚞𝚜𝚒𝚌";
      artistName = "𝙰𝚛𝚝𝚒𝚜𝚝𝚊";
    } else {
      const results = await searchAppleMusic(input);

      if (!results || results.length === 0) {
        await conn.sendMessage(m.chat, {
          text: `❌ 𝙽𝚘 𝚜𝚎 𝚎𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚛𝚘𝚗 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜 𝚙𝚊𝚛𝚊: ${input}`,
          edit: loadingMsg.key,
        });
        return;
      }

      const firstResult = results[0];
      appleUrl = firstResult.appleUrl;
      songName = firstResult.title;
      artistName = firstResult.artist;
    }

    // Calentamiento de sesión
    await warmUpSession();

    // Obtener enlace de descarga
    const params = {
      songName,
      artistName,
      appleUrl,
      quality: "m4a",
      zipDownload: false,
      token: "none",
    };

    const downloadLink = await requestDownloadLink(params);

    if (!downloadLink) {
      throw new Error("𝙽𝚘 𝚑𝚊𝚢 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊");
    }

    // Mostrar mensaje de descarga
    try {
      await conn.sendMessage(m.chat, {
        text: "✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n𝙴𝚗𝚟𝚒𝚊𝚗𝚍𝚘 𝚊𝚞𝚍𝚒𝚘...",
        edit: loadingMsg.key,
      });
    } catch (e) {}

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Descargar archivo
    const savedTo = await downloadFile(downloadLink);
    const fileBuffer = await fsp.readFile(savedTo);
    const mimetype = pickMimetype(savedTo);

    // Enviar audio SIN CAPTION
    await conn.sendMessage(
      m.chat,
      {
        audio: fileBuffer,
        mimetype: mimetype,
        fileName: `${songName}.m4a`.replace(/[<>:"/\\|?*]/g, "_"),
        ptt: false,
        // SIN CAPTION
      },
      { quoted: m }
    );

    // Limpiar archivo temporal
    await fsp.unlink(savedTo).catch(() => null);
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙰𝙿𝙿𝙻𝙴:", error);

    // Mostrar error en el mensaje
    if (loadingMsg) {
      try {
        await conn.sendMessage(m.chat, {
          text: `❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        await m.reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`);
      }
    } else {
      await m.reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`);
    }
  }
};

// Comando único para todo
handler.command = /^(apple|applemusic|appledl)$/i;
handler.tags = ["downloader"];
handler.help = ["apple <nombre/url>"];
handler.register = false;

export default handler;
