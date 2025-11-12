import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Search, 
  Filter, 
  Share2, 
  Bell, 
  BarChart3,
  Sparkles,
  Users,
  Globe,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fonctionnalités - Pulse Montreal',
  description: 'Découvrez toutes les fonctionnalités de Pulse Montreal pour découvrir et organiser des événements',
};

export default function FeaturesPage() {
  const features = [
    {
      icon: MapPin,
      title: 'Carte interactive',
      description: 'Explorez les événements de Montréal sur une carte interactive. Trouvez facilement les événements près de chez vous.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Calendrier des événements',
      description: 'Visualisez tous les événements dans un calendrier mensuel. Planifiez vos sorties en un coup d\'œil.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Heart,
      title: 'Favoris',
      description: 'Sauvegardez vos événements préférés pour y revenir plus tard. Synchronisés sur tous vos appareils.',
      color: 'from-red-500 to-rose-500',
    },
    {
      icon: Search,
      title: 'Recherche avancée',
      description: 'Trouvez rapidement les événements qui vous intéressent grâce à notre moteur de recherche puissant.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Filter,
      title: 'Filtres intelligents',
      description: 'Filtrez par catégorie, date, prix, localisation et bien plus. Trouvez exactement ce que vous cherchez.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Share2,
      title: 'Partage facile',
      description: 'Partagez vos événements favoris avec vos amis sur les réseaux sociaux ou par email.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Recevez des notifications pour les nouveaux événements qui correspondent à vos intérêts.',
      color: 'from-yellow-500 to-amber-500',
    },
    {
      icon: BarChart3,
      title: 'Statistiques détaillées',
      description: 'Pour les organisateurs : suivez les performances de vos événements avec des statistiques en temps réel.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Sparkles,
      title: 'Promotions',
      description: 'Mettez vos événements en avant avec nos options de promotion. Visibilité maximale garantie.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Users,
      title: 'Profils organisateurs',
      description: 'Créez votre profil d\'organisateur et gérez tous vos événements depuis un seul endroit.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Globe,
      title: 'Multi-sources',
      description: 'Événements agrégés depuis plusieurs sources : Ticketmaster, Eventbrite, Meetup et plus encore.',
      color: 'from-sky-500 to-blue-500',
    },
    {
      icon: Zap,
      title: 'Temps réel',
      description: 'Les événements sont mis à jour en temps réel. Ne manquez jamais une nouveauté.',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Vos données sont protégées et sécurisées. Conformité avec les normes de confidentialité.',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: Smartphone,
      title: 'Mobile-friendly',
      description: 'Interface optimisée pour mobile. Accédez à tous les événements depuis votre téléphone.',
      color: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Fonctionnalités
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Découvrez tout ce que Pulse Montreal peut faire pour vous aider à découvrir et organiser des événements à Montréal
          </p>
        </div>

        {/* Grille de fonctionnalités */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Sections détaillées */}
        <div className="space-y-16 mb-16">
          {/* Pour les utilisateurs */}
          <section className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pour les utilisateurs
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  Découvrez Montréal
                </h3>
                <p className="text-slate-300 mb-4">
                  Explorez la scène culturelle montréalaise avec notre carte interactive et notre calendrier. 
                  Trouvez des concerts, festivals, expositions et bien plus.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 mt-1">•</span>
                    <span>Recherche par catégorie, date, prix</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 mt-1">•</span>
                    <span>Filtres géographiques (rayon personnalisable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 mt-1">•</span>
                    <span>Sauvegarde de vos favoris</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Restez organisé
                </h3>
                <p className="text-slate-300 mb-4">
                  Gardez une trace de tous les événements qui vous intéressent. Vos favoris sont synchronisés 
                  sur tous vos appareils.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Liste de favoris personnalisée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Synchronisation cloud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Partage avec vos amis</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pour les organisateurs */}
          <section className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pour les organisateurs
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Gérez vos événements
                </h3>
                <p className="text-slate-300 mb-4">
                  Créez et gérez tous vos événements depuis un tableau de bord intuitif. 
                  Ajoutez des photos, descriptions, prix et toutes les informations nécessaires.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Création d'événements illimitée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Import ICS en masse (PRO)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Gestion de lieux et profils</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  Analysez vos performances
                </h3>
                <p className="text-slate-300 mb-4">
                  Suivez les performances de vos événements avec des statistiques détaillées. 
                  Comprenez votre audience et optimisez vos promotions.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Vues, clics, favoris en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Statistiques sur 30 jours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Export de données (PRO)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-sky-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Rejoignez la communauté Pulse Montreal et découvrez tout ce que nous avons à offrir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
            >
              Découvrir les événements
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold border border-white/10"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

