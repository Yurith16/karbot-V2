import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import pino from "pino"
import { protoType, serialize, makeWASocket } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'

// Inicializamos global.subbots
if (!global.subbots) global.subbots = []

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let userName = args[0] ? args[0] : m.sender.split("@")[0]
  const folder = path.join('Sessions/SubBot', userName)

  // Verificar límite de subbots
  if (global.subbots.length >= 100) {
    try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
    return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🚫 𝙻𝙸𝙼𝙸𝚃𝙴 𝙳𝙴 𝚂𝚄𝙱𝙱𝙾𝚃𝚂 𝙰𝙻𝙲𝙰𝙽𝚉𝙰𝙳𝙾', m)
  }

  // Verificar conexión existente
  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    try { await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }) } catch {}
    return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝚈𝙰 𝚃𝙸𝙴𝙽𝙴𝚂 𝚂𝚄𝙱𝙱𝙾𝚃 𝙰𝙲𝚃𝙸𝚅𝙾', m)
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  try { await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } }) } catch {}
  try { await conn.sendPresenceUpdate('composing', m.chat) } catch {}

  // util
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // reconnection/backoff state
  let retryCount = 0
  let destroyed = false

  const start = async () => {
    if (destroyed) return
    try {
      const { state, saveCreds } = await useMultiFileAuthState(folder)
      const { version } = await fetchLatestBaileysVersion()

      const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        browser: Browsers.macOS('Safari'),
        printQRInTerminal: false
      })

      // identify
      sock.id = userName
      sock.saveCreds = saveCreds
      sock.connection = 'connecting'
      sock.uptime = null
      let pairingCodeSent = false
      let cleanedForInvalidCreds = false

      try {
        protoType()
        serialize()
      } catch (e) {
        console.log(e)
      }

      let handlerr
      try {
        ({ handler: handlerr } = await import('../handler.js'))
      } catch (e) {
        console.error('[Handler] Error importando handler:', e)
      }

      // message upsert
      sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          if (!handlerr) return
          await handlerr.call(sock, chatUpdate)
        } catch (e) {
          console.error("Error en handler subbot:", e)
        }
      })

      // save creds
      sock.ev.on('creds.update', saveCreds)

      // keep-alive/auto-clean if no user after a while -> credentials invalid
      const initTimeout = setTimeout(async () => {
        if (!sock.user) {
          try {
            cleanedForInvalidCreds = true
            try { sock.ws?.close() } catch {}
            sock.ev.removeAllListeners()
            global.subbots = global.subbots.filter(c => c.id !== userName)
            try { 
              fs.rmSync(folder, { recursive: true, force: true }) 
            } catch (e) {
              console.error('Error eliminando carpeta de sesión: ', e)
            }
            console.log(`[SUB-BOT ${userName}] Limpiado por falta de autenticación (60s)`)
          } catch (e) {
            console.error('Error en limpieza por timeout:', e)
          }
        }
      }, 60000)

      sock.ev.on('connection.update', async (update) => {
        try {
          const { connection, lastDisconnect } = update

          if (connection === 'open') {
            retryCount = 0
            sock.__sessionOpenAt = Date.now()
            sock.connection = 'open'
            sock.uptime = new Date()

            global.subbots = global.subbots.filter(c => c.id !== userName)
            global.subbots.push(sock)
            clearTimeout(initTimeout)
            
            try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}
            
            try {
              await sleep(500)
              await conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ✅ 𝚂𝚄𝙱𝙱𝙾𝚃 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾\n> 🤖 𝚂𝙴𝚂𝙸𝙾𝙽 𝙸𝙽𝙸𝙲𝙸𝙰𝙳𝙰', m)
            } catch (e) {}
            
            console.log(`[SUB-BOT ${userName}] Conectado`)
          } else if (connection === 'close') {
            sock.connection = 'close'
            global.subbots = global.subbots.filter(c => c.id !== userName)
            
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
            
            if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 405 || reason === 403) {
              try {
                fs.rmSync(folder, { recursive: true, force: true })
              } catch (e) {
                console.error('Error eliminando carpeta de sesión: ', e)
              }
              destroyed = true
              console.log(`[SUB-BOT ${userName}] Desconectado y credenciales inválidas. Sesión eliminada.`)
              return
            }

            console.log(`[SUB-BOT ${userName}] Conexión cerrada (reason: ${reason}). Reintentando...`)

            retryCount = (retryCount || 0) + 1
            const backoff = Math.min(60000, 2000 * (2 ** Math.min(retryCount, 6)))
            setTimeout(() => {
              if (cleanedForInvalidCreds) return
              if (destroyed) return
              try {
                start()
              } catch (e) {
                console.error(`[SUB-BOT ${userName}] Error al reiniciar:`, e)
              }
            }, backoff)
          }
        } catch (e) {
          console.error('Error en connection.update (subbot):', e)
        }
      })

      // group participants placeholder
      sock.ev.on('group-participants.update', async (update) => {
        try {
          const { id, participants, action } = update || {}
          if (!id || !participants || !participants.length) return
        } catch (e) {}
      })

      // pairing code flow
      if (!state.creds?.registered && !pairingCodeSent) {
        pairingCodeSent = true

        try { await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }) } catch {}
        setTimeout(async () => {
          try {
            const rawCode = await sock.requestPairingCode(userName)

            try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}

            // Crear mensaje interactivo SIN imagen
            const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n` +
                      `> 🔐 𝙲𝙾𝙳𝙸𝙶𝙾 𝙳𝙴 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝙲𝙸𝙾𝙽\n` +
                      `> 📲 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 → 𝙰𝙹𝚄𝚂𝚃𝙴𝚂\n` +
                      `> ⛓️ 𝙳𝙸𝚂𝙿𝙾𝚂𝙸𝚃𝙸𝚅𝙾𝚂 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝙳𝙾𝚂\n` +
                      `> 🆕 𝚃𝙾𝙲𝙰 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝚁 𝚄𝙽 𝙳𝙸𝚂𝙿𝙾𝚂𝙸𝚃𝙸𝚅𝙾\n` +
                      `> 📋 𝙲𝙾𝙿𝙸𝙰 𝙴𝙻 𝙲𝙾𝙳𝙸𝙶𝙾:\n\n` +
                      `*${rawCode.match(/.{1,4}/g)?.join(' ')}*`
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: "𝚅𝙰𝙻𝙸𝙳𝙾 𝙿𝙾𝚁 𝟼𝟶 𝚂𝙴𝙶𝚄𝙽𝙳𝙾𝚂"
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 𝙲𝙾𝙿𝙸𝙰𝚁 𝙲𝙾𝙳𝙸𝙶𝙾",
                      copy_code: rawCode
                    })
                  }
                ]
              })
            })

            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
            try {
              await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
            } catch (e) {
              try {
                await sock.sendMessage(m.chat, { text: `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🔐 𝙲𝙾𝙳𝙸𝙶𝙾: ${rawCode}` }, { quoted: m })
              } catch (e2) {}
            }

            console.log(`Código de vinculación enviado: ${rawCode}`)

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
            try { await conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝙴𝚁𝚁𝙾𝚁: ${err.message}`, m) } catch {}
          }
        }, 3000)
      }

    } catch (error) {
      console.error('Error al crear socket:', error)
      try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      try { await conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m) } catch {}
      retryCount = (retryCount || 0) + 1
      const backoff = Math.min(60000, 2000 * (2 ** Math.min(retryCount, 6)))
      setTimeout(() => {
        if (!destroyed) start()
      }, backoff)
    }
  }

  start()
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']

export default handler