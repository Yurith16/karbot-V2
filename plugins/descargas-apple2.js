import axios from "axios";

const SEARCH_ENDPOINT = "https://itunes.apple.com/search";
const DEFAULT_LIMIT = 10;
const DEFAULT_COUNTRY = "us";
const AXIOS_TIMEOUT_MS = 15000;

const userRequests = {};

async function searchSongs(term, limit = DEFAULT_LIMIT) {
  const params = new URLSearchParams({
    term,
    limit: String(limit),
    country: DEFAULT_COUNTRY,
    media: "music",
    entity: "song",
  });
  const { data } = await axios.get(SEARCH_ENDPOINT, {
    params,
    timeout: AXIOS_TIMEOUT_MS,
  });
  return Array.isArray(data?.results) ? data.results : [];
}

const handler = async (m, { conn, args, usedPrefix }) => {
  const jid = m.chat;
  const userId = m.sender;
  const senderKey = userId.split("@")[0];
  const text = args.join(" ");

  if (!text) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}applesearch <𝚝𝚎𝚡𝚝𝚘>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}applesearch 𝚜𝚑𝚊𝚔𝚒𝚛𝚊`,
      m
    );
  }

  // Verificar si ya tiene una búsqueda en proceso
  if (userRequests[senderKey]) {
    return conn.reply(jid, `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙾𝚃𝚁𝙰 𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰`, m);
  }

  userRequests[senderKey] = true;

  try {
    // Reaccionar con lupa
    await conn.sendMessage(jid, {
      react: { text: "🔍", key: m.key },
    });

    // Realizar búsqueda
    const results = await searchSongs(text, DEFAULT_LIMIT);

    if (!results || results.length === 0) {
      await conn.sendMessage(jid, {
        react: { text: "❌", key: m.key },
      });
      return conn.reply(jid, `❌ 𝙽𝙾 𝙷𝙰𝚈 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂\n▸ *𝙱𝚞́𝚜𝚚𝚞𝚎𝚍𝚊:* ${text}`, m);
    }

    // Construir mensaje con el formato específico
    let resultText = ` *「✦」 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂 𝙰𝙿𝙿𝙻𝙴 𝙼𝚄𝚂𝙸𝙲*\n\n`;
    resultText += `> ✦ *𝙱𝚞́𝚜𝚚𝚞𝚎𝚍𝚊:* » ${text}\n`;
    resultText += `> ⴵ *𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜:* » ${results.length} 𝚌𝚊𝚗𝚌𝚒𝚘𝚗𝚎𝚜\n\n`;
    resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    results.forEach((video, index) => {
      const number = (index + 1).toString().padStart(2, "0");
      const duration = video.trackTimeMillis || 0;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      resultText += ` *「${number}」 ${video.trackName || "𝚂𝚒𝚗 𝚝𝚒́𝚝𝚞𝚕𝚘"}*\n\n`;
      resultText += `> ✦ *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* » ${video.artistName || "𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘"}\n`;
      resultText += `> ⴵ *𝙰́𝚕𝚋𝚞𝚖:* » ${video.collectionName || "𝚂𝚒𝚗 𝚊́𝚕𝚋𝚞𝚖"}\n`;
      resultText += `> 📅 *𝙻𝚊𝚗𝚣𝚊𝚖𝚒𝚎𝚗𝚝𝚘:* » ${
        video.releaseDate ? video.releaseDate.split("T")[0] : "𝙽/𝙰"
      }\n`;
      resultText += `> 🎵 *𝙳𝚞𝚛𝚊𝚌𝚒𝚘́𝚗:* » ${durationStr}\n`;
      resultText += `> 🔗 *𝚄𝚁𝙻:* » ${video.trackViewUrl}\n\n`;

      // Separador entre resultados (excepto el último)
      if (index < results.length - 1) {
        resultText += `────────────────────────────\n\n`;
      }
    });

    resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    resultText += `⚙️ *𝙸𝙽𝚂𝚃𝚁𝚄𝙲𝙲𝙸𝙾𝙽𝙴𝚂:*\n`;
    resultText += `▸ 𝚄𝚜𝚊 *${usedPrefix}apple* + 𝚄𝚁𝙻 𝚙𝚊𝚛𝚊 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛\n`;
    resultText += `▸ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘: ${usedPrefix}apple https://music.apple.com/...`;

    // Enviar resultados
    await conn.reply(jid, resultText, m);

    // Cambiar reacción a engranaje
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝚎𝚗 𝚋𝚞́𝚜𝚚𝚞𝚎𝚍𝚊:", error);

    // Cambiar reacción a error
    await conn.sendMessage(jid, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(jid, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
  } finally {
    // Limpiar estado del usuario
    delete userRequests[senderKey];
  }
};

handler.command = ["applesearch", "apples", "buscarapple"];
handler.help = ["applesearch <texto>"];
handler.tags = ["search", "apple"];

export default handler;
