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

async function login(page: import('@playwright/test').Page, password: string) {
  await page.goto('/')
  await page.getByLabel(/password|mật khẩu/i).fill(password)
  await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click()
  await expect(page.getByText(/Guide|Hướng dẫn|Dashboard/i).first()).toBeVisible()
}

test('admin login works when a test password is supplied', async ({ page }) => {
  const password = process.env.CAO_E2E_ADMIN_PASSWORD
  test.skip(!password, 'Set CAO_E2E_ADMIN_PASSWORD for authenticated E2E')
  await login(page, password as string)
})

test('authenticated terminal WebSocket reconnects', async ({ page }) => {
  const password = process.env.CAO_E2E_ADMIN_PASSWORD
  const terminalId = process.env.CAO_E2E_TERMINAL_ID
  test.skip(
    !password || !terminalId,
    'Set CAO_E2E_ADMIN_PASSWORD and CAO_E2E_TERMINAL_ID for authenticated WS E2E',
  )
  await login(page, password as string)

  const openSocket = () =>
    page.evaluate((id) => new Promise<string>((resolve, reject) => {
      const socket = new WebSocket(`wss://${location.host}/terminals/${id}/ws`)
      const timer = window.setTimeout(() => { socket.close(); reject(new Error('WebSocket timeout')) }, 10000)
      socket.onopen = () => { window.clearTimeout(timer); socket.close(); resolve('open') }
      socket.onerror = () => { window.clearTimeout(timer); reject(new Error('WebSocket error')) }
    }), terminalId)

  await expect(openSocket()).resolves.toBe('open')
  await expect(openSocket()).resolves.toBe('open')
})
