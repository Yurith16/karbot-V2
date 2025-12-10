let handler = async (m, { conn, usedPrefix }) => {
  let chat = global.db.data.chats[m.chat];

  let info = `
╭─「 ⚙️  *𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙲𝙸Ó𝙽 𝙳𝙴𝙻 𝙶𝚁𝚄𝙿𝙾* ⚙️ 」
│
│ ⚙️  *𝚂𝙴𝙶𝚄𝚁𝙸𝙳𝙰𝙳:*
│ ├ 𝙰𝚗𝚝𝚒𝙻𝚒𝚗𝚔: ${chat.antiLink ? "🟢" : "🔴"}
│ ├ 𝙰𝚗𝚝𝚒𝙰𝚛𝚊𝚋𝚎: ${chat.antiArabe ? "🟢" : "🔴"}
│
│ ⚙️  *𝙱𝙸𝙴𝙽𝚅𝙴𝙽𝙸𝙳𝙰𝚂:*
│ ├ 𝚆𝚎𝚕𝚌𝚘𝚖𝚎: ${chat.welcome ? "🟢" : "🔴"}
│
│ ⚙️  *𝙾𝚃𝚁𝙰𝚂 𝙲𝙾𝙽𝙵𝙸𝙶𝚂:*
│ ├ 𝙽𝚂𝙵𝚆: ${chat.nsfw ? "🟢" : "🔴"}
│ ├ 𝙴𝚌𝚘𝚗𝚘𝚖𝚢: ${chat.economy ? "🟢" : "🔴"}
│ ├ 𝙶𝚊𝚌𝚑𝚊: ${chat.gacha ? "🟢" : "🔴"}
│
│ ${chat.rootowner ? "⚠️ *𝙽𝙾𝚃𝙰:* 𝙱𝚘𝚝 𝚜𝚘𝚕𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊𝚕 𝚌𝚛𝚎𝚊𝚍𝚘𝚛" : ""}
╰─◉`.trim();

  await m.reply(info);
};

handler.help = ["config", "settings", "configuracion"];
handler.tags = ["group"];
handler.command = /^(config|settings|configuracion)$/i;
handler.group = true;
export default handler;
