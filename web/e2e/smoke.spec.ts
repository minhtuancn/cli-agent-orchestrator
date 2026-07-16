import { expect, test } from '@playwright/test'

test('production health endpoint is reachable', async ({ request }) => {
  const response = await request.get('/health')
  expect(response.ok()).toBeTruthy()
  await expect(response.json()).resolves.toMatchObject({ status: 'ok' })
})

test('public UI loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Agent Orchestrator|CLI Agent Orchestrator|CAO/i)
})

test('admin login works when a test password is supplied', async ({ page }) => {
  const password = process.env.CAO_E2E_ADMIN_PASSWORD
  test.skip(!password, 'Set CAO_E2E_ADMIN_PASSWORD for authenticated E2E')

  await page.goto('/')
  const passwordInput = page.getByLabel(/password|mật khẩu/i)
  await passwordInput.fill(password as string)
  await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click()
  await expect(page.getByText(/Guide|Hướng dẫn|Dashboard/i).first()).toBeVisible()
})
