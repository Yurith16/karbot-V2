import { existsSync } from 'fs'
import { join } from 'path'
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import { performance } from 'perf_hooks'

// === CONFIGURACIÓN KARBOT ===
const KARBOT_CONFIG = {
  BOT_NAME: "KARBOT",
  OWNER_NAME: "HERNANDEZ",
  OWNER_NUMBER: "573187418668",
  MENU_IMAGE: "https://image2url.com/images/1765486087799-4050fc16-aeff-4200-b499-20a5538148a7.jpg"
}

/**
 * Fuente KARBOT - Negrita Monoespaciada
 */
function karbotFont(text) {
  const mapping = {
    A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", 
    I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", 
    Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", 
    Y: "𝗬", Z: "𝗭", a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", 
    g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", 
    o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", 
    w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇", 0: "𝟬", 1: "𝟭", 2: "𝟮", 3: "𝟯", 
    4: "𝟰", 5: "𝟱", 6: "𝟲", 7: "𝟳", 8: "𝟴", 9: "𝟵", " ": " "
  };
  return text.split("").map((char) => mapping[char] || char).join("");
}

/**
 * Emojis KARBOT por categoría
 */
const KARBOT_EMOJIS = {
  INFO: "⚙️",
  IA: "🤖", 
  JUEGOS: "🎮",
  ECONOMIA: "💰",
  GRUPOS: "👥",
  DESCARGAS: "📥",
  MULTIMEDIA: "🎨",
  TOOLS: "🛠️",
  BUSQUEDA: "🔍",
  PREMIUM: "⭐",
  SUB_BOT: "🤖",
  OWNER: "👑",
  DEFAULT: "🔹"
}

/**
 * Obtener uptime formateado KARBOT
 */
async function getKarbotUptime() {
  let totalSeconds = process.uptime()
  let hours = Math.floor(totalSeconds / 3600)
  let minutes = Math.floor((totalSeconds % 3600) / 60)
  let seconds = Math.floor(totalSeconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Obtener fecha KARBOT
 */
function getKarbotDate() {
  const now = new Date();
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "juno", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

// === HANDLER KARBOT MENU ===
let handler = async (m, { conn, usedPrefix: _p }) => {
  let startTime = performance.now();

  try {
    // Reacción KARBOT
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })

    let help = Object.values(global.plugins)
      .filter(p => !p.disabled)
      .map(p => ({
        help: Array.isArray(p.help) ? p.help : p.help ? [p.help] : [],
        tags: Array.isArray(p.tags) ? p.tags : p.tags ? [p.tags] : [],
      }))

    // Calcular Ping KARBOT
    let endTime = performance.now()
    let speed = (endTime - startTime).toFixed(4)

    // Categorías KARBOT
    const categories = {
      'KARBOT-INFO': ['main', 'info'],
      'INTELIGENCIA': ['bots', 'ia'],
      'JUEGOS': ['game', 'gacha'],
      'ECONOMÍA': ['economy', 'rpgnk'],
      'GRUPOS': ['group'],
      'DESCARGAS': ['downloader'],
      'MULTIMEDIA': ['sticker', 'audio', 'anime'],
      'TOOLS': ['tools', 'advanced'],
      'BÚSQUEDA': ['search', 'buscador'],
      'KARBOT-PREM': ['fun', 'premium', 'social', 'custom'],
      'SUB-BOT': ['serbot'],
      'OWNER': ['owner', 'creador'],
    }

    // === CONSTRUCCIÓN MENÚ KARBOT ===
    const username = "@" + m.sender.split("@")[0]
    const karbotTitle = karbotFont(` ${KARBOT_CONFIG.BOT_NAME} `)
    const dateInfo = getKarbotDate()
    
    let menuSections = []

    // 1. ENCABEZADO KARBOT (más compacto)
    const karbotHeader = 
`╭━〔 ${karbotTitle} 〕━╮
║
║ ${KARBOT_EMOJIS.INFO} Hola, ${username}
║ ${KARBOT_EMOJIS.INFO} Fecha: ${dateInfo}
║
╰━━━━━━━━━━━━━━━━━━━╯`.trim()
    menuSections.push(karbotHeader)

    // 2. INFO KARBOT COMPACTA (con desarrollador, contacto y prefijo)
    const infoBotTitle = karbotFont(" 𝙸𝙽𝙵𝙾 𝙺𝙰𝚁𝙱𝙾𝚃 ")
    const infoBotSection = 
`╭━━〔 ${KARBOT_EMOJIS.INFO}${infoBotTitle} 〕━━╮
║
║ ${KARBOT_EMOJIS.INFO} Bot: ${KARBOT_CONFIG.BOT_NAME}
║ ${KARBOT_EMOJIS.INFO} Ping: ${speed}ms
║ ${KARBOT_EMOJIS.INFO} Uptime: ${await getKarbotUptime()}
║ ${KARBOT_EMOJIS.INFO} RAM: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB
║ ${KARBOT_EMOJIS.INFO} Plugins: ${help.length}
║ ${KARBOT_EMOJIS.INFO} Desarrollador: ${KARBOT_CONFIG.OWNER_NAME}
║ ${KARBOT_EMOJIS.INFO} Contacto: ${KARBOT_CONFIG.OWNER_NUMBER}
║ ${KARBOT_EMOJIS.INFO} Prefijo: ${_p}
║ ${KARBOT_EMOJIS.INFO} Mode: ${global.opts['self'] ? '🔒 Privado' : '🔓 Público'}
║
╰━━━━━━━━━━━━━━━━━━━╯`.trim()
    menuSections.push(infoBotSection)

    // 3. COMANDOS KARBOT POR CATEGORÍA (cajas más compactas)
    for (let catName in categories) {
      let catTags = categories[catName]
      let comandos = help.filter(menu => menu.tags.some(tag => catTags.includes(tag)))

      if (comandos.length) {
        // Mapear nombre categoría KARBOT
        let karbotCatName = catName
          .replace('NAKANO', 'KARBOT')
          .replace('NK-', 'KARBOT-')
        
        const boldCatName = karbotFont(` ${karbotCatName} `)
        
        // Emoji por categoría
        let catEmoji = KARBOT_EMOJIS.DEFAULT
        if (catName.includes('INFO')) catEmoji = KARBOT_EMOJIS.INFO
        else if (catName.includes('INTELIGENCIA')) catEmoji = KARBOT_EMOJIS.IA
        else if (catName.includes('JUEGOS')) catEmoji = KARBOT_EMOJIS.JUEGOS
        else if (catName.includes('ECONOMÍA')) catEmoji = KARBOT_EMOJIS.ECONOMIA
        else if (catName.includes('GRUPOS')) catEmoji = KARBOT_EMOJIS.GRUPOS
        else if (catName.includes('DESCARGAS')) catEmoji = KARBOT_EMOJIS.DESCARGAS
        else if (catName.includes('MULTIMEDIA')) catEmoji = KARBOT_EMOJIS.MULTIMEDIA
        else if (catName.includes('TOOLS')) catEmoji = KARBOT_EMOJIS.TOOLS
        else if (catName.includes('BÚSQUEDA')) catEmoji = KARBOT_EMOJIS.BUSQUEDA
        else if (catName.includes('PREM')) catEmoji = KARBOT_EMOJIS.PREMIUM
        else if (catName.includes('SUB-BOT')) catEmoji = KARBOT_EMOJIS.SUB_BOT
        else if (catName.includes('OWNER')) catEmoji = KARBOT_EMOJIS.OWNER
        
        // Caja más compacta
        let sectionText = `╭━〔 ${catEmoji}${boldCatName} 〕━╮\n`
        
        let uniqueCommands = [...new Set(comandos.flatMap(menu => menu.help))]
        
        for (let cmd of uniqueCommands) {
          // Formato KARBOT para comandos
          sectionText += `║ ▸ ${_p}${cmd}\n`
        }
        
        sectionText += `╰━━━━━━━━━━━━━━━━━━━╯`
        menuSections.push(sectionText)
      }
    }



    // Combinar todo
    const fullText = menuSections.join("\n\n")

    // === ENVÍO INTERACTIVO KARBOT ===
    const localImagePath = join(process.cwd(), 'src', 'menu.jpeg')

    // Solo botón de ayuda
    const karbotButtons = [
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({ 
          display_text: '⚙️ 𝙰𝚈𝚄𝙳𝙰', 
          url: `https://wa.me/${KARBOT_CONFIG.OWNER_NUMBER}?text=Necesito+ayuda+con+KARBOT` 
        })
      }
    ]

    let header
    if (existsSync(localImagePath)) {
      const media = await prepareWAMessageMedia({ image: { url: localImagePath } }, { upload: conn.waUploadToServer })
      header = proto.Message.InteractiveMessage.Header.fromObject({
        hasMediaAttachment: true,
        imageMessage: media.imageMessage
      })
    } else {
      // Usar imagen KARBOT por defecto
      try {
        const media = await prepareWAMessageMedia({ image: { url: KARBOT_CONFIG.MENU_IMAGE } }, { upload: conn.waUploadToServer })
        header = proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: true,
          imageMessage: media.imageMessage
        })
      } catch {
        header = proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: false })
      }
    }

    // Mensaje interactivo KARBOT (sin footer extenso)
    const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
      body: proto.Message.InteractiveMessage.Body.fromObject({ text: fullText }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: 'KARBOT' }),
      header,
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
        buttons: karbotButtons
      })
    })

    const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { 
      userJid: conn.user.jid, 
      quoted: m 
    })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

    // Reacción de éxito
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('❌ ERROR KARBOT:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    // Fallback KARBOT
    await conn.reply(m.chat, 
`⚙️ *MENÚ KARBOT*\n\n▸ ${_p}menu - Menú principal\n▸ ${_p}ping - Estado del bot\n▸ ${_p}owner - Información\n\n📞 Contacto: ${KARBOT_CONFIG.OWNER_NUMBER}`, m)
  }
}

// === METADATA KARBOT ===
handler.help = ['menu', 'karbot', 'comandos']
handler.tags = ['main']
handler.command = ['menu', 'karbot', 'help', 'comandos']

export default handler