import fetch from "node-fetch";

let handler = async (m, { conn, usedPrefix, command, args }) => {
  try {
    if (!args[0]) {
      return conn.reply(m.chat, `𝚄𝚜𝚘: ${usedPrefix + command} 𝚗𝚘𝚖𝚋𝚛𝚎 𝚊𝚙𝚙`, m);
    }

    const appName = args.join(" ").toLowerCase();

    // Mensaje inicial con barra de carga
    let loadingMsg = await conn.sendMessage(
      m.chat,
      {
        text: `⚙️ 𝙸𝙽𝙸𝙲𝙸𝙰𝙽𝙳𝙾...\n[░░░░░░░░░░░░░░░░░░░░] 0%`,
      },
      { quoted: m }
    );

    // ESPERAR antes de comenzar el progreso
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Progreso más lento y con MENOS actualizaciones
    const progressSteps = [
      { percent: 10, text: "𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙽𝙳𝙾..." },
      { percent: 25, text: "𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾..." },
      { percent: 40, text: "𝙰𝙽𝙰𝙻𝙸𝚉𝙰𝙽𝙳𝙾..." },
      { percent: 60, text: "𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝙽𝙳𝙾..." },
      { percent: 80, text: "𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝙽𝙳𝙾..." },
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

      // ESPERAR MÁS ENTRE ACTUALIZACIONES
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Realizar la búsqueda después de mostrar progreso
    const apiUrl = `https://mayapi.ooguy.com/apk?query=${encodeURIComponent(
      appName
    )}&apikey=may-f53d1d49`;
    const response = await fetch(apiUrl, { timeout: 30000 });

    if (!response.ok) throw new Error(`𝙴𝚛𝚛𝚘𝚛: ${response.status}`);

    const data = await response.json();

    if (!data.status || !data.result) throw new Error("𝙽𝚘 𝚜𝚎 𝚎𝚗𝚌𝚘𝚗𝚝𝚛ó 𝚕𝚊 𝚊𝚙𝚙");

    const appData = data.result;
    const downloadUrl = appData.url;
    const appTitle = appData.title || appName;

    if (!downloadUrl) throw new Error("𝙽𝚘 𝚑𝚊𝚢 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊");

    // Mostrar mensaje final como en apk2.js
    try {
      await conn.sendMessage(m.chat, {
        text: "✅ 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰\n𝙴𝚗𝚟𝚒𝚊𝚗𝚍𝚘 𝙰𝙿𝙺...",
        edit: loadingMsg.key,
      });
    } catch (e) {
      // Si falla, no importa
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Enviar el archivo APK SIN CAPTION
    await conn.sendMessage(
      m.chat,
      {
        document: { url: downloadUrl },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${appTitle.replace(/\s+/g, "_")}.apk`,
        // SIN CAPTION
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("𝙴𝚛𝚛𝚘𝚛 𝙰𝙿𝙺:", error);

    // Mostrar error en el mensaje de carga
    if (loadingMsg) {
      try {
        await conn.sendMessage(m.chat, {
          text: `❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`,
          edit: loadingMsg.key,
        });
      } catch (e) {
        await conn.reply(m.chat, `❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`, m);
      }
    } else {
      await conn.reply(m.chat, `❌ 𝙴𝚛𝚛𝚘𝚛: ${error.message}`, m);
    }
  }
};

handler.help = ["apk"];
handler.tags = ["downloader"];
handler.command = ["apk", "apkdl", "descargarapk"];
handler.register = false;

export default handler;
