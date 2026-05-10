import { test, expect } from '@playwright/test'

test.describe('Onboarding → Programs → Dashboard flow', () => {
  test('student creates a profile, selects a program, and views the dashboard', async ({ page }) => {
    // ── Step 1: Land on onboarding page ─────────────────────────────────────
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /know exactly where you stand/i })).toBeVisible()

    // ── Step 2: Fill profile form ────────────────────────────────────────────
    await page.getByLabel('Full name').fill('Jane Doe')
    await page.getByLabel('Email').fill(`jane.doe+${Date.now()}@example.com`)
    await page.getByLabel('Highest education level').selectOption('BACHELOR')
    await page.getByLabel('Target entry term').selectOption('Fall 2026')
    await page.getByLabel('GPA').fill('3.7')
    await page.getByLabel('GRE (260–340)').fill('325')

    // ── Step 3: Submit and land on programs catalog ──────────────────────────
    await page.getByRole('button', { name: /continue to programs/i }).click()
    await page.waitForURL('/programs')
    await expect(page.getByRole('heading', { name: /program catalog/i })).toBeVisible()

    // ── Step 4: Navigate to first program ───────────────────────────────────
    const firstCard = page.locator('a[href^="/programs/"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()
    await page.waitForURL(/\/programs\/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // ── Step 5: Start checklist ──────────────────────────────────────────────
    await page.getByRole('button', { name: /start my checklist/i }).click()
    await page.waitForURL(/\/dashboard\/.+\/.+/)

    // ── Step 6: Verify dashboard elements ───────────────────────────────────
    await expect(page.getByText('Readiness Dashboard')).toBeVisible()
    await expect(page.getByText('Readiness Score')).toBeVisible()
    await expect(page.getByText('Timeline')).toBeVisible()
    await expect(page.getByText('Still needed')).toBeVisible()

    // Initial score should be 0%
    await expect(page.getByText('0%')).toBeVisible()

    // ── Step 7: Mark first checklist item as complete ────────────────────────
    const firstCheckbox = page.locator('button[title="Mark as complete"]').first()
    await firstCheckbox.click()

    // Score should increase from 0%
    await expect(page.getByText('0%')).not.toBeVisible({ timeout: 3_000 })
  })

  test('programs catalog filters by degree type', async ({ page }) => {
    await page.goto('/programs')
    await expect(page.getByRole('heading', { name: /program catalog/i })).toBeVisible()

    const initialCount = await page.locator('a[href^="/programs/"]').count()

    await page.getByRole('combobox').last().selectOption('MASTER')
    await expect(page.locator('a[href^="/programs/"]')).not.toHaveCount(initialCount)
  })

  test('profile redirects to profile creation when no profile exists', async ({ page }) => {
    // Clear localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())

    // Try to go directly to a program detail page
    await page.goto('/programs/a0000000-0000-0000-0000-000000000001')
    await page.getByRole('button', { name: /create profile first/i }).click()
    await expect(page).toHaveURL('/')
  })
})
