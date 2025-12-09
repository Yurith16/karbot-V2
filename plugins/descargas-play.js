import fetch from "node-fetch";
import yts from "yt-search";

let handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(m.chat, `𝚄𝚜𝚘: ${usedPrefix}𝚙𝚕𝚊𝚢 𝚗𝚘𝚖𝚋𝚛𝚎 𝚍𝚎 𝚕𝚊 𝚌𝚊𝚗𝚌𝚒ó𝚗`, m);
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: "🕑", key: m.key } });

    const search = await yts(text);
    if (!search.videos.length) throw new Error("𝙽𝚘 𝚑𝚊𝚢 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜");

    const video = search.videos[0];
    const { title, url } = video;

    const fuentes = [
      {
        api: "𝙰𝚍𝚘𝚗𝚒𝚡",
        endpoint: `https://api-adonix.ultraplus.click/download/ytaudio?apikey=${
          global.apikey
        }&url=${encodeURIComponent(url)}`,
        extractor: (res) => res?.data?.url,
      },
      {
        api: "𝙼𝚊𝚢𝙰𝙿𝙸",
        endpoint: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(
          url
        )}&type=mp3&apikey=${global.APIKeys["https://mayapi.ooguy.com"]}`,
        extractor: (res) => res.result.url,
      },
    ];

    let audioUrl,
      exito = false;

    for (let fuente of fuentes) {
      try {
        const response = await fetch(fuente.endpoint);
        if (!response.ok) continue;
        const data = await response.json();
        const link = fuente.extractor(data);
        if (link) {
          audioUrl = link;
          exito = true;
          break;
        }
      } catch (err) {
        console.log(`𝙴𝚛𝚛𝚘𝚛: ${fuente.api}`);
      }
    }

    if (!exito) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return conn.reply(m.chat, `𝙴𝚛𝚛𝚘𝚛 𝚍𝚎 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊`, m);
    }

    // Envía el audio CON caption breve
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title.substring(0, 30)}.mp3`,
        ptt: false,
        caption: `🎵 ${title}\n⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️`,
      },
      { quoted: m }
    );

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch (e) {
    console.error("𝙴𝚛𝚛𝚘𝚛:", e);
    await conn.reply(m.chat, `𝙴𝚛𝚛𝚘𝚛: ${e.message}`, m);
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
  }
};

handler.help = ["play"];
handler.tags = ["downloader"];
handler.command = ["play"];
handler.group = true;

export default handler;
