/**
 * API Route pour le calculateur de budget
 * POST /api/ai/budget-calculator - Calcule budget prévisionnel, seuil de rentabilité, prix suggéré
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const BudgetCalculatorOutputSchema = z.object({
  estimatedCosts: z.object({
    venue: z.number().optional().describe('Coût de la salle (CAD)'),
    artists: z.number().optional().describe('Cachets artistes (CAD)'),
    sound: z.number().optional().describe('Sonorisation (CAD)'),
    lighting: z.number().optional().describe('Éclairage (CAD)'),
    promotion: z.number().optional().describe('Promotion/marketing (CAD)'),
    staff: z.number().optional().describe('Personnel (CAD)'),
    other: z.number().optional().describe('Autres coûts (CAD)'),
    total: z.number().describe('Total des coûts (CAD)'),
  }),
  breakEven: z.object({
    ticketPrice: z.number().describe('Prix de billet pour atteindre le seuil (CAD)'),
    attendeesNeeded: z.number().describe('Nombre de personnes nécessaires'),
    revenue: z.number().describe('Revenus au seuil de rentabilité (CAD)'),
  }),
  suggestedPricing: z.object({
    free: z.object({
      viable: z.boolean().describe('Événement gratuit viable'),
      notes: z.string().optional().describe('Notes'),
    }),
    low: z.object({
      price: z.number().describe('Prix bas suggéré (CAD)'),
      target: z.string().describe('Public cible'),
    }),
    medium: z.object({
      price: z.number().describe('Prix moyen suggéré (CAD)'),
      target: z.string().describe('Public cible'),
    }),
    high: z.object({
      price: z.number().describe('Prix élevé suggéré (CAD)'),
      target: z.string().describe('Public cible'),
    }),
  }),
  recommendations: z.array(z.string()).describe('Recommandations pour optimiser le budget'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      eventType,
      expectedAttendance,
      venueCapacity,
      venueCost,
      artistCosts,
      hasSound,
      hasLighting,
      promotionBudget,
      otherCosts,
    } = body;

    // Calculs de base côté serveur
    let totalCosts = 0;
    const costs: any = {};

    if (venueCost) {
      costs.venue = parseFloat(venueCost);
      totalCosts += costs.venue;
    }

    if (artistCosts) {
      costs.artists = parseFloat(artistCosts);
      totalCosts += costs.artists;
    }

    // Estimations par défaut si non fournies
    const attendance = expectedAttendance || venueCapacity || 200;
    const estimatedSound = hasSound ? (attendance < 100 ? 500 : attendance < 300 ? 1000 : 2000) : 0;
    const estimatedLighting = hasLighting ? (attendance < 100 ? 300 : attendance < 300 ? 600 : 1200) : 0;
    const estimatedPromotion = promotionBudget || (attendance < 100 ? 200 : attendance < 300 ? 500 : 1000);
    const estimatedStaff = attendance < 100 ? 200 : attendance < 300 ? 400 : 800;

    costs.sound = estimatedSound;
    costs.lighting = estimatedLighting;
    costs.promotion = estimatedPromotion;
    costs.staff = estimatedStaff;
    costs.other = otherCosts ? parseFloat(otherCosts) : 0;
    totalCosts += estimatedSound + estimatedLighting + estimatedPromotion + estimatedStaff + (costs.other || 0);
    costs.total = totalCosts;

    // Calcul du seuil de rentabilité
    const breakEvenAttendees = Math.ceil(totalCosts / 20); // Prix moyen de 20$ pour le calcul
    const breakEvenPrice = totalCosts / (expectedAttendance || venueCapacity || 200);

    // Utiliser l'IA pour des recommandations contextuelles
    const systemPrompt = `Tu es un expert en gestion financière d'événements culturels à Montréal.
Tu analyses les budgets d'événements et proposes des stratégies de tarification optimale.

Contexte Montréal :
- Prix moyens des billets : 15-30$ pour événements locaux, 30-80$ pour événements majeurs
- Coûts moyens : salle 500-3000$, son 500-2000$, éclairage 300-1200$
- Public montréalais sensible au prix mais prêt à payer pour qualité

Instructions :
- Analyse les coûts fournis
- Propose des stratégies de tarification (gratuit, bas, moyen, élevé)
- Identifie le seuil de rentabilité
- Donne des recommandations pour optimiser le budget`;

    const userPrompt = `Analyse ce budget d'événement :

Type : ${eventType || 'Événement culturel'}
Fréquence attendue : ${expectedAttendance || venueCapacity || 'Non spécifié'} personnes
Capacité salle : ${venueCapacity || 'Non spécifiée'}

Coûts :
- Salle : ${venueCost || 'Non spécifié'} CAD
- Artistes : ${artistCosts || 'Non spécifié'} CAD
- Son : ${estimatedSound} CAD
- Éclairage : ${estimatedLighting} CAD
- Promotion : ${estimatedPromotion} CAD
- Personnel : ${estimatedStaff} CAD
- Autres : ${costs.other || 0} CAD
- TOTAL : ${totalCosts} CAD

Génère :
1. Une analyse détaillée des coûts
2. Le seuil de rentabilité (prix et nombre de personnes)
3. Des suggestions de tarification (gratuit, bas, moyen, élevé) avec public cible
4. Des recommandations pour optimiser le budget`;

    let aiRecommendations: string[] = [];
    let suggestedPricing: any = {
      free: { viable: totalCosts < 500, notes: '' },
      low: { price: Math.max(10, Math.ceil(breakEvenPrice * 0.8)), target: 'Public large' },
      medium: { price: Math.ceil(breakEvenPrice), target: 'Public cible' },
      high: { price: Math.ceil(breakEvenPrice * 1.5), target: 'Public premium' },
    };

    try {
      const result = await callOpenAI(
        systemPrompt,
        userPrompt,
        BudgetCalculatorOutputSchema,
        {
          model: 'gpt-4o-mini',
          temperature: 0.3, // Plus factuel pour les calculs
          cacheKey: `budget:${totalCosts}:${attendance}`,
          cacheTTL: 3600,
        }
      );

      aiRecommendations = result.data.recommendations || [];
      if (result.data.suggestedPricing) {
        suggestedPricing = result.data.suggestedPricing;
      }
    } catch (error) {
      console.warn('Erreur IA pour recommandations, utilisation des valeurs par défaut:', error);
      aiRecommendations = [
        'Considérez des partenariats pour réduire les coûts',
        'Prévoyez une marge de sécurité de 10-20%',
        'Évaluez la possibilité d\'un événement gratuit avec financement alternatif',
      ];
    }

    return NextResponse.json({
      estimatedCosts: costs,
      breakEven: {
        ticketPrice: Math.ceil(breakEvenPrice * 100) / 100,
        attendeesNeeded: breakEvenAttendees,
        revenue: totalCosts,
      },
      suggestedPricing,
      recommendations: aiRecommendations,
    });

  } catch (error: any) {
    console.error('Erreur lors du calcul du budget:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du calcul' },
      { status: 500 }
    );
  }
}
