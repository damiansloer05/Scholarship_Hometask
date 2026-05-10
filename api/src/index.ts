import 'dotenv/config'
import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { createSchema, createYoga } from 'graphql-yoga'
import { typeDefs } from './schema/index.js'
import { queryResolvers, programFieldResolvers } from './resolvers/query.js'
import { mutationResolvers } from './resolvers/mutation.js'
import { pool } from './db/index.js'
import { createContext } from './context.js'

const PORT = parseInt(process.env.PORT ?? '4000', 10)

const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers: {
      Query: queryResolvers,
      Mutation: mutationResolvers,
      ...programFieldResolvers,
    },
  }),
  cors: {
    origin: CORS_ORIGINS,
    credentials: true,
  },
  graphiql: process.env.NODE_ENV !== 'production',
  logging: {
    debug: (...args) => console.debug('[graphql]', ...args),
    info: (...args) => console.info('[graphql]', ...args),
    warn: (...args) => console.warn('[graphql]', ...args),
    error: (...args) => console.error('[graphql]', ...args),
  },
  context: ({ request }) => ({
    ...createContext(request.headers.get('authorization')),
    requestId: request.headers.get('x-request-id') ?? randomUUID(),
  }),
})

const server = createServer((req, res) => {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID()
  res.setHeader('x-request-id', requestId)
  req.headers['x-request-id'] = requestId

  if (req.url === '/healthz') {
    pool
      .query('SELECT 1')
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('ok')
      })
      .catch(() => {
        res.writeHead(503, { 'Content-Type': 'text/plain' })
        res.end('db unavailable')
      })
    return
  }

  yoga(req, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.info(`[server] GraphQL API ready at http://0.0.0.0:${PORT}/graphql`)
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[server] GraphiQL playground at http://localhost:${PORT}/graphql`)
  }
})

const shutdown = async () => {
  console.info('[server] Shutting down...')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
