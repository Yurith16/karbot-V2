import { smsg } from "./lib/simple.js";
import { format } from "util";
import { fileURLToPath } from "url";
import path, { join } from "path";
import fs, { unwatchFile, watchFile } from "fs";
import chalk from "chalk";
import fetch from "node-fetch";
import ws from "ws";

const { proto } = (await import("@whiskeysockets/baileys")).default;
const isNumber = (x) => typeof x === "number" && !isNaN(x);
const delay = (ms) =>
  isNumber(ms) &&
  new Promise((resolve) =>
    setTimeout(function () {
      clearTimeout(this);
      resolve();
    }, ms)
  );

const globalPrefixes = [
  ".",
  ",",
  "!",
  "#",
  "$",
  "%",
  "&",
  "*",
  "-",
  "_",
  "+",
  "=",
  "|",
  "\\",
  "/",
  "~",
  ">",
  "<",
  "^",
  "?",
  ":",
  ";",
];

const detectPrefix = (text, customPrefix = null) => {
  if (!text || typeof text !== "string") return null;

  if (customPrefix) {
    if (Array.isArray(customPrefix)) {
      for (const prefix of customPrefix) {
        if (text.startsWith(prefix)) {
          return {
            match: prefix,
            prefix: prefix,
            type: "custom",
          };
        }
      }
    } else if (
      typeof customPrefix === "string" &&
      text.startsWith(customPrefix)
    ) {
      return {
        match: customPrefix,
        prefix: customPrefix,
        type: "custom",
      };
    }
  }

  for (const prefix of globalPrefixes) {
    if (text.startsWith(prefix)) {
      return {
        match: prefix,
        prefix: prefix,
        type: "global",
      };
    }
  }

  return null;
};

const paisesCodigos = {
  arabia: ["+966", "966"],
  emiratos: ["+971", "971"],
  qatar: ["+974", "974"],
  kuwait: ["+965", "965"],
  bahrein: ["+973", "973"],
  oman: ["+968", "968"],
  egipto: ["+20", "20"],
  jordania: ["+962", "962"],
  siria: ["+963", "963"],
  irak: ["+964", "964"],
  yemen: ["+967", "967"],
  palestina: ["+970", "970"],
  libano: ["+961", "961"],
  india: ["+91", "91"],
  pakistan: ["+92", "92"],
  bangladesh: ["+880", "880"],
  afganistan: ["+93", "93"],
  nepal: ["+977", "977"],
  "sri-lanka": ["+94", "94"],
  nigeria: ["+234", "234"],
  ghana: ["+233", "233"],
  kenia: ["+254", "254"],
  etiopia: ["+251", "251"],
  sudafrica: ["+27", "27"],
  senegal: ["+221", "221"],
  china: ["+86", "86"],
  indonesia: ["+62", "62"],
  filipinas: ["+63", "63"],
  vietnam: ["+84", "84"],
  tailandia: ["+66", "66"],
  rusia: ["+7", "7"],
  ucrania: ["+380", "380"],
  rumania: ["+40", "40"],
  polonia: ["+48", "48"],
  brasil: ["+55", "55"],
};

function detectCountryByNumber(number) {
  const numStr = number.toString();
  for (const [country, codes] of Object.entries(paisesCodigos)) {
    for (const code of codes) {
      if (numStr.startsWith(code.replace("+", ""))) {
        return country;
      }
    }
  }
  return "local";
}

function getCountryName(code) {
  const countryNames = {
    arabia: "𝙰𝚛𝚊𝚋𝚒𝚊 𝚂𝚊𝚞𝚍𝚒𝚝𝚊 🇸🇦",
    emiratos: "𝙴𝚖𝚒𝚛𝚊𝚝𝚘𝚜 𝙰𝚛𝚊́𝚋𝚎𝚜 🇦🇪",
    qatar: "𝚀𝚊𝚝𝚊𝚛 🇶🇦",
    kuwait: "𝙺𝚞𝚠𝚊𝚒𝚝 🇰🇼",
    bahrein: "𝙱𝚊𝚑𝚛𝚎́𝚒𝚗 🇧🇭",
    oman: "𝙾𝚖𝚊́𝚗 🇴🇲",
    egipto: "𝙴𝚐𝚒𝚙𝚝𝚘 🇪🇬",
    jordania: "𝙹𝚘𝚛𝚍𝚊𝚗𝚒𝚊 🇯🇴",
    siria: "𝚂𝚒𝚛𝚒𝚊 🇸🇾",
    irak: "𝙸𝚛𝚊𝚔 🇮🇶",
    yemen: "𝚈𝚎𝚖𝚎𝚗 🇾🇪",
    palestina: "𝙿𝚊𝚕𝚎𝚜𝚝𝚒𝚗𝚊 🇵🇸",
    libano: "𝙻𝚒́𝚋𝚊𝚗𝚘 🇱🇧",
    india: "𝙸𝚗𝚍𝚒𝚊 🇮🇳",
    pakistan: "𝙿𝚊𝚔𝚒𝚜𝚝𝚊́𝚗 🇵🇰",
    bangladesh: "𝙱𝚊𝚗𝚐𝚕𝚊𝚍𝚎𝚜𝚑 🇧🇩",
    afganistan: "𝙰𝚏𝚐𝚊𝚗𝚒𝚜𝚝𝚊́𝚗 🇦🇫",
    nepal: "𝙽𝚎𝚙𝚊𝚕 🇳🇵",
    "sri-lanka": "𝚂𝚛𝚒 𝙻𝚊𝚗𝚔𝚊 🇱🇰",
    nigeria: "𝙽𝚒𝚐𝚎𝚛𝚒𝚊 🇳🇬",
    ghana: "𝙶𝚑𝚊𝚗𝚊 🇬🇭",
    kenia: "𝙺𝚎𝚗𝚒𝚊 🇰🇪",
    etiopia: "𝙴𝚝𝚒𝚘𝚙𝚒́𝚊 🇪🇹",
    sudafrica: "𝚂𝚞𝚍𝚊́𝚏𝚛𝚒𝚌𝚊 🇿🇦",
    senegal: "𝚂𝚎𝚗𝚎𝚐𝚊𝚕 🇸🇳",
    china: "𝙲𝚑𝚒𝚗𝚊 🇨🇳",
    indonesia: "𝙸𝚗𝚍𝚘𝚗𝚎𝚜𝚒𝚊 🇮🇩",
    filipinas: "𝙵𝚒𝚕𝚒𝚙𝚒𝚗𝚊𝚜 🇵🇭",
    vietnam: "𝚅𝚒𝚎𝚝𝚗𝚊𝚖 🇻🇳",
    tailandia: "𝚃𝚊𝚒𝚕𝚊𝚗𝚍𝚒𝚊 🇹🇭",
    rusia: "𝚁𝚞𝚜𝚒𝚊 🇷🇺",
    ucrania: "𝚄𝚌𝚛𝚊𝚗𝚒𝚊 🇺🇦",
    rumania: "𝚁𝚞𝚖𝚊𝚗𝚒𝚊 🇷🇴",
    polonia: "𝙿𝚘𝚕𝚘𝚗𝚒𝚊 🇵🇱",
    brasil: "𝙱𝚛𝚊𝚜𝚒𝚕 🇧🇷",
    local: "𝙻𝚘𝚌𝚊𝚕 🌍",
  };
  return countryNames[code] || code;
}

async function isUserAdmin(conn, groupJid, userJid) {
  try {
    const metadata = await conn.groupMetadata(groupJid);
    const participant = metadata.participants.find((p) => p.id === userJid);
    return (
      participant &&
      (participant.admin === "admin" || participant.admin === "superadmin")
    );
  } catch (error) {
    return false;
  }
}

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || [];
  this.uptime = this.uptime || Date.now();
  if (!chatUpdate) return;
  this.pushMessage(chatUpdate.messages).catch(console.error);
  let m = chatUpdate.messages[chatUpdate.messages.length - 1];
  if (!m) return;
  if (global.db.data == null) await global.loadDatabase();

  if (m.key && m.key.fromMe) return;

  try {
    m = smsg(this, m) || m;
    if (!m) return;
    m.exp = 0;
    try {
      let user = global.db.data.users[m.sender];
      if (typeof user !== "object") global.db.data.users[m.sender] = {};
      if (user) {
        if (!("name" in user)) user.name = m.name;
        if (!("exp" in user) || !isNumber(user.exp)) user.exp = 0;
        if (!("coin" in user) || !isNumber(user.coin)) user.coin = 0;
        if (!("bank" in user) || !isNumber(user.bank)) user.bank = 0;
        if (!("level" in user) || !isNumber(user.level)) user.level = 0;
        if (!("health" in user) || !isNumber(user.health)) user.health = 100;
        if (!("genre" in user)) user.genre = "";
        if (!("birth" in user)) user.birth = "";
        if (!("marry" in user)) user.marry = "";
        if (!("description" in user)) user.description = "";
        if (!("packstickers" in user)) user.packstickers = null;
        if (!("premium" in user)) user.premium = false;
        if (!("premiumTime" in user)) user.premiumTime = 0;
        if (!("banned" in user)) user.banned = false;
        if (!("bannedReason" in user)) user.bannedReason = "";
        if (!("commands" in user) || !isNumber(user.commands))
          user.commands = 0;
        if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1;
        if (!("afkReason" in user)) user.afkReason = "";
        if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0;
      } else
        global.db.data.users[m.sender] = {
          name: m.name,
          exp: 0,
          coin: 0,
          bank: 0,
          level: 0,
          health: 100,
          genre: "",
          birth: "",
          marry: "",
          description: "",
          packstickers: null,
          premium: false,
          premiumTime: 0,
          banned: false,
          bannedReason: "",
          commands: 0,
          afk: -1,
          afkReason: "",
          warn: 0,
        };
      let chat = global.db.data.chats[m.chat];
      if (typeof chat !== "object") global.db.data.chats[m.chat] = {};
      if (chat) {
        if (!("isBanned" in chat)) chat.isBanned = false;
        if (!("isMute" in chat)) chat.isMute = false;
        if (!("welcome" in chat)) chat.welcome = false;
        if (!("sWelcome" in chat)) chat.sWelcome = "";
        if (!("sBye" in chat)) chat.sBye = "";
        if (!("detect" in chat)) chat.detect = true;
        if (!("modoadmin" in chat)) chat.modoadmin = false;
        if (!("antiLink" in chat)) chat.antiLink = true;
        if (!("nsfw" in chat)) chat.nsfw = false;
        if (!("economy" in chat)) chat.economy = true;
        if (!("gacha" in chat)) chat.gacha = true;

        if (!("antiArabe" in chat)) chat.antiArabe = true;
        if (!("antiExtranjero" in chat)) chat.antiExtranjero = false;
        if (!("paisesBloqueados" in chat)) chat.paisesBloqueados = [];
        if (!("rootowner" in chat)) chat.rootowner = false;
        if (!("adminmode" in chat)) chat.adminmode = false;
        if (!("prefix" in chat)) chat.prefix = null;
        if (!("prefixes" in chat)) chat.prefixes = [];
      } else
        global.db.data.chats[m.chat] = {
          isBanned: false,
          isMute: false,
          welcome: false,
          sWelcome: "",
          sBye: "",
          detect: true,
          modoadmin: false,
          antiLink: true,
          nsfw: false,
          economy: true,
          gacha: true,

          antiArabe: true,
          antiExtranjero: false,
          paisesBloqueados: [],
          rootowner: false,
          adminmode: false,
          prefix: null,
          prefixes: [],
        };
      let settings = global.db.data.settings[this.user.jid];
      if (typeof settings !== "object")
        global.db.data.settings[this.user.jid] = {};
      if (settings) {
        if (!("self" in settings)) settings.self = false;
        if (!("jadibotmd" in settings)) settings.jadibotmd = true;
      } else
        global.db.data.settings[this.user.jid] = {
          self: false,
          jadibotmd: true,
        };
    } catch (e) {
      console.error(e);
    }
    if (typeof m.text !== "string") m.text = "";
    const user = global.db.data.users[m.sender];
    try {
      const actual = user.name || "";
      const nuevo = m.pushName || (await this.getName(m.sender));
      if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
        user.name = nuevo;
      }
    } catch {}
    const chat = global.db.data.chats[m.chat];
    const settings = global.db.data.settings[this.user.jid];
    const isROwner = [...global.owner.map(([number]) => number)]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(m.sender);
    const isOwner = isROwner || m.fromMe;

    if (chat?.rootowner && !isROwner) {
      return;
    }

    const isPrems =
      isROwner ||
      global.prems
        .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
        .includes(m.sender) ||
      user.premium == true;
    const isOwners = [
      this.user.jid,
      ...global.owner.map((number) => number + "@s.whatsapp.net"),
    ].includes(m.sender);
    if (opts["queque"] && m.text && !isPrems) {
      const queque = this.msgqueque,
        time = 1000 * 5;
      const previousID = queque[queque.length - 1];
      queque.push(m.id || m.key.id);
      setInterval(async function () {
        if (queque.indexOf(previousID) === -1) clearInterval(this);
        await delay(time);
      }, time);
    }

    if (m.isBaileys) return;
    m.exp += Math.ceil(Math.random() * 10);

    if (
      m.message &&
      m.key &&
      m.key.participant &&
      m.key.participant === this.user.jid
    )
      return;
    if (
      m.message &&
      m.key &&
      m.key.remoteJid &&
      m.key.remoteJid === this.user.jid
    )
      return;

    try {
      if (m.message && m.key.remoteJid.endsWith("@g.us")) {
        const text = m.text || "";
        const sender = m.sender;
        const userNumber = sender.split("@")[0];

        const userCountry = detectCountryByNumber(userNumber);
        const countryName = getCountryName(userCountry);

        if (chat.antiArabe) {
          const paisesArabes = [
            "+966",
            "966",
            "+971",
            "971",
            "+974",
            "974",
            "+965",
            "965",
            "+973",
            "973",
            "+968",
            "968",
            "+20",
            "20",
            "+962",
            "962",
            "+963",
            "963",
            "+964",
            "964",
            "+967",
            "967",
            "+970",
            "970",
            "+961",
            "961",
            "+218",
            "218",
            "+212",
            "212",
            "+216",
            "216",
            "+213",
            "213",
            "+222",
            "222",
            "+253",
            "253",
            "+252",
            "252",
            "+249",
            "249",
          ];

          const esArabe = paisesArabes.some((code) =>
            userNumber.startsWith(code.replace("+", ""))
          );

          if (esArabe) {
            const isUserAdm = await isUserAdmin(this, m.chat, sender);
            if (!isUserAdm) {
              await this.groupParticipantsUpdate(m.chat, [sender], "remove");

              await this.sendMessage(m.chat, {
                text: `╭─「 🚫 *𝙰𝙽𝚃𝙸-𝙰𝚁𝙰𝙱𝙴 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾* 🚫 」
│ 
│ *ⓘ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 𝚊́𝚛𝚊𝚋𝚎 𝚍𝚎𝚝𝚎𝚌𝚝𝚊𝚍𝚘 𝚢 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘*
│ 
│ 📋 *𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚌𝚒𝚘́𝚗:*
│ ├ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘: *𝙰𝚛𝚊𝚋𝚎*
│ ├ 𝙿𝚊𝚒́𝚜: 𝙽𝚞́𝚖𝚎𝚛𝚘 𝚊́𝚛𝚊𝚋𝚎 𝚍𝚎𝚝𝚎𝚌𝚝𝚊𝚍𝚘
│ ├ 𝚁𝚊𝚣𝚘́𝚗: 𝙰𝚗𝚝𝚒-𝙰𝚛𝚊𝚋𝚎 𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘
│ ├ 𝙰𝚌𝚌𝚒𝚘́𝚗: 𝙴𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘
│ └ 𝙼𝚎𝚗𝚜𝚊𝚓𝚎: 𝙴𝚕𝚒𝚖𝚒𝚗𝚊𝚍𝚘
│ 
│ 🌍 *𝙿𝚊𝚒́𝚜𝚎𝚜 𝚋𝚕𝚘𝚚𝚞𝚎𝚊𝚍𝚘𝚜:*
│ ├ 𝙰𝚛𝚊𝚋𝚒𝚊 𝚂𝚊𝚞𝚍𝚒𝚝𝚊, 𝙴𝚖𝚒𝚛𝚊𝚝𝚘𝚜, 𝚀𝚊𝚝𝚊𝚛
│ ├ 𝙺𝚞𝚠𝚊𝚒𝚝, 𝙱𝚊𝚑𝚛𝚎́𝚒𝚗, 𝙾𝚖𝚊́𝚗, 𝙴𝚐𝚒𝚙𝚝𝚘
│ ├ 𝙹𝚘𝚛𝚍𝚊𝚗𝚒𝚊, 𝚂𝚒𝚛𝚒𝚊, 𝙸𝚛𝚊𝚔, 𝚈𝚎𝚖𝚎𝚗
│ ├ 𝙿𝚊𝚕𝚎𝚜𝚝𝚒𝚗𝚊, 𝙻𝚒́𝚋𝚊𝚗𝚘 𝚢 +10 𝚖𝚊́𝚜
│ 
│ 💡 *𝙿𝚊𝚛𝚊 𝚍𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊𝚛:*
│ └ 𝚄𝚜𝚎 𝚎𝚕 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 .𝚊𝚗𝚝𝚒𝚊𝚛𝚊𝚋𝚎 𝚘𝚏𝚏
╰─◉`.trim(),
                mentions: [sender],
              });
              return;
            }
          }
        }

        if (
          chat.antiExtranjero ||
          (chat.paisesBloqueados && chat.paisesBloqueados.length > 0)
        ) {
          const paisBloqueado = chat.paisesBloqueados.includes(userCountry);

          if (chat.antiExtranjero && userCountry !== "local") {
            const isUserAdm = await isUserAdmin(this, m.chat, sender);
            if (!isUserAdm) {
              await this.groupParticipantsUpdate(m.chat, [sender], "remove");

              await this.sendMessage(m.chat, {
                text: `╭─「 🚫 *𝙰𝙽𝚃𝙸-𝙴𝚇𝚃𝚁𝙰𝙽𝙹𝙴𝚁𝙾 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾* 🚫 」
│ 
│ *ⓘ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 𝚎𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘 𝚍𝚎𝚝𝚎𝚌𝚝𝚊𝚍𝚘 𝚢 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘*
│ 
│ 📋 *𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚌𝚒𝚘́𝚗:*
│ ├ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘: 𝙴𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘
│ ├ 𝙿𝚊𝚒́𝚜: ${countryName}
│ ├ 𝚁𝚊𝚣𝚘́𝚗: 𝙰𝚗𝚝𝚒-𝙴𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘 𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘
│ ├ 𝙰𝚌𝚌𝚒𝚘́𝚗: 𝙴𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘
│ 
│ 🌍 *𝙲𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊𝚌𝚒𝚘́𝚗 𝚊𝚌𝚝𝚞𝚊𝚕:*
│ ├ 𝚂𝚘𝚕𝚘 𝚞𝚜𝚞𝚊𝚛𝚒𝚘𝚜 𝚕𝚘𝚌𝚊𝚕𝚎𝚜 𝚙𝚎𝚛𝚖𝚒𝚝𝚒𝚍𝚘𝚜
│ ├ 𝙿𝚊𝚒́𝚜𝚎𝚜 𝚋𝚕𝚘𝚚𝚞𝚎𝚊𝚍𝚘𝚜: 𝚃𝚘𝚍𝚘𝚜 𝚎𝚡𝚌𝚎𝚙𝚝𝚘 𝚕𝚘𝚌𝚊𝚕
│ 
│ 💡 *𝙿𝚊𝚛𝚊 𝚍𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊𝚛:*
│ └ 𝚄𝚜𝚎 𝚎𝚕 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 .𝚊𝚗𝚝𝚒𝚎𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘 𝚘𝚏𝚏
╰─◉`.trim(),
                mentions: [sender],
              });
              return;
            }
          }

          if (paisBloqueado) {
            const isUserAdm = await isUserAdmin(this, m.chat, sender);
            if (!isUserAdm) {
              await this.groupParticipantsUpdate(m.chat, [sender], "remove");

              await this.sendMessage(m.chat, {
                text: `╭─「 🚫 *𝙿𝙰𝙸́𝚂 𝙱𝙻𝙾𝚀𝚄𝙴𝙰𝙳𝙾* 🚫 」
│ 
│ *ⓘ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 𝚍𝚎 𝚙𝚊𝚒́𝚜 𝚋𝚕𝚘𝚚𝚞𝚎𝚊𝚍𝚘 𝚍𝚎𝚝𝚎𝚌𝚝𝚊𝚍𝚘*
│ 
│ 📋 *𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚌𝚒𝚘́𝚗:*
│ ├ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘: ${userCountry}
│ ├ 𝙿𝚊𝚒́𝚜: ${countryName}
│ ├ 𝚁𝚊𝚣𝚘́𝚗: 𝙿𝚊𝚒́𝚜 𝚎𝚗 𝚕𝚒𝚜𝚝𝚊 𝚍𝚎 𝚋𝚕𝚘𝚚𝚞𝚎𝚊𝚍𝚘𝚜
│ ├ 𝙰𝚌𝚌𝚒𝚘́𝚗: 𝙴𝚡𝚙𝚞𝚕𝚜𝚊𝚍𝚘 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘
│ 
│ 📋 *𝙻𝚒𝚜𝚝𝚊 𝚍𝚎 𝚙𝚊𝚒́𝚜𝚎𝚜 𝚋𝚕𝚘𝚚𝚞𝚎𝚊𝚍𝚘𝚜:*
│ ${chat.paisesBloqueados.map((p) => `├ ${getCountryName(p)}`).join("\n")}
│ 
│ 💡 *𝙿𝚊𝚛𝚊 𝚖𝚘𝚍𝚒𝚏𝚒𝚌𝚊𝚛:*
│ └ 𝚄𝚜𝚎 .𝚋𝚕𝚘𝚚𝚞𝚎𝚙𝚊𝚒𝚜 𝚊𝚍𝚍/𝚛𝚎𝚖𝚘𝚟𝚎/𝚕𝚒𝚜𝚝
╰─◉`.trim(),
                mentions: [sender],
              });
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error("𝙴𝚛𝚛𝚘𝚛 𝚎𝚗 𝚜𝚒𝚜𝚝𝚎𝚖𝚊 𝚊𝚗𝚝𝚒-𝚊𝚛𝚊𝚋𝚎/𝚊𝚗𝚝𝚒-𝚎𝚡𝚝𝚛𝚊𝚗𝚓𝚎𝚛𝚘:", error);
    }

    let usedPrefix;
    const groupMetadata = m.isGroup
      ? {
          ...(this.chats?.[m.chat]?.metadata ||
            (await this.groupMetadata(m.chat).catch((_) => null)) ||
            {}),
          ...((
            this.chats?.[m.chat]?.metadata ||
            (await this.groupMetadata(m.chat).catch((_) => null)) ||
            {}
          ).participants && {
            participants: (
              (
                this.chats?.[m.chat]?.metadata ||
                (await this.groupMetadata(m.chat).catch((_) => null)) ||
                {}
              ).participants || []
            ).map((p) => ({ ...p, id: p.jid, jid: p.jid, lid: p.lid })),
          }),
        }
      : {};
    const participants = (
      (m.isGroup ? groupMetadata.participants : []) || []
    ).map((participant) => ({
      id: participant.jid,
      jid: participant.jid,
      lid: participant.lid,
      admin: participant.admin,
    }));
    const userGroup =
      (m.isGroup
        ? participants.find((u) => this.decodeJid(u.jid) === m.sender)
        : {}) || {};
    const botGroup =
      (m.isGroup
        ? participants.find((u) => this.decodeJid(u.jid) == this.user.jid)
        : {}) || {};
    const isRAdmin = userGroup?.admin == "superadmin" || false;
    const isAdmin = isRAdmin || userGroup?.admin == "admin" || false;

    if (chat?.adminmode && !isAdmin && !isROwner) {
      return;
    }

    const isBotAdmin = botGroup?.admin || false;

    const ___dirname = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "./plugins"
    );
    for (const name in global.plugins) {
      const plugin = global.plugins[name];
      if (!plugin) continue;
      if (plugin.disabled) continue;
      const __filename = join(___dirname, name);
      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, {
            chatUpdate,
            __dirname: ___dirname,
            __filename,
            user,
            chat,
            settings,
          });
        } catch (err) {
          console.error(err);
        }
      }
      if (!opts["restrict"])
        if (plugin.tags && plugin.tags.includes("admin")) {
          continue;
        }

      const chatPrefixes = chat?.prefixes || [];
      const chatPrefix = chat?.prefix || null;

      let allPrefixes = [];
      if (chatPrefixes.length > 0) {
        allPrefixes = [...chatPrefixes];
      }

      if (chatPrefix) {
        allPrefixes = [chatPrefix, ...allPrefixes];
      }

      allPrefixes = [...allPrefixes, ...globalPrefixes];

      allPrefixes = [...new Set(allPrefixes)];

      const prefixMatch = detectPrefix(m.text || "", allPrefixes);

      let match;
      if (prefixMatch) {
        match = [prefixMatch.prefix];
      } else {
        const strRegex = (str) =>
          String(str || "").replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        const pluginPrefix =
          plugin.customPrefix || this.prefix || global.prefix;
        match = (
          pluginPrefix instanceof RegExp
            ? [[pluginPrefix.exec(m.text || ""), pluginPrefix]]
            : Array.isArray(pluginPrefix)
            ? pluginPrefix.map((prefix) => {
                const regex =
                  prefix instanceof RegExp
                    ? prefix
                    : new RegExp(strRegex(prefix));
                return [regex.exec(m.text || ""), regex];
              })
            : typeof pluginPrefix === "string"
            ? [
                [
                  new RegExp(strRegex(pluginPrefix)).exec(m.text || ""),
                  new RegExp(strRegex(pluginPrefix)),
                ],
              ]
            : [[[], new RegExp()]]
        ).find((prefix) => prefix[1]);
      }

      if (typeof plugin.before === "function") {
        if (
          await plugin.before.call(this, m, {
            match,
            prefixMatch,
            conn: this,
            participants,
            groupMetadata,
            userGroup,
            botGroup,
            isROwner,
            isOwner,
            isRAdmin,
            isAdmin,
            isBotAdmin,
            isPrems,
            chatUpdate,
            __dirname: ___dirname,
            __filename,
            user,
            chat,
            settings,
          })
        )
          continue;
      }
      if (typeof plugin !== "function") {
        continue;
      }

      let usedPrefixTemp = "";
      if (prefixMatch && prefixMatch.prefix) {
        usedPrefixTemp = prefixMatch.prefix;
      } else if (match && match[0] && match[0][0]) {
        usedPrefixTemp = match[0][0];
      }

      if (usedPrefixTemp) {
        usedPrefix = usedPrefixTemp;
        const noPrefix = (m.text || "").replace(usedPrefix, "");
        let [command, ...args] = noPrefix
          .trim()
          .split(" ")
          .filter((v) => v);
        args = args || [];
        let _args = noPrefix.trim().split(" ").slice(1);
        let text = _args.join(" ");
        command = (command || "").toLowerCase();
        const fail = plugin.fail || global.dfail;
        const isAccept =
          plugin.command instanceof RegExp
            ? plugin.command.test(command)
            : Array.isArray(plugin.command)
            ? plugin.command.some((cmd) =>
                cmd instanceof RegExp ? cmd.test(command) : cmd === command
              )
            : typeof plugin.command === "string"
            ? plugin.command === command
            : false;
        global.comando = command;

        if (!isOwners && settings.self) return;
        if (
          m.id.startsWith("NJX-") ||
          (m.id.startsWith("BAE5") && m.id.length === 16) ||
          (m.id.startsWith("B24E") && m.id.length === 20)
        )
          return;

        if (!isAccept) continue;
        m.plugin = name;
        global.db.data.users[m.sender].commands++;
        if (chat) {
          const botId = this.user.jid;
          if (name !== "group-banchat.js" && chat?.isBanned && !isROwner) {
            const aviso =
              `𝙴𝚕 𝚋𝚘𝚝 𝙺𝙰𝚁𝙱𝙾𝚃 𝚎𝚜𝚝𝚊́ 𝚍𝚎𝚜𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘 𝚎𝚗 𝚎𝚜𝚝𝚎 𝚐𝚛𝚞𝚙𝚘\n\n 𝚄𝚗 𝚊𝚍𝚖𝚒𝚗𝚒𝚜𝚝𝚛𝚊𝚍𝚘𝚛 𝚙𝚞𝚎𝚍𝚎 𝚊𝚌𝚝𝚒𝚟𝚊𝚛𝚕𝚘 𝚌𝚘𝚗 𝚎𝚕 𝚌𝚘𝚖𝚊𝚗𝚍𝚘:\n ${usedPrefix}𝚋𝚘𝚝 𝚘𝚗`.trim();
            await m.reply(aviso);
            return;
          }
          if (m.text && user.banned && !isROwner) {
            const mensaje =
              `𝙴𝚜𝚝𝚊𝚜 𝚋𝚊𝚗𝚎𝚊𝚍𝚘/𝚊, 𝚗𝚘 𝚙𝚞𝚎𝚍𝚎𝚜 𝚞𝚜𝚊𝚛 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚎𝚗 𝚎𝚜𝚝𝚎 𝚋𝚘𝚝\n\n 𝚁𝚊𝚣𝚘́𝚗 ${user.bannedReason}\n\n 𝚂𝚒 𝚎𝚜𝚝𝚎 𝙱𝚘𝚝 𝚎𝚜 𝚌𝚞𝚎𝚗𝚝𝚊 𝚘𝚏𝚒𝚌𝚒𝚊𝚕 𝚢 𝚝𝚒𝚎𝚗𝚎𝚜 𝚎𝚟𝚒𝚍𝚎𝚗𝚌𝚒𝚊 𝚚𝚞𝚎 𝚛𝚎𝚜𝚙𝚊𝚕𝚍𝚎 𝚚𝚞𝚎 𝚎𝚜𝚝𝚎 𝚖𝚎𝚗𝚜𝚊𝚓𝚎 𝚎𝚜 𝚞𝚗 𝚎𝚛𝚛𝚘𝚛, 𝚙𝚞𝚎𝚍𝚎𝚜 𝚎𝚡𝚙𝚘𝚗𝚎𝚛 𝚝𝚞 𝚌𝚊𝚜𝚘 𝚌𝚘𝚗 𝚞𝚗 𝚖𝚘𝚍𝚎𝚛𝚊𝚍𝚘𝚛`.trim();
            m.reply(mensaje);
            return;
          }
        }
        if (
          !isOwners &&
          !m.chat.endsWith("g.us") &&
          !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(
            m.text
          )
        )
          return;

        const adminMode = chat.modoadmin || false;
        const wa =
          plugin.botAdmin ||
          plugin.admin ||
          plugin.group ||
          plugin ||
          noPrefix ||
          usedPrefix ||
          m.text.slice(0, 1) === usedPrefix ||
          plugin.command;

        if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return;

        if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
          fail("owner", m, this);
          continue;
        }
        if (plugin.rowner && !isROwner) {
          fail("rowner", m, this);
          continue;
        }
        if (plugin.owner && !isOwner) {
          fail("owner", m, this);
          continue;
        }
        if (plugin.premium && !isPrems) {
          fail("premium", m, this);
          continue;
        }
        if (plugin.group && !m.isGroup) {
          fail("group", m, this);
          continue;
        }
        if (plugin.botAdmin && !isBotAdmin) {
          fail("botAdmin", m, this);
          continue;
        }
        if (plugin.admin && !isAdmin) {
          fail("admin", m, this);
          continue;
        }
        m.isCommand = true;
        m.exp += plugin.exp ? parseInt(plugin.exp) : 10;
        let extra = {
          match,
          prefixMatch,
          usedPrefix,
          noPrefix,
          _args,
          args,
          command,
          text,
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          isPrems,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          settings,
        };
        try {
          await plugin.call(this, m, extra);
        } catch (err) {
          m.error = err;
          console.error(err);
        } finally {
          if (typeof plugin.after === "function") {
            try {
              await plugin.after.call(this, m, extra);
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (opts["queque"] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id);
      if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1);
    }
    let user = global.db.data.users[m.sender];
    if (m) {
      if (m.sender && user) {
        user.exp += m.exp;
      }
    }
    try {
      if (!opts["noprint"])
        await (await import("./lib/print.js")).default(m, this);
    } catch (err) {
      console.warn(err);
      console.log(m.message);
    }
  }
}

global.dfail = (type, m, conn) => {
  let edadaleatoria = [
    "10",
    "28",
    "20",
    "40",
    "18",
    "21",
    "15",
    "11",
    "9",
    "17",
    "25",
  ].getRandom();
  let user2 = m.pushName || "𝙰𝚗𝚘́𝚗𝚒𝚖𝚘";
  let verifyaleatorio = [
    "𝚛𝚎𝚐𝚒𝚜𝚝𝚛𝚊𝚛",
    "𝚛𝚎𝚐",
    "𝚟𝚎𝚛𝚒𝚏𝚒𝚌𝚊𝚛",
    "𝚟𝚎𝚛𝚒𝚏𝚢",
    "𝚛𝚎𝚐𝚒𝚜𝚝𝚎𝚛",
  ].getRandom();

  const msg = {
    retirado: "𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚕𝚘 𝚙𝚞𝚎𝚍𝚎𝚗 𝚞𝚜𝚊𝚛 𝚕𝚘𝚜 𝚘𝚠𝚗𝚎𝚛𝚜 𝚛𝚎𝚝𝚒𝚛𝚊𝚍𝚘𝚜 𝚍𝚎𝚕 𝚋𝚘𝚝",
    rowner:
      "*˙˚ʚ₍ ᐢ.👑.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚙𝚞𝚎𝚍𝚎 𝚞𝚝𝚒𝚕𝚒𝚣𝚊𝚛𝚜𝚎 𝚙𝚘𝚛 𝚎𝚕 𝚙𝚛𝚘𝚙𝚒𝚎𝚝𝚊𝚛𝚒𝚘 𝚍𝚎𝚕 𝙺𝙰𝚁𝙱𝙾𝚃.*",
    owner:
      "*˙˚ʚ₍ ᐢ.👤.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚜𝚎 𝚙𝚞𝚎𝚍𝚎 𝚞𝚜𝚊𝚛 𝚙𝚘𝚛 𝚎𝚕 𝚙𝚛𝚘𝚙𝚒𝚎𝚝𝚊𝚛𝚒𝚘 𝚍𝚎𝚕 𝙺𝙰𝚁𝙱𝙾𝚃.*",
    mods: "*˙˚ʚ₍ ᐢ.🍃.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚜𝚎 𝚙𝚞𝚎𝚍𝚎 𝚞𝚜𝚊𝚛 𝚙𝚘𝚛 𝚎𝚕 𝚙𝚛𝚘𝚙𝚒𝚎𝚝𝚊𝚛𝚒𝚘 𝚍𝚎𝚕 𝙺𝙰𝚁𝙱𝙾𝚃.*",
    premium:
      "*˙˚ʚ₍ ᐢ.💎.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚜𝚎 𝚙𝚞𝚎𝚍𝚎 𝚞𝚝𝚒𝚕𝚒𝚣𝚊𝚛 𝚙𝚘𝚛 𝚞𝚜𝚞𝚊𝚛𝚒𝚘𝚜 𝙿𝚛𝚎𝚖𝚒𝚞𝚖, 𝚢 𝚙𝚊𝚛𝚊 𝚖𝚒 𝚌𝚛𝚎𝚊𝚍𝚘𝚛.*",
    group: "*˙˚ʚ₍ ᐢ.📚.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚜𝚎 𝚙𝚞𝚎𝚍𝚎 𝚞𝚜𝚊𝚛 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜.`*",
    private:
      "*˙˚ʚ₍ ᐢ.📲.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚜𝚎 𝚙𝚞𝚎𝚍𝚎 𝚞𝚜𝚊𝚛 𝚊𝚕 𝚌𝚑𝚊𝚝 𝚙𝚛𝚒𝚟𝚊𝚍𝚘 𝚍𝚎𝚕 𝙺𝙰𝚁𝙱𝙾𝚃.*",
    admin: "*˙˚ʚ₍ ᐢ.🔱.ᐢ ₎ɞ˚ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚎𝚜 𝚙𝚊𝚛𝚊 𝚊𝚍𝚖𝚒𝚗𝚜 𝚍𝚎𝚕 𝚐𝚛𝚞𝚙𝚘.`*",
    botAdmin:
      "*˙˚ʚ₍ ᐢ.🌟.ᐢ ₎ɞ˚ 𝙿𝚊𝚛𝚊 𝚙𝚘𝚍𝚎𝚛 𝚞𝚜𝚊𝚛 𝚎𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚎𝚜 𝚗𝚎𝚌𝚎𝚜𝚊𝚛𝚒𝚘 𝚚𝚞𝚎 𝚢𝚘 𝚜𝚎𝚊 𝚊𝚍𝚖𝚒𝚗.*",
    unreg:
      "*˙˚ʚ₍ ᐢ.📋.ᐢ ₎ɞ˚ 𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚊𝚜 𝚎𝚜𝚝𝚊𝚛 𝚛𝚎𝚐𝚒𝚜𝚝𝚛𝚊𝚍𝚘(𝚊) 𝚙𝚊𝚛𝚊 𝚞𝚜𝚊𝚛 𝚎𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘, 𝚎𝚜𝚌𝚛𝚒𝚋𝚎 #𝚛𝚎𝚐 𝚙𝚊𝚛𝚊 𝚛𝚎𝚐𝚒𝚜𝚝𝚛𝚊𝚛𝚝𝚎.*",
    restrict:
      "*˙˚ʚ₍ ᐢ.⚙️.ᐢ ₎ɞ˚ 𝙲𝚘𝚖𝚊𝚗𝚍𝚘 𝚛𝚎𝚜𝚝𝚛𝚒𝚗𝚐𝚒𝚍𝚘 𝚙𝚊𝚛𝚊 𝚍𝚎𝚌𝚒𝚜𝚒𝚘́𝚗 𝚍𝚎𝚕 𝚙𝚛𝚘𝚙𝚒𝚎𝚝𝚊𝚛𝚒𝚘 𝚍𝚎𝚕 𝙺𝙰𝚁𝙱𝙾𝚃.*",
  }[type];
  if (msg)
    return conn.reply(m.chat, msg, m, global.rcanal).then((_) => m.react("✖️"));
};

let file = fileURLToPath(import.meta.url);
watchFile(file, async () => {
  unwatchFile(file);
  console.log(chalk.magenta("𝚂𝚎 𝚊𝚌𝚝𝚞𝚊𝚕𝚒𝚣𝚘 '𝚑𝚊𝚗𝚍𝚕𝚎𝚛.𝚓𝚜'"));
  if (global.reloadHandler) console.log(await global.reloadHandler());
});

global.detectPrefix = detectPrefix;
global.globalPrefixes = globalPrefixes;

export default {
  handler,
};
