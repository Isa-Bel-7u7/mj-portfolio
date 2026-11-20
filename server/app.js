import express from 'express'
import { resolve } from 'node:path'
import { isProjectSlug } from './catalog.js'

export function createApp(catalog, dist = resolve('dist')) {
  const app = express()
  app.disable('x-powered-by')
  app.use((_request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
    })
    next()
  })
  app.get('/api/health', (_request, response) => {
    const ready = catalog.ready()
    response.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' })
  })
  app.get('/api/projects', (_request, response) => response.json(catalog.list()))
  app.get('/api/projects/:slug', (request, response) => {
    const slug = request.params.slug
    const project = isProjectSlug(slug) ? catalog.find(slug) : null
    if (!project) return response.status(404).json({ error: 'Proyecto no encontrado' })
    response.json(project)
  })
  app.use('/api', (_request, response) => response.status(404).json({ error: 'Ruta no encontrada' }))
  app.use(express.static(dist, { index: false }))
  app.get(['/', '/proyectos/:slug'], (_request, response) => response.sendFile(resolve(dist, 'index.html')))
  return app
}
