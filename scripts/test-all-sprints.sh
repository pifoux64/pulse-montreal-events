#!/bin/bash

# Script de test automatisé pour tous les sprints
# Usage: ./scripts/test-all-sprints.sh

echo "🧪 Tests automatisés - Tous les Sprints"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester une URL
test_url() {
    local url=$1
    local description=$2
    
    echo -n "Test: $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ] || [ "$response" = "302" ] || [ "$response" = "401" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        return 1
    fi
}

# Vérifier que le serveur est lancé
echo "Vérification du serveur..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}✗${NC} Le serveur n'est pas accessible sur http://localhost:3000"
    echo "Lancez d'abord: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓${NC} Serveur accessible"
echo ""

BASE_URL="http://localhost:3000"

echo "📋 Tests des routes publiques"
echo "----------------------------"

# Sprint 1 - Fiche salle publique
test_url "$BASE_URL/top-5" "Page Top 5 (Sprint 6)"
test_url "$BASE_URL/social" "Page Social (Sprint 6) - devrait rediriger si non connecté"

echo ""
echo "📋 Tests des API Routes"
echo "---------------------"

# Sprint 2 - Dashboard salle
test_url "$BASE_URL/api/venues/me" "API: Mes salles (Sprint 2) - devrait retourner 401 si non connecté"
test_url "$BASE_URL/api/venues" "API: Liste/Créer salles (Sprint 2) - devrait retourner 401 si non connecté"

# Sprint 3 - Demandes de réservation
test_url "$BASE_URL/api/venue-requests" "API: Demandes de réservation (Sprint 3) - devrait retourner 401 si non connecté"

# Sprint 4 - IA Organisateurs
test_url "$BASE_URL/api/ai/event-assistant" "API: Assistant IA (Sprint 4) - devrait retourner 405 (GET non autorisé)"
test_url "$BASE_URL/api/ai/content-generator" "API: Générateur contenu (Sprint 4) - devrait retourner 405"
test_url "$BASE_URL/api/ai/budget-calculator" "API: Calculateur budget (Sprint 4) - devrait retourner 405"

# Sprint 5 - IA Salles
test_url "$BASE_URL/api/ai/venue-suggestions" "API: Suggestions salle (Sprint 5) - devrait retourner 405"
test_url "$BASE_URL/api/ai/venue-matching" "API: Matching salle (Sprint 5) - devrait retourner 405"

# Sprint 6 - Social
test_url "$BASE_URL/api/users/follow" "API: Suivre utilisateur (Sprint 6) - devrait retourner 401"
test_url "$BASE_URL/api/users/friends/events" "API: Événements amis (Sprint 6) - devrait retourner 401"
test_url "$BASE_URL/api/events/invitations" "API: Invitations (Sprint 6) - devrait retourner 401"
test_url "$BASE_URL/api/trending" "API: Événements tendance (Sprint 6)"

# Sprint 7 - Monétisation
test_url "$BASE_URL/api/subscriptions/plans" "API: Plans d'abonnement (Sprint 7)"
test_url "$BASE_URL/api/subscriptions/organizer" "API: Abonnement organisateur (Sprint 7) - devrait retourner 401"
test_url "$BASE_URL/api/subscriptions/venue" "API: Abonnement salle (Sprint 7) - devrait retourner 400 (venueId manquant)"

echo ""
echo "📋 Vérification de la base de données"
echo "------------------------------------"

# Vérifier Prisma
if command -v npx &> /dev/null; then
    echo -n "Vérification du schéma Prisma... "
    if npx prisma validate > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo "  Exécutez: npx prisma validate"
    fi
else
    echo -e "${YELLOW}⚠${NC} npx non trouvé, impossible de valider Prisma"
fi

echo ""
echo "📋 Vérification des variables d'environnement"
echo "--------------------------------------------"

check_env_var() {
    local var=$1
    local description=$2
    
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠${NC} $description non configuré ($var)"
        return 1
    else
        echo -e "${GREEN}✓${NC} $description configuré"
        return 0
    fi
}

# Charger .env si présent
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

check_env_var "DATABASE_URL" "URL de la base de données"
check_env_var "NEXTAUTH_SECRET" "Secret NextAuth"
check_env_var "NEXTAUTH_URL" "URL NextAuth"

# Stripe (optionnel pour les tests)
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} Stripe non configuré (STRIPE_SECRET_KEY) - nécessaire pour Sprint 7"
else
    echo -e "${GREEN}✓${NC} Stripe configuré"
fi

# OpenAI (optionnel pour les tests)
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} OpenAI non configuré (OPENAI_API_KEY) - nécessaire pour Sprints 4-5"
else
    echo -e "${GREEN}✓${NC} OpenAI configuré"
fi

echo ""
echo "========================================"
echo "✅ Tests automatisés terminés"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Lisez PLAN_TEST_COMPLET.md pour les tests manuels"
echo "2. Testez chaque sprint individuellement"
echo "3. Utilisez Prisma Studio pour inspecter la base de données"
echo "4. Testez avec plusieurs comptes utilisateurs"
echo ""
