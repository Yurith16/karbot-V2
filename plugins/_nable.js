import fetch from "node-fetch";
import { saveDatabase } from "../lib/db.js";

let handler = async (m, { conn, usedPrefix, command, args }) => {
  const toNum = (jid = "") =>
    String(jid)
      .split("@")[0]
      .split(":")[0]
      .replace(/[^0-9]/g, "");
  const senderNum = toNum(m.sender);
  const botId = conn?.user?.id || "";
  const owners = Array.isArray(global.owner)
    ? global.owner.map((v) => (Array.isArray(v) ? v[0] : v))
    : [];
  const isROwner = [botId, ...owners].map((v) => toNum(v)).includes(senderNum);
  const isOwner = isROwner || !!m.fromMe;
  const isAdmin = !!m.isAdmin;
  let chat =
    global.db?.data?.chats?.[m.chat] || (global.db.data.chats[m.chat] = {});
  let settings = global.db?.data?.settings || (global.db.data.settings = {});
  let bot = settings[conn.user.jid] || (settings[conn.user.jid] = {});

  let fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo",
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${
          m.sender.split("@")[0]
        }:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  // URL actualizada con las que proporcionaste
  const imageUrl = "https://files.catbox.moe/bu3hd2.jpg";
  let imageBuffer = await fetch(imageUrl).then((res) => res.buffer());

  const listMessage = {
    image: imageBuffer,
    caption: `
╭━━━〔  ⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️  〕━━━⬣
║ 📌 𝚄𝚜𝚘 𝚍𝚎𝚕 𝚌𝚘𝚖𝚊𝚗𝚍𝚘
║ ⚙️ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘: .𝚘𝚗 𝚊𝚗𝚝𝚒𝚝𝚘𝚡𝚒𝚌
║ ⚙️ 𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚌𝚒ó𝚗: 𝙰𝚌𝚝𝚒𝚟𝚊/𝙳𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊 𝚏𝚞𝚗𝚌𝚒𝚘𝚗𝚎𝚜
║ 📚 𝙵𝚞𝚗𝚌𝚒𝚘𝚗𝚎𝚜 𝚍𝚒𝚜𝚙𝚘𝚗𝚒𝚋𝚕𝚎𝚜:
║ ⚙️ 𝚊𝚗𝚝𝚒𝚏𝚊𝚔𝚎 - 𝙰𝚗𝚝𝚒 𝚗ú𝚖𝚎𝚛𝚘𝚜 𝚏𝚊𝚕𝚜𝚘𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚋𝚘𝚝 - 𝙰𝚗𝚝𝚒 𝚋𝚘𝚝𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚜𝚞𝚋𝚋𝚘𝚝𝚜 - 𝙰𝚗𝚝𝚒 𝚜𝚞𝚋 𝚋𝚘𝚝𝚜
║ ⚙️ 𝚠𝚎𝚕𝚌𝚘𝚖𝚎 - 𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚒𝚍𝚊𝚜
║ ⚙️ 𝚙𝚞𝚋𝚕𝚒𝚌 - 𝙼𝚘𝚍𝚘 𝚙ú𝚋𝚕𝚒𝚌𝚘
║ ⚙️ 𝚌𝚑𝚊𝚝𝚋𝚘𝚝 - 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚊𝚞𝚝𝚘𝚖á𝚝𝚒𝚌𝚘
║ ⚙️ 𝚗𝚜𝚏𝚠 - 𝙲𝚘𝚗𝚝𝚎𝚗𝚒𝚍𝚘 𝙽𝚂𝙵𝚆
║ ⚙️ 𝚊𝚞𝚝𝚘𝚜𝚝𝚒𝚌𝚔𝚎𝚛 - 𝙰𝚞𝚝𝚘 𝚜𝚝𝚒𝚌𝚔𝚎𝚛𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚝𝚛𝚊𝚋𝚊 - 𝙰𝚗𝚝𝚒 𝚝𝚛𝚊𝚋𝚊𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚙𝚛𝚒𝚟𝚊𝚍𝚘 - 𝙰𝚗𝚝𝚒 𝚙𝚛𝚒𝚟𝚊𝚍𝚘
║ ⚙️ 𝚊𝚗𝚝𝚒𝚜𝚙𝚊𝚖 - 𝙰𝚗𝚝𝚒 𝚜𝚙𝚊𝚖
║ ⚙️ 𝚊𝚗𝚝𝚒𝚌𝚊𝚕𝚕 - 𝙰𝚗𝚝𝚒 𝚕𝚕𝚊𝚖𝚊𝚍𝚊𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚍𝚎𝚕𝚎𝚝𝚎 - 𝙰𝚗𝚝𝚒 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚛
║ ⚙️ 𝚊𝚞𝚝𝚘𝚕𝚎𝚟𝚎𝚕𝚞𝚙 - 𝙰𝚞𝚝𝚘 𝚗𝚒𝚟𝚎𝚕 𝚞𝚙
║ ⚙️ 𝚊𝚞𝚝𝚘𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎𝚛 - 𝙰𝚞𝚝𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎𝚛
║ ⚙️ 𝚊𝚞𝚝𝚘𝚊𝚌𝚎𝚙𝚝𝚊𝚛 - 𝙰𝚌𝚎𝚙𝚝𝚊𝚛 𝚊𝚞𝚝𝚘
║ ⚙️ 𝚊𝚞𝚝𝚘𝚛𝚎𝚌𝚑𝚊𝚣𝚊𝚛 - 𝚁𝚎𝚌𝚑𝚊𝚣𝚊𝚛 𝚊𝚞𝚝𝚘
║ ⚙️ 𝚍𝚎𝚝𝚎𝚌𝚝 - 𝙳𝚎𝚝𝚎𝚌𝚌𝚒ó𝚗
║ ⚙️ 𝚊𝚗𝚝𝚒𝚟𝚒𝚎𝚠𝚘𝚗𝚌𝚎 - 𝙰𝚗𝚝𝚒 𝚟𝚎𝚛 𝚞𝚗𝚊 𝚟𝚎𝚣
║ ⚙️ 𝚛𝚎𝚜𝚝𝚛𝚒𝚌𝚝 - 𝚁𝚎𝚜𝚝𝚛𝚒𝚗𝚐𝚒𝚛
║ ⚙️ 𝚊𝚞𝚝𝚘𝚛𝚎𝚊𝚍 - 𝙰𝚞𝚝𝚘 𝚕𝚎𝚎𝚛
║ ⚙️ 𝚊𝚗𝚝𝚒𝚜𝚝𝚒𝚌𝚔𝚎𝚛 - 𝙰𝚗𝚝𝚒 𝚜𝚝𝚒𝚌𝚔𝚎𝚛𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚛𝚊𝚒𝚍 - 𝙰𝚗𝚝𝚒 𝚛𝚊𝚒𝚍
║ ⚙️ 𝚖𝚘𝚍𝚘𝚊𝚍𝚖𝚒𝚗 - 𝚂𝚘𝚕𝚘 𝚊𝚍𝚖𝚒𝚗𝚜
║ ⚙️ 𝚛𝚎𝚊𝚌𝚝𝚒𝚘𝚗 - 𝚁𝚎𝚊𝚌𝚌𝚒𝚘𝚗𝚎𝚜
║ ⚙️ 𝚓𝚊𝚍𝚒𝚋𝚘𝚝𝚖𝚍 - 𝙼𝚘𝚍𝚘 𝚓𝚊𝚍𝚒𝚋𝚘𝚝
║ ⚙️ 𝚘𝚗𝚕𝚢𝚙𝚟 - 𝚂𝚘𝚕𝚘 𝙿𝚅
║ ⚙️ 𝚘𝚗𝚕𝚢𝚐𝚙 - 𝚂𝚘𝚕𝚘 𝚐𝚛𝚞𝚙𝚘𝚜
║ ⚙️ 𝚊𝚗𝚝𝚒𝚙𝚎𝚛𝚞 - 𝙰𝚗𝚝𝚒 𝙿𝚎𝚛ú
║ ⚙️ 𝚄𝚜𝚊: .𝚘𝚗/.𝚘𝚏𝚏 <𝚘𝚙𝚌𝚒ó𝚗>  •  .𝚖𝚎𝚗𝚞 𝚙𝚊𝚛𝚊 𝚖á𝚜
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
  };

  let isEnable = /true|enable|(turn)?on|1|activar|on/i.test(command);
  let type = (args[0] || "").toLowerCase();
  let isAll = false,
    isUser = false;

  if (!args[0])
    return conn.sendMessage(m.chat, listMessage, { quoted: fkontak });

  switch (type) {
    case "autotype":
    case "autotipo":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.autotypeDotOnly = isEnable;
      break;
    case "welcome":
    case "bienvenida":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.welcome = isEnable;
      break;
    case "bye":
    case "despedida":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.welcome = isEnable;
      break;
    case "antiprivado":
    case "antiprivate":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.antiPrivate = isEnable;
      break;
    case "antispam":
      isAll = true;
      if (!isOwner) {
        global.dfail("owner", m, conn);
        throw false;
      }
      bot.antiSpam = isEnable;
      break;
    case "restrict":
    case "restringir":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.restrict = isEnable;
      break;
    case "antibot":
    case "antibots":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiBot = isEnable;
      break;
    case "antisubbots":
    case "antibot2":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiBot2 = isEnable;
      break;
    case "antidelete":
    case "antieliminar":
    case "delete":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.delete = isEnable;
      break;
    case "autoaceptar":
    case "aceptarauto":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.autoAceptar = isEnable;
      break;
    case "autorechazar":
    case "rechazarauto":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.autoRechazar = isEnable;
      break;
    case "autoresponder":
    case "autorespond":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.autoresponder = isEnable;
      break;
    case "autolevelup":
    case "autonivel":
    case "nivelautomatico":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.autolevelup = isEnable;
      break;
    case "modoadmin":
    case "soloadmin":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.modoadmin = isEnable;
      break;
    case "reaction":
    case "reaccion":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.reaction = isEnable;
      break;
    case "nsfw":
    case "modohorny":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.nsfw = isEnable;
      break;
    case "antitoxic":
    case "antitoxicos":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antitoxic = isEnable;
      break;
    case "jadibotmd":
    case "modejadibot":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.jadibotmd = isEnable;
      break;
    case "detect":
    case "avisos":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      } else {
        if (!isOwner) {
          global.dfail("group", m, conn);
          throw false;
        }
      }
      chat.detect = isEnable;
      break;
    case "antifake":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antifake = isEnable;
      break;
    case "public":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.public = isEnable;
      break;
    case "chatbot":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.chatbot = isEnable;
      break;
    case "autosticker":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.autoSticker = isEnable;
      break;
    case "antitraba":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiTraba = isEnable;
      break;
    case "anticall":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.antiCall = isEnable;
      break;
    case "antiviewonce":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiviewonce = isEnable;
      break;
    case "autoread":
      isAll = true;
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      bot.autoread = isEnable;
      break;
    case "antisticker":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiSticker = isEnable;
      break;
    case "antiraid":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiRaid = isEnable;
      break;
    case "onlypv":
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      chat.onlyPv = isEnable;
      break;
    case "onlygp":
      if (!isOwner) {
        global.dfail("rowner", m, conn);
        throw false;
      }
      chat.onlyGp = isEnable;
      break;
    case "antiperu":
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail("admin", m, conn);
          throw false;
        }
      }
      chat.antiperu = isEnable;
      break;
    default:
      return conn.sendMessage(m.chat, listMessage, { quoted: fkontak });
  }

  try {
    await saveDatabase();
  } catch {}

  let txt = `
╭━━━〔 ⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️  〕━━━⬣
║ ⚙️ 𝙾𝙿𝙲𝙸Ó𝙽: ${type.toUpperCase()}
║ ⚙️ 𝙴𝚂𝚃𝙰𝙳𝙾: ${isEnable ? "🟢 𝙾𝙽" : "🔴 𝙾𝙵𝙵"}
║ ⚙️ 𝙰𝙿𝙻𝙸𝙲𝙰 𝙰: ${isAll ? "𝙴𝚂𝚃𝙴 𝙱𝙾𝚃" : isUser ? "𝚄𝚂𝚄𝙰𝚁𝙸𝙾" : "𝙴𝚂𝚃𝙴 𝙲𝙷𝙰𝚃"}
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;

  await conn.sendMessage(m.chat, { text: txt }, { quoted: fkontak });
};

handler.help = ["en", "dis"];
handler.tags = ["nable", "owner"];
handler.command = /^((en|dis)able|(tru|fals)e|(turn)?o(n|ff)|[01])$/i;

export default handler;
