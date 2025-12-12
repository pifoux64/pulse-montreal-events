import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { Check, X, Crown, Sparkles, BarChart3, Upload, Star, Zap, Shield, Users, Calendar, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tarifs - Pulse Montreal',
  description: 'Choisissez le plan qui correspond à vos besoins pour promouvoir vos événements à Montréal',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Tarifs et plans
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins pour promouvoir vos événements à Montréal
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Plan BASIC */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-white/10 relative">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">BASIC</h2>
              <p className="text-slate-400">Parfait pour commencer</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">Gratuit</span>
              </div>
              <p className="text-slate-400 mt-2">Pour toujours</p>
            </div>

            <Link
              href="/publier"
              className="block w-full text-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors mb-8"
            >
              Commencer gratuitement
            </Link>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Création d'événements illimitée</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Profil organisateur personnalisable</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Statistiques de base (vues, favoris)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Classification IA automatique (tags structurés)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">1 promotion active à la fois</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Promotions en brouillon illimitées</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Apparition sur carte et calendrier</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">Statistiques détaillées</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">Import ICS en masse</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">Promotions illimitées</span>
              </div>
            </div>
          </div>

          {/* Plan PRO */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-amber-400/50 relative overflow-hidden">
            {/* Badge "Populaire" */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              Populaire
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-3xl font-bold text-white">PRO</h2>
              </div>
              <p className="text-slate-300">Pour les organisateurs sérieux</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">29$</span>
                <span className="text-xl text-slate-300 ml-2">CAD</span>
              </div>
              <p className="text-slate-300 mt-2">par mois</p>
            </div>

            <Link
              href="/publier"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-lg mb-8"
            >
              Passer à PRO
            </Link>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Tout du plan BASIC</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Statistiques détaillées (vues, clics, conversions)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Import ICS en masse</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Promotions actives illimitées</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Support prioritaire</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Badge "Vérifié" sur votre profil</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Publication multi-plateformes (à venir)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fonctionnalités détaillées */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Fonctionnalités incluses
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Gestion d'événements</h3>
              <p className="text-slate-300">
                Créez et gérez vos événements facilement. Ajoutez des photos, descriptions, prix et toutes les informations nécessaires. Classification IA automatique pour un meilleur référencement.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Visibilité maximale</h3>
              <p className="text-slate-300">
                Vos événements apparaissent sur la carte interactive, le calendrier et dans les résultats de recherche. Filtres avancés par type, ambiance et public pour une meilleure découverte.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Promotions</h3>
              <p className="text-slate-300">
                Mettez vos événements en avant avec des promotions ciblées : page d'accueil, top de liste, ou top de carte.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Statistiques</h3>
              <p className="text-slate-300">
                Suivez les performances de vos événements : vues, clics, favoris et bien plus avec le plan PRO.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Import en masse</h3>
              <p className="text-slate-300">
                Importez vos événements depuis un fichier ICS (PRO uniquement). Parfait pour les organisateurs avec plusieurs événements.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Classification IA</h3>
              <p className="text-slate-300">
                Vos événements sont automatiquement classés et taggés par intelligence artificielle (type, genre, ambiance, public) pour une meilleure visibilité.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-slate-300">
                Oui, vous pouvez passer de BASIC à PRO ou revenir à BASIC à tout moment. Les changements prennent effet immédiatement.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                Que se passe-t-il si j'annule mon abonnement PRO ?
              </h3>
              <p className="text-slate-300">
                Vous conservez l'accès aux fonctionnalités PRO jusqu'à la fin de votre période de facturation. Ensuite, vous passez automatiquement au plan BASIC.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                Les promotions sont-elles payantes ?
              </h3>
              <p className="text-slate-300">
                Oui, chaque promotion a un coût qui dépend de sa durée et de son type. Les promotions en brouillon sont gratuites et illimitées.
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                Y a-t-il un engagement minimum ?
              </h3>
              <p className="text-slate-300">
                Non, il n'y a pas d'engagement. Vous pouvez annuler votre abonnement PRO à tout moment sans frais.
              </p>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center bg-gradient-to-r from-sky-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à promouvoir vos événements ?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines d'organisateurs qui font confiance à Pulse Montreal pour promouvoir leurs événements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/publier"
              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold border border-white/10"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

