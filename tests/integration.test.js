import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createApp } from '../server/app.js'
import { openCatalog } from '../server/catalog.js'

let directory, catalog, server, base
before(async () => {
  directory = mkdtempSync(join(tmpdir(), 'mj-test-'))
  catalog = openCatalog(join(directory, 'catalog.sqlite'))
  server = createApp(catalog).listen(0, '127.0.0.1')
  await once(server, 'listening')
  base = 'http://127.0.0.1:' + server.address().port
})
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  catalog?.close()
  if (directory) rmSync(directory, { recursive: true, force: true })
})

test('la API consulta el estado de la base de datos', async () => {
  const response = await fetch(base + '/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})

test('lista cuatro proyectos en el orden editorial', async () => {
  const response = await fetch(base + '/api/projects')
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).map(project => project.slug),
    ['gestion-hotelera', 'hospital-veterinario', 'pipeline-de-tareas', 'redes-cisco'])
})

test('carga la arquitectura del hotel y responde 404 para proyectos inexistentes', async () => {
  const response = await fetch(base + '/api/projects/gestion-hotelera')
  assert.equal(response.status, 200)
  assert.match((await response.json()).architecture[0], /Administrador.*Cliente.*Personal/)
  const missing = await fetch(base + '/api/projects/desconocido')
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'Proyecto no encontrado' })
})
