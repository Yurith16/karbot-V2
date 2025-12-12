import ws from 'ws'
import pkg from '@whiskeysockets/baileys'
const { DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import fs from "fs/promises"
import path from 'path'

// Quoted especial
async function makeFkontak() {
  try {
    const { default: fetch } = await import('node-fetch')
    const res = await fetch('https://image2url.com/images/1765504298320-250ed158-9ddc-49d9-942b-2edfcc711cc8.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { 
        participants: '0@s.whatsapp.net', 
        remoteJid: 'status@broadcast', 
        fromMe: false, 
        id: 'Halo' 
      },
      message: { 
        locationMessage: { 
          name: '📋 𝙻𝙸𝚂𝚃𝙰 𝙳𝙴 𝚂𝚄𝙱𝙱𝙾𝚃𝚂', 
          jpegThumbnail: thumb2 
        } 
      },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

let handler = async(m, { usedPrefix, conn, text }) => {
  // Emoji de reacción inicial
  try { await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } }) } catch {}
  
  const limit = 20
  const users = [...new Set([...global.subbots.filter((conn) => conn.user && conn.ws?.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];

  // Emoji cuando se están procesando los bots
  try { await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }) } catch {}

  function dhms(ms) {
    var segundos = Math.floor(ms / 1000);
    var minutos = Math.floor(segundos / 60);
    var horas = Math.floor(minutos / 60);
    var días = Math.floor(horas / 24);

    segundos %= 60;
    minutos %= 60;
    horas %= 24;

    var resultado = "";
    if (días !== 0) {
      resultado += días + 'd '
    }
    if (horas !== 0) {
      resultado += horas + 'h '
    }
    if (minutos !== 0) {
      resultado += minutos + 'm '
    }
    if (segundos !== 0) {
      resultado += segundos + 's'
    }

    return resultado;
  }

  // Función para contar sesiones guardadas
  async function info(path) {
    try {
      const items = await fs.readdir(path);
      return items.length;
    } catch (err) {
      console.error("Error:", err);
      return 0;
    }
  }

  const jadi = 'Sessions/SubBot'

  // Generar lista de bots
  let botList = ''
  users.forEach((v, index) => {
    const jid = v.user.jid.replace(/[^0-9]/g, '')
    const name = v.user.name || 'karbot-sub'
    const uptime = v.uptime ? dhms(Date.now() - v.uptime) : "0s"

    botList += `🤖 *𝚂𝚄𝙱𝙱𝙾𝚃 [${index + 1}]*\n`
    botList += `📱 𝚃𝙴𝙻𝙴𝙵𝙾𝙽𝙾: +${jid}\n`
    botList += `⏱️ 𝚄𝙿𝚃𝙸𝙼𝙴: ${uptime}\n`
    botList += `────────────────\n\n`
  })

  const totalUsers = users.length
  const sesionesGuardadas = await info(jadi)

  let cap = `📊 *𝚂𝚃𝙰𝚃𝚄𝚂 𝚂𝚄𝙱𝙱𝙾𝚃𝚂*\n\n`
  cap += `💾 𝚂𝙴𝚂𝙸𝙾𝙽𝙴𝚂 𝙶𝚄𝙰𝚁𝙳𝙰𝙳𝙰𝚂: ${sesionesGuardadas}\n`
  cap += `🟢 𝚂𝙴𝚂𝙸𝙾𝙽𝙴𝚂 𝙰𝙲𝚃𝙸𝚅𝙰𝚂: ${totalUsers}/100\n`

  if (totalUsers > 0) {
    if (totalUsers > limit) {
      cap += `\n> 📋 𝙻𝙸𝚂𝚃𝙰 𝙻𝙸𝙼𝙸𝚃𝙰𝙳𝙰 (${limit} 𝙱𝙾𝚃𝚂)\n\n`
      const limitedUsers = users.slice(0, 5)
      limitedUsers.forEach((v, index) => {
        const jid = v.user.jid.replace(/[^0-9]/g, '')
        const uptime = v.uptime ? dhms(Date.now() - v.uptime) : "0s"

        cap += `🤖 [${index + 1}] +${jid}\n`
        cap += `⏱️ ${uptime}\n`
        cap += `────────────────\n`
      })
      cap += `📈 ...𝚈 ${totalUsers - 5} 𝙼𝙰𝚂`
    } else {
      cap += `\n${botList}`
    }
  } else {
    cap += `\n📭 𝙽𝙾 𝙷𝙰𝚈 𝚂𝚄𝙱𝙱𝙾𝚃𝚂 𝙰𝙲𝚃𝙸𝚅𝙾𝚂`
  }

  // Obtener menciones para los tags
  const mentions = users.map(v => v.user.jid)

  // Obtener el quoted especial
  const fkontak = await makeFkontak()

  // Emoji de éxito cuando se va a enviar el mensaje
  try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}

  try {
    // Enviar mensaje simple sin imagen
    await conn.sendMessage(m.chat, {
      text: cap, 
      mentions: mentions,
    }, { quoted: fkontak || m })

  } catch (e) {
    console.error('Error al enviar mensaje:', e)
    // Fallback simple
    await conn.sendMessage(m.chat, {
      text: cap
    }, { quoted: m })
  }
}

handler.help = ['botlist']
handler.tags = ['serbot']
handler.command = ['bots', 'listabots', 'subbots'] 
// handler.rowner = true

export default handler