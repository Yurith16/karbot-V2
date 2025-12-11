import axios from "axios";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = text || (m.quoted && m.quoted.text);

  if (!query) {
    await conn.sendMessage(m.chat, {
      react: {
        text: "❌",
        key: m.key,
      },
    });
    return conn.reply(
      m.chat,
      "❌ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝙿𝚁𝙴𝙶𝚄𝙽𝚃𝙰*\n\n▸ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘: ${usedPrefix}${command} ¿𝚀𝚞é 𝚎𝚜 𝚕𝚊 𝙸𝙰?",
      m
    );
  }

  try {
    await conn.sendMessage(m.chat, {
      react: {
        text: "⚙️",
        key: m.key,
      },
    });

    const { data } = await axios.request({
      method: "POST",
      url: "https://outerface.venice.ai/api/inference/chat",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: "https://venice.ai",
        referer: "https://venice.ai/",
        "user-agent":
          "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        "x-venice-version": "interface@20250523.214528+393d253",
      },
      data: JSON.stringify({
        requestId: "mifinfinity",
        modelId: "dolphin-3.0-mistral-24b",
        prompt: [{ content: query, role: "user" }],
        systemPrompt: "",
        conversationType: "text",
        temperature: 0.8,
        webEnabled: true,
        topP: 0.9,
        isCharacter: false,
        clientProcessingTime: 15,
      }),
    });

    const chunks = data
      .split("\n")
      .filter((chunk) => chunk.trim() !== "")
      .map((chunk) => JSON.parse(chunk));

    const result = chunks.map((chunk) => chunk.content).join("");

    if (!result) {
      throw new Error("𝙽𝚘 𝚑𝚞𝚋𝚘 𝚛𝚎𝚜𝚙𝚞𝚎𝚜𝚝𝚊");
    }

    // Dividir si es muy largo
    const maxLength = 3000;
    if (result.length > maxLength) {
      const parts = [];
      for (let i = 0; i < result.length; i += maxLength) {
        parts.push(result.substring(i, i + maxLength));
      }

      // Primera parte
      await conn.reply(
        m.chat,
        `🤖 *𝙸𝙽𝚃𝙴𝙻𝙸𝙶𝙴𝙽𝙲𝙸𝙰 𝙰𝚁𝚃𝙸𝙵𝙸𝙲𝙸𝙰𝙻:*\n\n${parts[0]}`,
        m
      );

      // Partes restantes
      for (let i = 1; i < parts.length; i++) {
        await conn.reply(m.chat, `${parts[i]}`, m);
      }
    } else {
      await conn.reply(m.chat, `🤖 *𝙸𝙽𝚃𝙴𝙻𝙸𝙶𝙴𝙽𝙲𝙸𝙰 𝙰𝚁𝚃𝙸𝙵𝙸𝙲𝙸𝙰𝙻:*\n\n${result}`, m);
    }

    await conn.sendMessage(m.chat, {
      react: {
        text: "✅",
        key: m.key,
      },
    });
  } catch (err) {
    console.error("Error IA:", err.message);

    await conn.sendMessage(m.chat, {
      react: {
        text: "❌",
        key: m.key,
      },
    });

    await conn.reply(
      m.chat,
      `❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ ${err.message || "𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚙𝚛𝚘𝚌𝚎𝚜𝚊𝚛 𝚕𝚊 𝚙𝚎𝚝𝚒𝚌𝚒ó𝚗"}`,
      m
    );
  }
};

handler.help = ["ia <pregunta>"];
handler.tags = ["ia"];
handler.command = ["ia", "ai", "inteligencia"];
handler.group = true;

export default handler;
