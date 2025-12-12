let handler = async (m, { conn, text, isBotAdmin, isAdmin }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, '❌ *𝚂𝙾𝙻𝙾 𝙶𝚁𝚄𝙿𝙾𝚂*', m, ctxErr)
  }
  
  if (!isAdmin) {
    await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
    return conn.reply(m.chat, '🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*', m, ctxErr)
  }
  
  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
    return conn.reply(m.chat, '🚫 *𝙽𝙾 𝚂𝙾𝚈 𝙰𝙳𝙼𝙸𝙽*', m, ctxErr)
  }

  if (!text) {
    await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } })
    return conn.reply(m.chat, '📝 *𝚄𝚂𝙾: !add <𝚗ú𝚖/@𝚞𝚜𝚞𝚊𝚛𝚒𝚘>*', m, ctxWarn)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })

    let groupCode = await conn.groupInviteCode(m.chat)
    let inviteLink = `https://chat.whatsapp.com/${groupCode}`
    let groupName = (await conn.groupMetadata(m.chat)).subject || '𝙶𝚛𝚞𝚙𝚘'

    let numbers = []

    if (m.mentionedJid && m.mentionedJid.length > 0) {
      numbers = m.mentionedJid
    } else if (m.quoted) {
      numbers = [m.quoted.sender]
    } else if (text) {
      numbers = text.split(',').map(num => {
        let number = num.trim().replace(/[^0-9]/g, '')
        if (number.startsWith('0')) number = number.substring(1)
        if (!number.startsWith('51') && number.length === 9) number = '51' + number
        if (number.length === 8) number = '51' + number
        return number.includes('@s.whatsapp.net') ? number : number + '@s.whatsapp.net'
      }).filter(num => {
        let cleanNum = num.replace('@s.whatsapp.net', '')
        return cleanNum.length >= 10 && cleanNum.length <= 15
      })
    }

    if (numbers.length === 0) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, '❌ *𝙽Ú𝙼𝙴𝚁𝙾𝚂 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙾𝚂*', m, ctxErr)
    }

    let addedCount = 0
    let invitedCount = 0
    let failedCount = 0
    const invitationImage = 'https://image2url.com/images/1765499773577-a8b13785-f832-4299-b2ca-5d76d5415c4a.jpg'

    for (let number of numbers) {
      try {
        const contact = await conn.onWhatsApp(number)

        if (contact && contact.length > 0 && contact[0].exists) {
          let isContact = false
          try {
            const contactInfo = await conn.getContact(number)
            isContact = contactInfo && contactInfo.id
          } catch (e) {
            isContact = false
          }

          if (isContact) {
            try {
              await conn.groupParticipantsUpdate(m.chat, [number], 'add')
              addedCount++
            } catch {
              failedCount++
            }
          } else {
            try {
              const inviteMessage = `🎉 *𝙸𝙽𝚅𝙸𝚃𝙰𝙲𝙸Ó𝙽*\n\n▸ 𝙶𝚛𝚞𝚙𝚘: ${groupName}\n▸ 𝙴𝚗𝚕𝚊𝚌𝚎: ${inviteLink}`
              await conn.sendMessage(number, { 
                image: { url: invitationImage },
                caption: inviteMessage
              })
              invitedCount++
            } catch {
              try {
                const backupMessage = `🎉 *𝙸𝙽𝚅𝙸𝚃𝙰𝙲𝙸Ó𝙽*\n\n▸ ${groupName}\n▸ ${inviteLink}`
                await conn.sendMessage(number, { text: backupMessage })
                invitedCount++
              } catch {
                failedCount++
              }
            }
          }
        } else {
          failedCount++
        }

        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        failedCount++
      }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    const resultMessage = 
`✅ *𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾*\n\n` +
`▸ 𝙰𝚐𝚛𝚎𝚐𝚊𝚍𝚘𝚜: ${addedCount}\n` +
`▸ 𝙸𝚗𝚟𝚒𝚝𝚊𝚍𝚘𝚜: ${invitedCount}\n` +
`▸ 𝙵𝚊𝚕𝚕𝚊𝚛𝚘𝚗: ${failedCount}\n\n` +
`🔗 ${inviteLink}`

    await conn.reply(m.chat, resultMessage, m, ctxOk)

  } catch (error) {
    console.error('❌ 𝙴𝚁𝚁𝙾𝚁 𝙰𝙳𝙳:', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    let inviteLink = '𝙴𝚛𝚛𝚘𝚛'
    try {
      const code = await conn.groupInviteCode(m.chat)
      inviteLink = `https://chat.whatsapp.com/${code}`
    } catch {}
    
    await conn.reply(m.chat, 
`❌ *𝙴𝚁𝚁𝙾𝚁*\n\n▸ 𝚄𝚜𝚊 𝚎𝚕 𝚎𝚗𝚕𝚊𝚌𝚎:\n${inviteLink}`,
      m, ctxErr
    )
  }
}

handler.help = ['add']
handler.tags = ['owner']
handler.command = ['add', 'invitar', 'invite', 'agregar']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler