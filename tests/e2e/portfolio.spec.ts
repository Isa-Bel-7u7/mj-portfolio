import { expect, test } from '@playwright/test'

test('la portada navega al catálogo y muestra los cuatro proyectos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Transformando ideas/)
  await page.getByRole('link', { name: 'Explorar proyectos' }).click()
  await expect(page).toHaveURL(/#proyectos$/)
  await expect(page.getByRole('link', { name: /^Ver proyecto:/ })).toHaveCount(4)
})

test('el caso de estudio hotelero se abre y admite recarga directa', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ver proyecto: Sistema de gestión hotelera' }).click()
  await expect(page).toHaveURL(/\/proyectos\/gestion-hotelera$/)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Sistema de gestión hotelera/)
  await expect(page.getByText('Administrador · Cliente · Personal')).toBeVisible()
  await page.getByRole('link', { name: 'Volver a proyectos' }).click()
  await expect(page).toHaveURL(/#proyectos$/)
})

test('en móvil el menú abre contacto y después se cierra', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Contacto' }).click()
  await expect(page).toHaveURL(/#contacto$/)
  await expect(page.getByRole('heading', { name: '¿Construimos algo interesante?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
