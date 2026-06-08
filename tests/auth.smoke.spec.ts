import { expect, test } from '@playwright/test'

test('renders the momso shell', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('#root')).toBeAttached()
  await page.waitForFunction(() => {
    const root = document.querySelector('#root')
    return Boolean(root && root.innerHTML.trim().length > 0)
  })
  const rootMarkup = await page.locator('#root').innerHTML()
  expect(rootMarkup.trim().length).toBeGreaterThan(0)
})
