import axios from "axios";
import cheerio from "cheerio";
import { lookup } from "mime-types";

// Función para crear barra de progreso
function createProgressBar(percentage) {
  const totalBars = 20;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
  return `[${bar}] ${percentage}%`;
}

// Sistema de descargas activas por usuario
const activeDownloads = new Map();

async function mediafireDl(url) {
  try {
    if (!url.includes("mediafire.com")) {
      throw new Error("𝚄𝚁𝙻 𝚒𝚗𝚟𝚊́𝚕𝚒𝚍𝚊");
    }

    let res;
    let $;
    let link = null;

    // MÉTODO 1: Descarga directa
    try {
      res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
          Referer: "https://www.mediafire.com/",
        },
        timeout: 30000,
      });

      $ = cheerio.load(res.data);

      const downloadButton = $("#downloadButton");
      link = downloadButton.attr("href");

      if (!link || link.includes("javascript:void(0)")) {
        link =
          downloadButton.attr("data-href") ||
          downloadButton.attr("data-url") ||
          downloadButton.attr("data-link");

        const scrambledUrl = downloadButton.attr("data-scrambled-url");
        if (scrambledUrl) {
          try {
            link = Buffer.from(scrambledUrl, "base64").toString("utf8");
          } catch (e) {}
        }
      }

      if (!link || link.includes("javascript:void(0)")) {
        const htmlContent = res.data;
        const linkMatch = htmlContent.match(
          /href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/
        );
        if (linkMatch) {
          link = linkMatch[1];
        } else {
          const altMatch = htmlContent.match(
            /"(https:\/\/[^"]*mediafire[^"]*\.(zip|rar|pdf|jpg|jpeg|png|gif|mp4|mp3|exe|apk|txt|doc|docx|xls|xlsx|ppt|pptx)[^"]*)"/i
          );
          if (altMatch) {
            link = altMatch[1];
          }
        }
      }
    } catch (directError) {
      // MÉTODO 2: Usar proxy de traducción
      try {
        const translateUrl = `https://www-mediafire-com.translate.goog/${url.replace(
          "https://www.mediafire.com/",
          ""
        )}?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=wapp`;
        res = await axios.get(translateUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 30000,
        });

        $ = cheerio.load(res.data);
        const downloadButton = $("#downloadButton");
        link = downloadButton.attr("href");

        if (!link || link.includes("javascript:void(0)")) {
          const scrambledUrl = downloadButton.attr("data-scrambled-url");
          if (scrambledUrl) {
            try {
              link = Buffer.from(scrambledUrl, "base64").toString("utf8");
            } catch (e) {}
          }
        }
      } catch (translateError) {
        throw new Error("𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚊𝚌𝚌𝚎𝚍𝚎𝚛 𝚊𝚕 𝚎𝚗𝚕𝚊𝚌𝚎");
      }
    }

    if (!link || link.includes("javascript:void(0)")) {
      throw new Error("𝙽𝚘 𝚑𝚊𝚢 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊");
    }

    const name =
      $(
        "body > main > div.content > div.center > div > div.dl-btn-cont > div.dl-btn-labelWrap > div.promoDownloadName.notranslate > div"
      )
        .attr("title")
        ?.replace(/\s+/g, " ")
        ?.replace(/\n/g, "") ||
      $(".dl-btn-label").attr("title") ||
      $(".filename").text().trim() ||
      "𝚊𝚛𝚌𝚑𝚒𝚟𝚘";

    const date =
      $(
        "body > main > div.content > div.center > div > div.dl-info > ul > li:nth-child(2) > span"
      )
        .text()
        .trim() ||
      $(".details li:nth-child(2) span").text().trim() ||
      "𝙽/𝙰";

    const size =
      $("#downloadButton")
        .text()
        .replace("Download", "")
        .replace(/[()]/g, "")
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim() ||
      $(".details li:first-child span").text().trim() ||
      "𝙽/𝙰";

    let mime = "";
    const ext = name.split(".").pop()?.toLowerCase();
    mime = lookup(ext) || "application/octet-stream";

    if (!link.startsWith("http")) {
      throw new Error("𝙴𝚗𝚕𝚊𝚌𝚎 𝚒𝚗𝚟𝚊́𝚕𝚒𝚍𝚘");
    }

    return { name, size, date, mime, link };
  } catch (error) {
    throw new Error(`𝙴𝚛𝚛𝚘𝚛: ${error.message}`);
  }
}

const handler = async (m, { conn, args, usedPrefix }) => {
  const jid = m.chat;
  const userId = m.sender;
  const userNumber = userId.split("@")[0];
  const text = args.join(" ").trim();

  if (activeDownloads.has(userNumber)) {
    return conn.reply(jid, `⚙️ 𝙴𝚂𝙿𝙴𝚁𝙴 𝙰 𝚀𝚄𝙴 𝚂𝚄 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝚃𝙴𝚁𝙼𝙸𝙽𝙴`, m);
  }

  if (!text) {
    return conn.reply(
      jid,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝚄𝚁𝙻*\n\n▸ *𝚄𝚜𝚘:* ${usedPrefix}mediafire <𝚎𝚗𝚕𝚊𝚌𝚎>\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}mediafire https://mediafire.com/...`,
      m
    );
  }

  activeDownloads.set(userNumber, true);
  let loadingMsg = null;
  let fileInfo = null;
  let fileBuffer = null;

  try {
    // Reaccionar con espera
    await conn.sendMessage(jid, {
      react: { text: "⏳", key: m.key },
    });

    // Enviar mensaje inicial de carga
    loadingMsg = await conn.sendMessage(
      jid,
      {
        text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙴𝙽𝙻𝙰𝙲𝙴...\n${createProgressBar(10)}`,
      },
      { quoted: m }
    );

    // Progreso de conexión
    await conn.sendMessage(jid, {
      text: `⚙️ 𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙽𝙳𝙾 𝙰 𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴...\n${createProgressBar(30)}`,
      edit: loadingMsg.key,
    });

    // Obtener información del archivo
    fileInfo = await mediafireDl(text);

    // Progreso de análisis
    await conn.sendMessage(jid, {
      text: `⚙️ 𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾 𝙰𝚁𝙲𝙷𝙸𝚅𝙾...\n${createProgressBar(60)}`,
      edit: loadingMsg.key,
    });

    const { name: fileName, size, date, mime, link } = fileInfo;

    // Progreso de descarga
    await conn.sendMessage(jid, {
      react: { text: "📥", key: m.key },
    });

    await conn.sendMessage(jid, {
      text: `⚙️ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝙽𝙳𝙾 𝙰𝚁𝙲𝙷𝙸𝚅𝙾...\n${createProgressBar(80)}`,
      edit: loadingMsg.key,
    });

    // Descargar archivo
    const response = await axios({
      method: "GET",
      url: link,
      responseType: "stream",
      timeout: 60000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const chunks = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    fileBuffer = Buffer.concat(chunks);

    // Progreso final
    await conn.sendMessage(jid, {
      text: `✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n${createProgressBar(
        100
      )}\n\n⚙️ 𝙴𝚗𝚟𝚒𝚊𝚗𝚍𝚘 𝚊𝚛𝚌𝚑𝚒𝚟𝚘...`,
      edit: loadingMsg.key,
    });

    // Pequeña espera antes de enviar
    await new Promise((resolve) => setTimeout(resolve, 800));

    await conn.sendMessage(jid, {
      react: { text: "⬆️", key: m.key },
    });

    // Construir detalles para el caption
    const fileDetails =
      ` *「📁」 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝙰𝚁𝙲𝙷𝙸𝚅𝙾*\n\n` +
      `> ✦ *𝙽𝚘𝚖𝚋𝚛𝚎:* » ${fileName}\n` +
      `> ⴵ *𝚃𝚊𝚖𝚊𝚗̃𝚘:* » ${size}\n` +
      `> ✰ *𝙵𝚎𝚌𝚑𝚊:* » ${date}\n` +
      `> 📅 *𝚃𝚒𝚙𝚘:* » ${mime}`;

    // Enviar archivo CON los detalles en el caption
    await conn.sendMessage(jid, {
      document: fileBuffer,
      mimetype: mime,
      fileName: fileName,
      caption: fileDetails,
    });

    // Cambiar reacción a engranaje
    await conn.sendMessage(jid, {
      react: { text: "⚙️", key: m.key },
    });
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙼𝚎𝚍𝚒𝚊𝙵𝚒𝚛𝚎:", error);

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
  } finally {
    activeDownloads.delete(userNumber);
  }
};

handler.command = ["mediafire", "mf"];
handler.help = ["mediafire <url>"];
handler.tags = ["downloader"];

export default handler;
