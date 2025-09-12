import { test, expect } from '@playwright/test';

test.describe('Pulse Montreal - Basic User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/');
    
    // Attendre que la page soit chargée
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display homepage with navigation', async ({ page }) => {
    // Vérifier le titre de la page
    await expect(page).toHaveTitle(/Pulse/);
    
    // Vérifier la présence du logo
    await expect(page.locator('img[alt="Pulse Logo"]')).toBeVisible();
    
    // Vérifier les éléments de navigation
    await expect(page.locator('a[href="/carte"]')).toBeVisible();
    await expect(page.locator('a[href="/calendrier"]')).toBeVisible();
    await expect(page.locator('a[href="/favoris"]')).toBeVisible();
    await expect(page.locator('a[href="/publier"]')).toBeVisible();
  });

  test('should navigate to map page', async ({ page }) => {
    // Cliquer sur le lien Carte
    await page.click('a[href="/carte"]');
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/carte');
    
    // Vérifier que la carte est présente (chercher le conteneur de carte)
    await expect(page.locator('.maplibregl-map, #map, [data-testid="map"]').first()).toBeVisible({ timeout: 10000 });
    
    // Vérifier la présence des filtres
    await expect(page.locator('text=Filtres')).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    // Cliquer sur le lien Calendrier
    await page.click('a[href="/calendrier"]');
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/calendrier');
    
    // Vérifier la présence du titre
    await expect(page.locator('h1')).toContainText(/calendrier/i);
  });

  test('should navigate to favorites page', async ({ page }) => {
    // Cliquer sur le lien Favoris
    await page.click('a[href="/favoris"]');
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/favoris');
    
    // Vérifier la présence du contenu favoris
    await expect(page.locator('h1')).toContainText(/favoris/i);
  });

  test('should navigate to publish page', async ({ page }) => {
    // Cliquer sur le lien Publier
    await page.click('a[href="/publier"]');
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/publier');
    
    // Vérifier la présence du formulaire
    await expect(page.locator('form, input[type="text"]').first()).toBeVisible();
  });

  test('should display events on homepage', async ({ page }) => {
    // Attendre que les événements se chargent
    await page.waitForTimeout(2000);
    
    // Vérifier qu'il y a des cartes d'événements
    const eventCards = page.locator('[data-testid="event-card"], .event-card, .bg-white.rounded');
    await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should perform search functionality', async ({ page }) => {
    // Chercher un input de recherche
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche" i], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      // Taper une recherche
      await searchInput.fill('jazz');
      
      // Attendre les résultats (ou appuyer sur Entrée si nécessaire)
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Vérifier qu'il y a des résultats ou un message
      const hasResults = await page.locator('text=jazz').count() > 0;
      const hasNoResults = await page.locator('text=Aucun').isVisible();
      
      expect(hasResults || hasNoResults).toBeTruthy();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Tester sur mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que le menu mobile fonctionne
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], .lg\\:hidden button').first();
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Vérifier que le menu s'ouvre
      await expect(page.locator('nav a[href="/carte"]')).toBeVisible();
    }
    
    // Revenir à la taille desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load events API', async ({ page }) => {
    // Intercepter l'appel API
    const apiResponse = await page.request.get('/api/events-simple');
    
    // Vérifier que l'API répond
    expect(apiResponse.status()).toBe(200);
    
    // Vérifier le contenu de la réponse
    const data = await apiResponse.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Pulse Montreal - Event Interaction', () => {
  test('should open event modal when clicking event card', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que les événements se chargent
    await page.waitForTimeout(3000);
    
    // Chercher une carte d'événement cliquable
    const eventCard = page.locator('[data-testid="event-card"], .event-card, .cursor-pointer').first();
    
    if (await eventCard.isVisible()) {
      await eventCard.click();
      
      // Vérifier qu'un modal ou une page d'événement s'ouvre
      const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0').first();
      const eventPage = page.locator('h1, .event-title').first();
      
      const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      const eventPageVisible = await eventPage.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(modalVisible || eventPageVisible).toBeTruthy();
    }
  });

  test('should handle favorite functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Chercher un bouton de favori
    const favoriteButton = page.locator('[aria-label*="favori" i], .favorite-btn, button:has-text("♥")').first();
    
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      
      // Vérifier qu'il y a une réaction (changement de couleur, notification, etc.)
      await page.waitForTimeout(500);
      
      // Aller à la page des favoris pour vérifier
      await page.goto('/favoris');
      await page.waitForTimeout(1000);
      
      // Vérifier qu'il y a du contenu ou un message
      const hasFavorites = await page.locator('.event-card, [data-testid="event-card"]').count() > 0;
      const emptyMessage = await page.locator('text=aucun, text=vide, text=empty').count() > 0;
      
      expect(hasFavorites || emptyMessage).toBeTruthy();
    }
  });
});

test.describe('Pulse Montreal - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la présence d'un h1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('should have keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tester la navigation au clavier
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Vérifier qu'un élément a le focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper alt texts for images', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les images ont des alt texts
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });
});
