import axios from "axios";
import baileys from "@whiskeysockets/baileys";
import cheerio from "cheerio";

// Función para crear barra de progreso
function createProgressBar(percentage) {
  const totalBars = 20;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
  return `[${bar}] ${percentage}%`;
}

let handler = async (m, { conn, text, args, usedPrefix }) => {
  if (!text)
    return await conn.reply(
      m.chat,
      `⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰*\n\n▸ *𝙴𝚓𝚎𝚖𝚙𝚕𝚘:* ${usedPrefix}pinterest 𝚙𝚊𝚒𝚜𝚊𝚓𝚎𝚜 𝚍𝚎 𝚒𝚗𝚟𝚒𝚎𝚛𝚗𝚘`,
      m
    );

  try {
    // Reaccionar con lupa
    await conn.sendMessage(m.chat, {
      react: { text: "🔍", key: m.key },
    });

    if (text.includes("https://")) {
      let loadingMsg = await conn.sendMessage(
        m.chat,
        {
          text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝙴𝙽𝙻𝙰𝙲𝙴...\n${createProgressBar(30)}`,
        },
        { quoted: m }
      );

      let i = await dl(args[0]);
      let isVideo = i.download.includes(".mp4");

      await conn.sendMessage(m.chat, {
        text: `✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n${createProgressBar(100)}`,
        edit: loadingMsg.key,
      });

      await conn.sendMessage(m.chat, {
        react: { text: "⚙️", key: m.key },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await conn.sendMessage(
        m.chat,
        { [isVideo ? "video" : "image"]: { url: i.download } },
        { quoted: m }
      );
    } else {
      let loadingMsg = await conn.sendMessage(
        m.chat,
        {
          text: `⚙️ 𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾 𝙴𝙽 𝙿𝙸𝙽𝚃𝙴𝚁𝙴𝚂𝚃...\n${createProgressBar(20)}`,
        },
        { quoted: m }
      );

      const results = await pins(text);

      await conn.sendMessage(m.chat, {
        text: `⚙️ 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂...\n${createProgressBar(60)}`,
        edit: loadingMsg.key,
      });

      if (!results.length) {
        await conn.sendMessage(m.chat, {
          react: { text: "❌", key: m.key },
        });

        await conn.sendMessage(m.chat, {
          text: `❌ 𝙽𝙾 𝙷𝙰𝚈 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂`,
          edit: loadingMsg.key,
        });
        return;
      }

      // Tomar las primeras 5 imágenes
      const selectedImages = results.slice(0, 5);

      await conn.sendMessage(m.chat, {
        text: `⚙️ 𝙴𝙽𝚅𝙸𝙰𝙽𝙳𝙾 𝙸𝙼𝙰́𝙶𝙴𝙽𝙴𝚂...\n${createProgressBar(90)}`,
        edit: loadingMsg.key,
      });

      // Cambiar reacción a descarga
      await conn.sendMessage(m.chat, {
        react: { text: "📸", key: m.key },
      });

      // Enviar cada imagen con delay de 1 segundo
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];

        try {
          await conn.sendMessage(
            m.chat,
            {
              image: { url: image.image_large_url },
            },
            { quoted: i === 0 ? m : null }
          ); // Solo el primer mensaje es quoted

          // Esperar 1 segundo entre imágenes
          if (i < selectedImages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log(`𝙸𝚖𝚊𝚐𝚎𝚗 ${i + 1} 𝚏𝚊𝚕𝚕𝚘́, 𝚒𝚗𝚝𝚎𝚗𝚝𝚊𝚗𝚍𝚘 𝚜𝚒𝚐𝚞𝚒𝚎𝚗𝚝𝚎...`);
          // Continuar con la siguiente imagen si falla
          continue;
        }
      }

      // Progreso final
      await conn.sendMessage(m.chat, {
        text: `✅ 𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n${createProgressBar(
          100
        )}\n\n⚙️ 𝚂𝚎 𝚎𝚗𝚟𝚒𝚊𝚛𝚘𝚗 ${selectedImages.length} 𝚒𝚖𝚊́𝚐𝚎𝚗𝚎𝚜`,
        edit: loadingMsg.key,
      });

      // Cambiar reacción a engranaje
      await conn.sendMessage(m.chat, {
        react: { text: "⚙️", key: m.key },
      });
    }
  } catch (e) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙿𝚒𝚗𝚝𝚎𝚛𝚎𝚜𝚝:", e);

    await conn.sendMessage(m.chat, {
      react: { text: "❌", key: m.key },
    });

    await conn.reply(m.chat, `❌ 𝙷𝚄𝙱𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
  }
};

handler.help = ["pinterest"];
handler.command = ["pinterest", "pin"];
handler.tags = ["descargas"];

export default handler;

async function getPinInfo(imageData) {
  try {
    if (imageData.pinner) {
      return {
        user: `*${imageData.pinner.full_name || imageData.pinner.username}* (${
          imageData.pinner.username || "N/A"
        })`,
        title: `*${imageData.title || imageData.grid_title || "Sin título"}*`,
        board: `*${imageData.board?.name || "Tablero no disponible"}*`,
        link: imageData.url || `https://pinterest.com/pin/${imageData.id}/`,
      };
    }

    return {
      user: "*Información no disponible*",
      title: "*Sin título*",
      board: "*Tablero no disponible*",
      link: "#",
    };
  } catch (error) {
    return {
      user: "*Información no disponible*",
      title: "*Sin título*",
      board: "*Tablero no disponible*",
      link: "#",
    };
  }
}

async function dl(url) {
  try {
    let res = await axios
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } })
      .catch((e) => e.response);
    let $ = cheerio.load(res.data);
    let tag = $('script[data-test-id="video-snippet"]');
    if (tag.length) {
      let result = JSON.parse(tag.text());
      return {
        title: result.name,
        download: result.contentUrl,
      };
    } else {
      let json = JSON.parse(
        $("script[data-relay-response='true']").eq(0).text()
      );
      let result = json.response.data["v3GetPinQuery"].data;
      return {
        title: result.title,
        download: result.imageLargeUrl,
      };
    }
  } catch {
    return { msg: "Error, inténtalo de nuevo más tarde" };
  }
}

const pins = async (judul) => {
  const link = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(
    judul
  )}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A%22control%22%2C%22filters%22%3Anull%2C%22journey_depth%22%3Anull%2C%22page_size%22%3Anull%2C%22price_max%22%3Anull%2C%22price_min%22%3Anull%2C%22query_pin_sigs%22%3Anull%2C%22query%22%3A%22${encodeURIComponent(
    judul
  )}%22%2C%22redux_normalize_feed%22%3Atrue%2C%22request_params%22%3Anull%2C%22rs%22%3A%22typed%22%2C%22scope%22%3A%22pins%22%2C%22selected_one_bar_modules%22%3Anull%2C%22seoDrawerEnabled%22%3Afalse%2C%22source_id%22%3Anull%2C%22source_module_id%22%3Anull%2C%22source_url%22%3A%22%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(
    judul
  )}%26rs%3Dtyped%22%2C%22top_pin_id%22%3Anull%2C%22top_pin_ids%22%3Anull%7D%2C%22context%22%3A%7B%7D%7D`;

  const headers = {
    accept: "application/json, text/javascript, */*; q=0.01",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    priority: "u=1, i",
    referer: "https://id.pinterest.com/",
    "screen-dpr": "1",
    "sec-ch-ua":
      '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133")',
    "sec-ch-ua-full-version-list":
      '"Not(A:Brand";v="99.0.0.0", "Google Chrome";v="133.0.6943.142", "Chromium";v="133.0.6943.142")',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-platform-version": '"10.0.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "x-app-version": "c056fb7",
    "x-pinterest-appstate": "active",
    "x-pinterest-pws-handler": "www/index.js",
    "x-pinterest-source-url": "/",
    "x-requested-with": "XMLHttpRequest",
  };

  try {
    const res = await axios.get(link, { headers });
    if (
      res.data &&
      res.data.resource_response &&
      res.data.resource_response.data &&
      res.data.resource_response.data.results
    ) {
      return res.data.resource_response.data.results
        .map((item) => {
          if (item.images) {
            return {
              image_large_url: item.images.orig?.url || null,
              image_medium_url: item.images["564x"]?.url || null,
              image_small_url: item.images["236x"]?.url || null,
              pinner: item.pinner,
              title: item.title,
              board: item.board,
              id: item.id,
              url: item.url,
            };
          }
          return null;
        })
        .filter((img) => img !== null);
    }
    return [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};
