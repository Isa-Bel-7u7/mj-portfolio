import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const projects = JSON.parse(readFileSync(new URL('./projects.json', import.meta.url), 'utf8'))

export function isProjectSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function summarizeProject({ slug, title, type, status, summary }) {
  return { slug, title, type, status, summary }
}

export function openCatalog(path) {
  const database = new DatabaseSync(path)
  database.exec('PRAGMA busy_timeout = 5000')
  database.exec('CREATE TABLE IF NOT EXISTS projects (slug TEXT PRIMARY KEY, position INTEGER NOT NULL, content TEXT NOT NULL)')
  const save = database.prepare('INSERT OR REPLACE INTO projects VALUES (?, ?, ?)')
  database.exec('BEGIN IMMEDIATE')
  try {
    database.exec('DELETE FROM projects')
    projects.forEach((project, index) => save.run(project.slug, index, JSON.stringify(project)))
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    database.close()
    throw error
  }

  const list = database.prepare('SELECT content FROM projects ORDER BY position')
  const find = database.prepare('SELECT content FROM projects WHERE slug = ?')
  return {
    list: () => list.all().map(row => summarizeProject(JSON.parse(row.content))),
    find: slug => {
      const row = find.get(slug)
      return row ? JSON.parse(row.content) : null
    },
    ready: () => database.prepare('SELECT 1 FROM projects LIMIT 1').get() !== undefined,
    close: () => database.close(),
  }
}
