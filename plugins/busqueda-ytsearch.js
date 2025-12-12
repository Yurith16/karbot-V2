import yts from "yt-search";

const userRequests = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender.split('@')[0];
    const senderKey = userId;

    // Verificar si ya tiene una búsqueda en proceso
    if (userRequests[senderKey]) {
        try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
        return m.reply('> ⚠️ 𝙰𝙶𝚄𝙰𝚁𝙳𝙰 𝚄𝙽 𝙼𝙾𝙼𝙴𝙽𝚃𝙾');
    }

    if (!text) {
        try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
        return m.reply(`> 🎬 𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚃𝙴𝚇𝚃𝙾 𝙰 𝙱𝚄𝚂𝙲𝙰𝚁\n𝚄𝚂𝙾: ${usedPrefix}${command} 𝚜𝚑𝚊𝚔𝚒𝚛𝚊`);
    }

    userRequests[senderKey] = true;

    try {
        // Reacción de búsqueda
        try { await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } }) } catch {}

        // Realizar búsqueda
        const results = await yts(text);

        if (!results || !results.videos || results.videos.length === 0) {
            throw new Error('No se encontraron videos');
        }

        const videos = results.videos.slice(0, 10);

        // Encabezado KARBOT
        const header = `╭━〔 🎬  𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴  🎬  〕━⬣

║ 🔍 *𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰:* ${text}
║ 📊 *𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂:* ${videos.length} videos
╰━━━━━━━━━━━━━━━━━━━⬣\n\n`;

        // Construir resultados
        let resultText = header;

        videos.forEach((video, index) => {
            const number = (index + 1).toString().padStart(2, "0");
            
            resultText += `╭━━━━━━━━━━━━━━━━━━━━━━⬣
║ 🎥 *𝚅𝙸𝙳𝙴𝙾 ${number}:*
║ ${video.title}
║
║ 👤 *𝙲𝙰𝙽𝙰𝙻:* ${video.author?.name || '𝙳𝙴𝚂𝙲𝙾𝙽𝙾𝙲𝙸𝙳𝙾'}
║ ⏱️ *𝙳𝚄𝚁𝙰𝙲𝙸𝙾́𝙽:* ${video.timestamp || '00:00'}
║ 👁️ *𝚅𝙸𝚂𝚃𝙰𝚂:* ${video.views?.toLocaleString() || '𝙽/𝙰'}
║ 📅 *𝚂𝚄𝙱𝙸𝙳𝙾:* ${video.ago || '𝙽/𝙰'}
║ 🔗 *𝙴𝙽𝙻𝙰𝙲𝙴:* ${video.url}
╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
        });

        // Pie final
        resultText += `╭━━━━━━━━━━━━━━━━━━━━━━⬣
║ ✅ *𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙰𝙳𝙰*
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;

        // Enviar mensaje
        await conn.sendMessage(m.chat, {
            text: resultText
        }, { quoted: m });

        // Reacción de éxito
        try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}

    } catch (error) {
        console.error("Error en YouTube search:", error);

        // Reacción de error
        try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}

        let errorMessage = '';
        
        if (error.message.includes('No se encontraron')) {
            errorMessage = `╭━━━〔 ❌  𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴  ❌  〕━━━⬣

║ 🎬 *𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰:* ${text}
║ 📊 *𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂:* 0 videos
║
║ ⚠️ 𝙽𝙾 𝚂𝙴 𝙴𝙽𝙲𝙾𝙽𝚃𝚁𝙰𝚁𝙾𝙽 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂
║ 💡 𝙸𝙽𝚃𝙴𝙽𝚃𝙰 𝙲𝙾𝙽 𝙾𝚃𝚁𝙰𝚂 𝙿𝙰𝙻𝙰𝙱𝚁𝙰𝚂
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;
        } else if (error.message.includes('timeout')) {
            errorMessage = `╭━━━〔 ⚠️  𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴  ⚠️  〕━━━⬣

║ 🎬 *𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰:* ${text}
║ 📊 *𝙴𝚂𝚃𝙰𝙳𝙾:* 𝚃𝙸𝙴𝙼𝙿𝙾 𝙴𝚇𝙲𝙴𝙳𝙸𝙳𝙾
║
║ ⚠️ 𝙴𝙻 𝚃𝙸𝙴𝙼𝙿𝙾 𝚂𝙴 𝙰𝙶𝙾𝚃𝙾́
║ 💡 𝙸𝙽𝚃𝙴𝙽𝚃𝙰 𝙽𝚄𝙴𝚅𝙰𝙼𝙴𝙽𝚃𝙴
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;
        } else {
            errorMessage = `╭━━━〔 ❌  𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴  ❌  〕━━━⬣

║ 🎬 *𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰:* ${text}
║ 📊 *𝙴𝚂𝚃𝙰𝙳𝙾:* 𝙴𝚁𝚁𝙾𝚁 𝙸𝙽𝙴𝚂𝙿𝙴𝚁𝙰𝙳𝙾
║
║ ⚠️ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾́ 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁
║ 💡 𝚅𝚄𝙴𝙻𝚅𝙴 𝙰 𝙸𝙽𝚃𝙴𝙽𝚃𝙰𝚁𝙻𝙾
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;
        }

        await m.reply(errorMessage);

    } finally {
        // Limpiar estado del usuario
        delete userRequests[senderKey];
    }
};

handler.help = ['yts', 'ytsearch', 'buscar'];
handler.tags = ['search', 'youtube'];
handler.command = /^(yts|ytsearch|buscar|busca)$/i;

export default handler;