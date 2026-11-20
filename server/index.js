import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createApp } from './app.js'
import { openCatalog } from './catalog.js'

const path = process.env.DATABASE_PATH || './data/portfolio.sqlite'
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
const catalog = openCatalog(path)
const port = Number(process.env.PORT || 3000)
const server = createApp(catalog).listen(port, () => console.log('Portafolio disponible en el puerto ' + port))
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => server.close(() => catalog.close()))
}
