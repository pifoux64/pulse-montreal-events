/**
 * Tests E2E pour la page d'accueil - Pulse Montreal
 */

import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('devrait charger la page d\'accueil correctement', async ({ page }) => {
    await page.goto('/');

    // Vérifier le titre
    await expect(page).toHaveTitle(/Pulse/);

    // Vérifier la présence du logo
    await expect(page.getByAltText('Pulse Logo')).toBeVisible();

    // Vérifier la barre de recherche
    await expect(page.getByPlaceholder(/Rechercher/)).toBeVisible();

    // Vérifier la navigation
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Carte' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calendrier' })).toBeVisible();
  });

  test('devrait permettre la recherche d\'événements', async ({ page }) => {
    await page.goto('/');

    // Saisir dans la barre de recherche
    const searchInput = page.getByPlaceholder(/Rechercher/);
    await searchInput.fill('jazz');
    await searchInput.press('Enter');

    // Attendre le chargement des résultats
    await page.waitForURL(/.*\?.*q=jazz.*/);

    // Vérifier que nous sommes sur la page de résultats
    await expect(page.getByText(/Résultats de recherche/)).toBeVisible();
  });

  test('devrait afficher les catégories d\'événements', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les catégories sont visibles
    await expect(page.getByText('Musique')).toBeVisible();
    await expect(page.getByText('Théâtre')).toBeVisible();
    await expect(page.getByText('Art & Culture')).toBeVisible();
    await expect(page.getByText('Famille')).toBeVisible();
    await expect(page.getByText('Sport')).toBeVisible();
  });

  test('devrait naviguer vers la carte', async ({ page }) => {
    await page.goto('/');

    // Cliquer sur le lien Carte
    await page.getByRole('link', { name: 'Carte' }).click();

    // Vérifier que nous sommes sur la page carte
    await expect(page).toHaveURL('/carte');
    await expect(page.getByText('Carte des événements')).toBeVisible();
  });

  test('devrait naviguer vers le calendrier', async ({ page }) => {
    await page.goto('/');

    // Cliquer sur le lien Calendrier
    await page.getByRole('link', { name: 'Calendrier' }).click();

    // Vérifier que nous sommes sur la page calendrier
    await expect(page).toHaveURL('/calendrier');
    await expect(page.getByText('Calendrier')).toBeVisible();
  });

  test('devrait être responsive sur mobile', async ({ page }) => {
    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Vérifier que le menu mobile est présent
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    }

    // Vérifier que la barre de recherche est toujours visible
    await expect(page.getByPlaceholder(/Rechercher/)).toBeVisible();
  });
});
