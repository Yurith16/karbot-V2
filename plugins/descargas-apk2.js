import { search, download } from "aptoide-scraper";
import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `𝚄𝚜𝚘: ${usedPrefix + command} 𝚗𝚘𝚖𝚋𝚛𝚎 𝚊𝚙𝚙`, m);
  }

  try {
    // 1. Enviar imagen de la app primero
    let searchA = await search(text);
    if (!searchA.length) {
      return conn.reply(m.chat, "❌ 𝙽𝚘 𝚜𝚎 𝚎𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚛𝚘𝚗 𝚊𝚙𝚙𝚜", m);
    }

    let data5 = await download(searchA[0].id);

    // Información de la app
    const appInfo =
      `📱 *${data5.name}*\n` +
      `📦 *𝙿𝚊𝚚𝚞𝚎𝚝𝚎:* ${data5.package}\n` +
      `📅 *𝚄́𝚕𝚝𝚒𝚖𝚊 𝚊𝚌𝚝𝚞𝚊𝚕𝚒𝚣𝚊𝚌𝚒ó𝚗:* ${data5.lastup}\n` +
      `💾 *𝚃𝚊𝚖𝚊ñ𝚘:* ${data5.size}\n` +
      `⬇️ *𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚗𝚍𝚘 𝙰𝙿𝙺...*\n` +
      `\n⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️`;

    // Enviar imagen de la app
    await conn.sendMessage(
      m.chat,
      {
        image: { url: data5.icon },
        caption: appInfo,
      },
      { quoted: m }
    );

    // Esperar 1.5 segundos
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Verificar tamaño del APK
    if (
      data5.size.includes("GB") ||
      parseFloat(data5.size.replace(" MB", "").replace("MB", "").trim()) > 999
    ) {
      return conn.reply(
        m.chat,
        `⚠️ *𝙰𝙿𝙺 𝚍𝚎𝚖𝚊𝚜𝚒𝚊𝚍𝚘 𝚐𝚛𝚊𝚗𝚍𝚎*\n\n` +
          `𝙻𝚊 𝚊𝚙𝚙 𝚙𝚎𝚜𝚊 ${data5.size} 𝚢 𝚗𝚘 𝚙𝚞𝚎𝚍𝚎 𝚜𝚎𝚛 𝚎𝚗𝚟𝚒𝚊𝚍𝚊.\n` +
          `𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊 𝚖𝚊𝚗𝚞𝚊𝚕 𝚍𝚎𝚜𝚍𝚎: ${data5.dllink}`,
        m
      );
    }

    // 3. Enviar mensaje de barra de carga (SOLO 1 VEZ)
    let loadingMsg = await conn.reply(
      m.chat,
      "⚙️ 𝙸𝙽𝙸𝙲𝙸𝙰𝙽𝙳𝙾 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰...\n[░░░░░░░░░░░░░░░░░░░░] 0%",
      m
    );

    // ESPERAR antes de comenzar el progreso
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. Progreso más lento y con MENOS actualizaciones
    const progressSteps = [
      { percent: 10, text: "𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙽𝙳𝙾..." },
      { percent: 25, text: "𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾..." },
      { percent: 40, text: "𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝙽𝙳𝙾..." },
      { percent: 60, text: "𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾..." },
      { percent: 80, text: "𝙵𝙸𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾..." },
      { percent: 100, text: "𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰𝙳𝙾" },
    ];

    for (let step of progressSteps) {
      const { percent, text } = step;
      const totalBars = 20;
      const filledBars = Math.round((percent / 100) * totalBars);
      const emptyBars = totalBars - filledBars;
      const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);

      try {
        await conn.sendMessage(m.chat, {
          text: `⚙️ ${text}\n[${bar}] ${percent}%`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        console.log("Error editando mensaje:", e.message);
        // Si hay error, continuar sin editar más
        break;
      }

      // ESPERAR MÁS ENTRE ACTUALIZACIONES (1 segundo mínimo)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // 5. Descargar realmente el APK
    const response = await fetch(data5.dllink);
    if (!response.ok) throw new Error("Error al descargar APK");
    const apkBuffer = Buffer.from(await response.arrayBuffer());

    // 6. Mostrar mensaje final (solo si no hubo errores)
    try {
      await conn.sendMessage(m.chat, {
        text: "✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n𝙴𝚗𝚟𝚒𝚊𝚗𝚍𝚘 𝙰𝙿𝙺...",
        edit: loadingMsg.key,
      });
    } catch (e) {
      // Si falla la edición, no importa
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 7. Enviar APK SIN CAPTION
    await conn.sendMessage(
      m.chat,
      {
        document: apkBuffer,
        mimetype: "application/vnd.android.package-archive",
        fileName: `${data5.name.replace(/[\\/:*?"<>|]/g, "_")}.apk`,
        // SIN CAPTION
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙰𝙿𝚃𝙾𝙸𝙳𝙴:", error.message);

    // Mostrar error simple
    await conn.reply(m.chat, `❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`, m);
  }
};

handler.tags = ["downloader"];
handler.help = ["modapk2", "apk2"];
handler.command = ["modapk2", "apk2"];
handler.group = true;

export default handler;
