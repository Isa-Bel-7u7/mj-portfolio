import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isProjectSlug, summarizeProject } from '../server/catalog.js'

test('acepta identificadores en minúsculas con segmentos y números', () => {
  for (const value of ['gestion-hotelera', 'cisco', 'dhcp-v4']) {
    assert.equal(isProjectSlug(value), true)
  }
})

test('rechaza rutas, separadores consecutivos y valores no válidos', () => {
  for (const value of ['../redes-cisco', 'dos--guiones', 'MAYÚSCULAS', '', null]) {
    assert.equal(isProjectSlug(value), false)
  }
})

test('el resumen contiene únicamente los campos públicos del listado', () => {
  const summary = { slug: 'hotel', title: 'Hotel', type: 'Web', status: 'Proyecto', summary: 'Descripción' }
  assert.deepEqual(summarizeProject({ ...summary, architecture: ['Datos'], features: ['Roles'] }), summary)
})
