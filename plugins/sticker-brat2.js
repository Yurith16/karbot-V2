import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    //Fixieada por ZzawX
    
    try {
        await m.react('🕒');

        if (!text) {
            await m.react('❔');
            return conn.reply(m.chat, 
                '> `❌ TEXTO FALTANTE`\n\n' +
                '> `📝 Debes escribir texto después del comando`\n\n' +
                '> `💡 Ejemplo:` *' + usedPrefix + command + ' texto aquí*', 
                m
            );
        }

        const username = m.pushName || m.sender.split('@')[0] || "Usuario";
        
        // Lista de APIs a probar
        const apis = [
            {
                name: "ZellAPI",
                url: `https://apizell.web.id/tools/bratanimate?q=${encodeURIComponent(text)}`
            },
            {
                name: "SiputzxAPI", 
                url: `https://api.siputzx.my.id/api/m/bratvideo?text=${encodeURIComponent(text)}`
            },
            {
                name: "MayAPI",
                url: `https://mayapi.ooguy.com/bratvideo`,
                params: { apikey: 'may-051b5d3d', text: text }
            }
        ];

        let stickerBuffer;
        let apiUsed = "Desconocida";

        for (const api of apis) {
            try {
                console.log(`🔄 Probando API: ${api.name}`);
                
                // Hacer la petición sin especificar tipo de respuesta
                const response = await axios({
                    method: 'GET',
                    url: api.url,
                    params: api.params || {},
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });

                const data = Buffer.from(response.data);
                
                // Verificar que tenga datos suficientes
                if (!data || data.length < 100) {
                    console.log(`❌ ${api.name}: Datos insuficientes`);
                    continue;
                }

                // AUTO-DETECCIÓN DE FORMATO
                const firstBytes = data.slice(0, 12);
                
                // Verificar si es JSON
                try {
                    const jsonString = data.toString('utf8');
                    const jsonData = JSON.parse(jsonString);
                    
                    // Si es JSON válido, buscar URL de imagen
                    if (jsonData && typeof jsonData === 'object') {
                        console.log(`✅ ${api.name}: Es JSON, buscando URL...`);
                        
                        let imageUrl;
                        
                        // Buscar URL en diferentes estructuras de JSON
                        if (jsonData.url) {
                            imageUrl = jsonData.url;
                        } else if (jsonData.result && jsonData.result.url) {
                            imageUrl = jsonData.result.url;
                        } else if (jsonData.result && typeof jsonData.result === 'string') {
                            imageUrl = jsonData.result;
                        } else if (jsonData.image) {
                            imageUrl = jsonData.image;
                        } else if (jsonData.data && jsonData.data.url) {
                            imageUrl = jsonData.data.url;
                        }
                        
                        if (imageUrl) {
                            console.log(`🔗 ${api.name}: URL encontrada: ${imageUrl}`);
                            
                            // Descargar la imagen
                            const imgResponse = await axios({
                                method: 'GET',
                                url: imageUrl,
                                responseType: 'arraybuffer',
                                timeout: 10000
                            });
                            
                            stickerBuffer = Buffer.from(imgResponse.data);
                            apiUsed = `${api.name} (JSON)`;
                            break;
                        }
                    }
                } catch (jsonError) {
                    // No es JSON, continuar con otros formatos
                }
                
                // Verificar si es imagen WEBP (sticker)
                const isWebP = firstBytes.slice(0, 4).toString() === 'RIFF' && 
                              firstBytes.slice(8, 12).toString() === 'WEBP';
                
                if (isWebP) {
                    console.log(`✅ ${api.name}: Es WEBP válido`);
                    stickerBuffer = data;
                    apiUsed = `${api.name} (WEBP directo)`;
                    break;
                }
                
                // Verificar si es MP4/GIF (video)
                const isMP4 = firstBytes.slice(4, 8).toString() === 'ftyp';
                const isGIF = firstBytes.slice(0, 6).toString() === 'GIF89a' || 
                             firstBytes.slice(0, 6).toString() === 'GIF87a';
                
                if (isMP4 || isGIF) {
                    console.log(`✅ ${api.name}: Es ${isMP4 ? 'MP4' : 'GIF'}`);
                    stickerBuffer = data;
                    apiUsed = `${api.name} (${isMP4 ? 'MP4' : 'GIF'})`;
                    break;
                }
                
                // Verificar si es PNG/JPEG
                const isPNG = firstBytes.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
                const isJPEG = firstBytes.slice(0, 3).toString('hex') === 'ffd8ff';
                
                if (isPNG || isJPEG) {
                    console.log(`✅ ${api.name}: Es ${isPNG ? 'PNG' : 'JPEG'}`);
                    stickerBuffer = data;
                    apiUsed = `${api.name} (${isPNG ? 'PNG' : 'JPEG'})`;
                    break;
                }
                
                // Si llegamos aquí, intentar usar los datos tal cual
                console.log(`⚠️ ${api.name}: Formato no identificado, usando datos crudos`);
                stickerBuffer = data;
                apiUsed = `${api.name} (formato desconocido)`;
                break;
                
            } catch (apiError) {
                console.log(`❌ ${api.name} falló:`, apiError.message);
                continue;
            }
        }

        if (!stickerBuffer) {
            throw new Error('Todas las APIs fallaron');
        }

        await m.react('✅️');

        console.log(`🎨 Enviando sticker animado desde: ${apiUsed}`);
        
        // Enviar sticker con metadata
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `𝐈𝐭𝐬𝐮𝐤𝐢𝐁𝐨𝐭-𝐌𝐃`,
                    body: `𝗦𝗼𝗹𝗶𝗰𝗶𝘁𝗮𝗱𝗼 𝗽𝗼𝗿: ${username}\n𝗖𝗿𝗲𝗮𝗱𝗼𝗿: 𝗟𝗲𝗼𝗗𝗲𝘃`,
                    thumbnailUrl: 'https://files.catbox.moe/yxcu1g.png',
                    sourceUrl: 'https://whatsapp.com/channel/0029Va9VhS8J5+50254766704',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error en brat2:', error);
        
        await m.react('❌');
        
        let errorMessage = '> `❌ ERROR ENCONTRADO`\n\n';
        
        if (error.message.includes('Todas las APIs fallaron')) {
            errorMessage += '> `📝 Todos los servicios están temporalmente no disponibles. Intenta más tarde.`';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += '> `⏰ Tiempo de espera agotado. Intenta de nuevo.`';
        } else if (error.response) {
            errorMessage += '> `📝 Error en la API: ' + error.response.status + '`';
        } else if (error.request) {
            errorMessage += '> `📝 No se pudo conectar con el servicio.`';
        } else {
            errorMessage += '> `📝 ' + error.message + '`';
        }

        await conn.reply(m.chat, errorMessage, m);
    }
};

handler.help = ['brat2'];
handler.tags = ['sticker'];
handler.command = ['brat2'];
handler.group = true;

export default handler;