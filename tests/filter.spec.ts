import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'RADar-DataTable Demo - Simple Data' })).toBeVisible()

  // Check if the table is rendered
  await expect(page.getByText('Information Table')).toBeVisible()
})

test('Check if the filtering of the name and age is correct', async ({ page }) => {
  // Fill in the filter for the name ("Ro") and check if the cells with Rory and Rory2 are visible
  await page.getByPlaceholder('filter by name').fill('Ro')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('cell', { name: 'Rory', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(2)

  // Fill in the filter for the age (45) and check if only one Rory is visible (Rory2)
  await page.getByPlaceholder('filter by age').fill('45')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(1)

  // Remove filter of name and check if only Rory remains (he's the only one that is 45 years old)
  await page
    .getByRole('cell', { name: 'name No filter icon filter by name Cross icon' })
    .getByRole('button', { name: 'Cross icon' })
    .click()
  await expect(page.getByRole('cell', { name: 'Rory2', exact: true })).toHaveCount(1)

  // Remove filter of age and check if all the other cells are back
  await page
    .getByRole('cell', { name: 'age No filter icon Cross icon' })
    .getByRole('button', { name: 'Cross icon' })
    .click()
  await expect(page.getByRole('cell', { name: 'Bob' })).toBeVisible()
})

test('Check if the filtering of the age is correct', async ({ page }) => {
  // Fill in the filter for the age (45) and check if Rory2 is visible
  await page.getByPlaceholder('filter by age').fill('45')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('cell', { name: 'Rory2' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(1)

  //Fill in the filter for the age (35) and check if there is only one Rory
  await page.getByPlaceholder('filter by age').fill('35')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('cell', { name: 'Rory', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Rory' })).toHaveCount(1)
})
