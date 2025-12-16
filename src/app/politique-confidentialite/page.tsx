import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Pulse Montreal',
  description: 'Politique de confidentialité de Pulse Montreal',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">Politique de confidentialité</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Pulse Montreal s'engage à protéger la confidentialité de vos données personnelles. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Données d'identification</strong> : nom, email (pour les organisateurs)</li>
              <li><strong>Données de navigation</strong> : adresse IP, type de navigateur, pages visitées</li>
              <li><strong>Données de préférences</strong> : favoris, filtres sauvegardés</li>
              <li><strong>Cookies</strong> : pour améliorer l'expérience utilisateur (avec consentement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Fournir et améliorer nos services</li>
              <li>Gérer votre compte organisateur</li>
              <li>Personnaliser votre expérience</li>
              <li>Analyser l'utilisation du site (avec consentement)</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Partage des données</h2>
            <p>
              Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Nos prestataires de services (hébergement, analytics avec consentement)</li>
              <li>Les autorités légales si requis par la loi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Conservation des données</h2>
            <p>
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services 
              ou respecter nos obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Vos droits</h2>
            <p>Conformément à la législation québécoise et canadienne, vous avez le droit de :</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Accéder à vos données personnelles</li>
              <li>Corriger vos données</li>
              <li>Demander la suppression de vos données</li>
              <li>Vous opposer au traitement de vos données</li>
              <li>Retirer votre consentement à tout moment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences 
              de cookies via la bannière de consentement ou les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre 
              l'accès non autorisé, la perte ou la destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité. Les modifications seront publiées 
              sur cette page avec la date de mise à jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              Pour toute question concernant vos données personnelles, contactez-nous à : 
              <a href="mailto:privacy@pulse-mtl.com" className="text-sky-400 hover:text-sky-300 underline ml-1">
                privacy@pulse-mtl.com
              </a>
            </p>
          </section>

          <section>
            <p className="text-sm text-slate-400">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Montreal' })}
            </p>
          </section>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/mentions-legales"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Mentions légales
          </Link>
          <Link
            href="/cgu"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Conditions générales d'utilisation
          </Link>
        </div>
      </main>
    </div>
  );
}

