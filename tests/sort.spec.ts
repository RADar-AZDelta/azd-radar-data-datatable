import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'RADar-DataTable Demo - Simple Data' })).toBeVisible()

  // Check if the table is rendered
  await expect(page.getByText('Information Table')).toBeVisible()
})

test('Check if the sorting of the name is correct', async ({ page }) => {
  // Sort by name ascending and check if Amethyst is on the second page (last page)
  await page.getByRole('button', { name: 'name No filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Amethyst' })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()

  // Sort by name descending and check if Amethyst is on the second page (last page)
  await page.getByRole('button', { name: 'name Ascending filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Amethyst' })).toBeVisible()

  // Sort by name none and check if Rory2 is on the first page
  await page.getByRole('button', { name: 'name Descending filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Rory', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
})

test('Check if the sorting of the age is correct', async ({ page }) => {
  // Sort by age ascending and check if Rory2 is on the second page (last page)
  await page.getByRole('button', { name: 'age No filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Bob' })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()

  // Sort by age descending and check if Rory2 is on the first page
  await page.getByRole('button', { name: 'age Ascending filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Karl' })).toBeVisible()

  // Sort by age none and check if Rory2 is on the second page (last page)
  await page.getByRole('button', { name: 'age Descending filter icon' }).click()
  await expect(page.getByRole('cell', { name: 'Rory', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Arrow right' }).click()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
})
