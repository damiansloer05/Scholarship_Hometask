import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        database: process.env.DB_NAME ?? 'admissions',
        user: process.env.DB_USER ?? 'admissions_user',
        password: process.env.DB_PASSWORD,
      })
  const db = drizzle(pool)

  console.log('[migrate] Running database migrations...')
  await migrate(db, { migrationsFolder: join(__dirname, '../../drizzle/migrations') })
  console.log('[migrate] Migrations complete.')

  await pool.end()
}

runMigrations().catch((err) => {
  console.error('[migrate] Migration failed:', err)
  process.exit(1)
})
