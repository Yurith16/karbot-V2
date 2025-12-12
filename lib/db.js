import { Low } from 'lowdb'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ⭐ CAMBIO AQUÍ: Ahora guarda en database/database.json
const file = join(__dirname, '..', 'database', 'database.json')

export const DB_PATH = file

// ⭐ NUEVA CLASE ADAPTADORA PARA REEMPLAZAR JSONFile
class SimpleAdapter {
  constructor(filePath) {
    this.filePath = filePath
  }

  async read() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      if (e.code === 'ENOENT') {
        // Crear carpeta database si no existe
        const dir = join(__dirname, '..', 'database')
        try {
          await fs.mkdir(dir, { recursive: true })
        } catch {}
        return null
      }
      throw e
    }
  }

  async write(data) {
    // Asegurar que la carpeta existe
    const dir = join(__dirname, '..', 'database')
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch {}
    // Escribe los datos
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2)) 
  }
}

const adapter = new SimpleAdapter(file)
export const db = new Low(adapter, { users: {}, chats: {}, stats: {}, settings: {} })

export async function loadDatabase() {
  await db.read()
  
  // CORRECCIÓN: Compatible con Node.js antiguo
  if (!db.data) db.data = { users: {}, chats: {}, stats: {}, settings: {} }

  // Bind global.db to lowdb instance for consistency
  if (!global.db) global.db = db
  if (!global.db.data) global.db.data = db.data

  // Expose helpers globally if needed
  global.loadDatabase = loadDatabase
  global.saveDatabase = saveDatabase
}

export async function saveDatabase() {
  try {
    if (global.db && global.db.data) db.data = global.db.data
  } catch (e) {
    console.log('[DB] sync error:', e?.message || e)
  }
  try {
    await db.write()
  } catch (e) {
    console.log('[DB] write error:', e?.message || e)
  }
}