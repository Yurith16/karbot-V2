let handler = async (m, { conn, usedPrefix, command, isROwner }) => {
    // Solo el creador puede usar este comando
    if (!isROwner) return m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 👑 𝚂𝙾𝙻𝙾 𝙿𝙰𝚁𝙰 𝙲𝚁𝙴𝙰𝙳𝙾𝚁')

    let chat = global.db.data.chats[m.chat]

    // Verificar si el comando tiene argumentos
    let args = m.text.trim().split(' ').slice(1)
    let action = args[0]?.toLowerCase()

    if (!action || (action !== 'on' && action !== 'off')) {
        let status = chat.rootowner ? '🟢 𝙰𝙲𝚃𝙸𝚅𝙾' : '🔴 𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙾'
        return m.reply(`*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n` +
            `> 🛡️ 𝙼𝙾𝙳𝙾 𝚁𝙾𝙾𝚃𝙾𝚆𝙽𝙴𝚁\n` +
            `> 📊 𝙴𝚂𝚃𝙰𝙳𝙾: ${status}\n\n` +
            `> 💡 𝚄𝚂𝙾:\n` +
            `> ${usedPrefix}rootowner on\n` +
            `> ${usedPrefix}rootowner off\n\n` +
            `> 📝 𝙴𝙻 𝙱𝙾𝚃 𝚂𝙾𝙻𝙾 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴𝚁𝙰 𝙰𝙻 𝙲𝚁𝙴𝙰𝙳𝙾𝚁`)
    }

    if (action === 'on') {
        if (chat.rootowner) {
            return m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝚈𝙰 𝙴𝚂𝚃𝙰 𝙰𝙲𝚃𝙸𝚅𝙾')
        }
        chat.rootowner = true
        m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n' +
            `> 🛡️ 𝙼𝙾𝙳𝙾 𝚁𝙾𝙾𝚃𝙾𝚆𝙽𝙴𝚁 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾\n` +
            `> ✅ 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙲𝙸𝙾𝙽 𝙰𝙿𝙻𝙸𝙲𝙰𝙳𝙰\n` +
            `> 🔒 𝚂𝙾𝙻𝙾 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰 𝙲𝚁𝙴𝙰𝙳𝙾𝚁`)

    } else if (action === 'off') {
        if (!chat.rootowner) {
            return m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝚈𝙰 𝙴𝚂𝚃𝙰 𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙾')
        }
        chat.rootowner = false
        m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n' +
            `> 🛡️ 𝙼𝙾𝙳𝙾 𝚁𝙾𝙾𝚃𝙾𝚆𝙽𝙴𝚁 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾\n` +
            `> ✅ 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙲𝙸𝙾𝙽 𝙰𝙿𝙻𝙸𝙲𝙰𝙳𝙰\n` +
            `> 🔓 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰 𝚃𝙾𝙳𝙾𝚂`)
    }
}

handler.help = ['rootowner']
handler.tags = ['owner']
handler.command = /^(rootowner)$/i
handler.rowner = true

export default handler