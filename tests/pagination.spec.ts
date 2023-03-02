import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'RADar-DataTable Demo - Simple Data' })).toBeVisible()

  // Check if the table is rendered
  await expect(page.getByText('Information Table')).toBeVisible()
})

test('Check if the pagination is correct', async ({ page }) => {
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow left' }).click()
  await expect(page.getByRole('cell', { name: 'Bob', exact: true })).toBeVisible()
})

test('Check if the number of rows showed can be changed', async ({ page }) => {
  await page.locator('#rows').selectOption('20')
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(2)
  await page.locator('#rows').selectOption('10')
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(1)
})
