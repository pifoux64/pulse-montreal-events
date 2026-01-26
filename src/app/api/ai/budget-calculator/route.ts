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
    // Utiliser l'attendance attendue ou la capacité de la salle, avec une valeur par défaut raisonnable
    const attendance = expectedAttendance ? parseInt(String(expectedAttendance), 10) : (venueCapacity ? parseInt(String(venueCapacity), 10) : 200);
    const safeAttendance = Math.max(1, Math.min(10000, attendance)); // Limiter à 10000 pour éviter les valeurs aberrantes
    
    const estimatedSound = hasSound ? (safeAttendance < 100 ? 500 : safeAttendance < 300 ? 1000 : 2000) : 0;
    const estimatedLighting = hasLighting ? (safeAttendance < 100 ? 300 : safeAttendance < 300 ? 600 : 1200) : 0;
    const estimatedPromotion = promotionBudget ? parseFloat(promotionBudget) : (safeAttendance < 100 ? 200 : safeAttendance < 300 ? 500 : 1000);
    const estimatedStaff = safeAttendance < 100 ? 200 : safeAttendance < 300 ? 400 : 800;

    costs.sound = estimatedSound;
    costs.lighting = estimatedLighting;
    costs.promotion = estimatedPromotion;
    costs.staff = estimatedStaff;
    costs.other = otherCosts ? parseFloat(otherCosts) : 0;
    totalCosts += estimatedSound + estimatedLighting + estimatedPromotion + estimatedStaff + (costs.other || 0);
    costs.total = totalCosts;

    // Calcul du seuil de rentabilité avec validation
    // Calcul du prix de billet nécessaire pour atteindre le seuil avec l'attendance réelle
    const breakEvenPrice = totalCosts / safeAttendance;
    
    // Calcul du nombre de personnes nécessaires avec un prix de billet raisonnable (15-30$)
    // Si le breakEvenPrice est très bas (< 15$), utiliser 15$ comme prix minimum
    // Si le breakEvenPrice est très élevé (> 30$), utiliser 30$ comme prix maximum
    const reasonableTicketPrice = Math.max(15, Math.min(30, breakEvenPrice));
    const breakEvenAttendees = Math.ceil(totalCosts / reasonableTicketPrice);

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
    // Calculer les prix suggérés basés sur le breakEvenPrice réel
    // S'assurer que les prix sont raisonnables (min 10$, max 100$ pour les suggestions)
    const basePrice = Math.max(10, Math.min(100, breakEvenPrice));
    let suggestedPricing: any = {
      free: { viable: totalCosts < 500, notes: '' },
      low: { price: Math.max(10, Math.min(100, Math.ceil(basePrice * 0.8))), target: 'Broad audience' },
      medium: { price: Math.max(15, Math.min(100, Math.ceil(basePrice))), target: 'Target audience' },
      high: { price: Math.max(20, Math.min(100, Math.ceil(basePrice * 1.5))), target: 'Premium audience' },
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
        // Valider et limiter les prix suggérés par l'IA pour éviter les valeurs aberrantes
        const validatedPricing = { ...result.data.suggestedPricing };
        
        // Limiter les prix à des valeurs raisonnables (max 100$ pour les suggestions)
        // S'assurer que les prix sont des nombres valides
        const basePrice = Math.max(10, Math.min(100, breakEvenPrice));
        
        if (validatedPricing.low?.price) {
          const price = Number(validatedPricing.low.price);
          if (isNaN(price) || price <= 0 || price > 100) {
            validatedPricing.low.price = Math.max(10, Math.min(100, Math.ceil(basePrice * 0.8)));
          } else {
            validatedPricing.low.price = Math.min(100, Math.ceil(price));
          }
        } else {
          validatedPricing.low.price = Math.max(10, Math.min(100, Math.ceil(basePrice * 0.8)));
        }
        
        if (validatedPricing.medium?.price) {
          const price = Number(validatedPricing.medium.price);
          if (isNaN(price) || price <= 0 || price > 100) {
            validatedPricing.medium.price = Math.max(15, Math.min(100, Math.ceil(basePrice)));
          } else {
            validatedPricing.medium.price = Math.min(100, Math.ceil(price));
          }
        } else {
          validatedPricing.medium.price = Math.max(15, Math.min(100, Math.ceil(basePrice)));
        }
        
        if (validatedPricing.high?.price) {
          const price = Number(validatedPricing.high.price);
          if (isNaN(price) || price <= 0 || price > 100) {
            validatedPricing.high.price = Math.max(20, Math.min(100, Math.ceil(basePrice * 1.5)));
          } else {
            validatedPricing.high.price = Math.min(100, Math.ceil(price));
          }
        } else {
          validatedPricing.high.price = Math.max(20, Math.min(100, Math.ceil(basePrice * 1.5)));
        }
        
        // S'assurer que les labels target sont présents
        if (!validatedPricing.low?.target) validatedPricing.low.target = 'Broad audience';
        if (!validatedPricing.medium?.target) validatedPricing.medium.target = 'Target audience';
        if (!validatedPricing.high?.target) validatedPricing.high.target = 'Premium audience';
        
        suggestedPricing = validatedPricing;
      }
    } catch (error) {
      console.warn('Erreur IA pour recommandations, utilisation des valeurs par défaut:', error);
      aiRecommendations = [
        'Considérez des partenariats pour réduire les coûts',
        'Prévoyez une marge de sécurité de 10-20%',
        'Évaluez la possibilité d\'un événement gratuit avec financement alternatif',
      ];
    }

    // Valider et limiter le prix de billet nécessaire
    // Si le prix est très bas (< 1$), utiliser le prix raisonnable minimum (15$)
    // Si le prix est très élevé (> 100$), limiter à 100$
    const safeBreakEvenPrice = breakEvenPrice < 1 
      ? reasonableTicketPrice 
      : Math.min(100, Math.max(1, Math.round(breakEvenPrice * 100) / 100));
    const safeBreakEvenAttendees = Math.min(10000, Math.max(1, breakEvenAttendees));
    
    // S'assurer que costs.total est toujours défini et correct
    costs.total = totalCosts;
    
    // Valider que tous les coûts sont des nombres valides
    Object.keys(costs).forEach(key => {
      if (key !== 'total' && costs[key] != null) {
        const value = Number(costs[key]);
        if (isNaN(value) || value < 0) {
          costs[key] = 0;
        } else {
          costs[key] = Math.round(value * 100) / 100; // Arrondir à 2 décimales
        }
      }
    });
    
    // Recalculer le total après validation
    costs.total = (costs.venue || 0) + 
                  (costs.artists || 0) + 
                  (costs.sound || 0) + 
                  (costs.lighting || 0) + 
                  (costs.promotion || 0) + 
                  (costs.staff || 0) + 
                  (costs.other || 0);
    
    return NextResponse.json({
      estimatedCosts: costs,
      breakEven: {
        ticketPrice: safeBreakEvenPrice,
        attendeesNeeded: safeBreakEvenAttendees,
        revenue: costs.total,
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
