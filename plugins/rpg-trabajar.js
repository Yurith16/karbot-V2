// work.js - Comando de Trabajo
let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin, participants }) => {
  if (!global.db.data.chats[m.chat].economy && m.isGroup) {
    return conn.reply(m.chat, '❌ \\`La economía está desactivada en este grupo\\`', m)
  }

  let user = global.db.data.users[m.sender]
  const cooldown = 2 * 60 * 1000

  if (!user.lastwork) user.lastwork = 0

  if (Date.now() - user.lastwork < cooldown) {
    const tiempoRestante = formatTime(user.lastwork + cooldown - Date.now())
    return conn.reply(m.chat, `⏰ \\`Debes esperar:\\` *${tiempoRestante}*`, m)
  }

  user.lastwork = Date.now()

  let baseGanancia = Math.floor(Math.random() * 1501) + 2000
  let bonus = Math.random() < 0.2 ? Math.floor(baseGanancia * 0.3) : 0
  let gananciaTotal = baseGanancia + bonus

  user.coin += gananciaTotal

  const trabajo = pickRandom(trabajoItsuki)

  await m.react('💼')
  await conn.reply(m.chat, trabajo + ' *¥' + gananciaTotal.toLocaleString() + '* 💰', m)
}

handler.help = ['work']
handler.tags = ['economy']
handler.command = ['work']
handler.group = true

export default handler

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const parts = []
  if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`)
  parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}

const trabajoItsuki = [
  "📚 \\`Estudié diligentemente para mis exámenes y gané\\`",
  "🏪 \\`Ayudé en la librería familiar y recibí\\`",
  "📝 \\`Escribí un ensayo académico excelente y me pagaron\\`",
  "📂 \\`Organicé mis apuntes de estudio y encontré\\`",
  "👨‍🏫 \\`Di clases particulares a estudiantes más jóvenes y gané\\`",
  "🏆 \\`Participé en un concurso académico y gané\\`",
  "📖 \\`Vendí algunos de mis libros de texto viejos y obtuve\\`",
  "🎵 \\`Ayudé a Miku con sus estudios y me dio\\`",
  "📚 \\`Trabajé como asistente en biblioteca y gané\\`",
  "✍️ \\`Escribí reseñas de libros y recibí\\`"
]