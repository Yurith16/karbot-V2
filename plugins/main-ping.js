let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })

    // Tiempo inicial ANTES de enviar mensaje
    const start = Date.now()

    // Enviar un mensaje de prueba para medir ping
    await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })

    // Tiempo final DESPUÉS de enviar mensaje
    const end = Date.now()

    // Calcular ping (tiempo de envío del mensaje)
    const ping = end - start

    // Evaluación del ping
    let speed, status;
    if (ping < 100) {
      speed = '🚀 𝙴𝚇𝚃𝚁𝙴𝙼𝙰𝙳𝙰𝙼𝙴𝙽𝚃𝙴 𝚁Á𝙿𝙸𝙳𝙾'
      status = '🟢 𝙴𝚇𝙲𝙴𝙻𝙴𝙽𝚃𝙴'
    } else if (ping < 300) {
      speed = '⚡ 𝙼𝚄𝚈 𝚁Á𝙿𝙸𝙳𝙾'
      status = '🟡 Ó𝙿𝚃𝙸𝙼𝙾'
    } else if (ping < 600) {
      speed = '🏓 𝚁Á𝙿𝙸𝙳𝙾'
      status = '🟡 𝙱𝚄𝙴𝙽𝙾'
    } else if (ping < 1000) {
      speed = '📶 𝙽𝙾𝚁𝙼𝙰𝙻'
      status = '🟠 𝙴𝚂𝚃𝙰𝙱𝙻𝙴'
    } else {
      speed = '🐢 𝙻𝙴𝙽𝚃𝙾'
      status = '🔴 𝚁𝙴𝙶𝚄𝙻𝙰𝚁'
    }

    // Obtener uptime del bot en español
    const uptime = process.uptime()
    const horas = Math.floor(uptime / 3600)
    const minutos = Math.floor((uptime % 3600) / 60)
    const segundos = Math.floor(uptime % 60)
    
    // Formato en español
    let uptimeString = ''
    if (horas > 0) uptimeString += `${horas}h `
    if (minutos > 0) uptimeString += `${minutos}m `
    if (segundos > 0 || uptimeString === '') uptimeString += `${segundos}s`
    
    uptimeString = uptimeString.trim()

    // Mensaje del ping KARBOT
    const pingMessage = 
`╭━━〔 ⚙️ 𝗞𝗔𝗥𝗕𝗢𝗧-𝗣𝗜𝗡𝗚 〕━━╮
║
║ ${ping < 300 ? '⚡' : ping < 600 ? '🏓' : '📶'} 𝙿𝙸𝙽𝙶: ${ping}𝚖𝚜
║ ${uptimeString ? `⏱️ 𝚄𝙿𝚃𝙸𝙼𝙴: ${uptimeString}` : '⏱️ 𝚄𝙿𝚃𝙸𝙼𝙴: 𝟶𝚜'}
║ ${speed.includes('🚀') ? '🚀' : speed.includes('⚡') ? '⚡' : speed.includes('🏓') ? '🏓' : speed.includes('📶') ? '📶' : '🐢'} 𝚅𝙴𝙻𝙾𝙲𝙸𝙳𝙰𝙳: ${speed}
║ ${status.includes('🟢') ? '🟢' : status.includes('🟡') ? '🟡' : status.includes('🟠') ? '🟠' : '🔴'} 𝙴𝚂𝚃𝙰𝙳𝙾: ${status}
║
╰━━━━━━━━━━━━━━━━━━━━╯`.trim()

    // Enviar resultado
    await conn.reply(m.chat, pingMessage, m)
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (error) {
    console.error('❌ 𝙴𝚁𝚁𝙾𝚁 𝙿𝙸𝙽𝙶:', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.reply(m.chat, 
`❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚌𝚊𝚕𝚌𝚞𝚕𝚊𝚛 𝚎𝚕 𝚙𝚒𝚗𝚐`, m)
  }
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['p', 'ping']

export default handler