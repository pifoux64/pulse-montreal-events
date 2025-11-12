import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales - Pulse Montreal',
  description: 'Mentions légales de Pulse Montreal',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">Mentions légales</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Éditeur du site</h2>
            <p>
              Le site Pulse Montreal est édité par :
            </p>
            <p className="mt-2">
              <strong>Pulse Montreal</strong><br />
              Montréal, Québec, Canada<br />
              Email: contact@pulse-mtl.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Directeur de publication</h2>
            <p>
              Le directeur de publication est le représentant légal de Pulse Montreal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Hébergement</h2>
            <p>
              Le site est hébergé par :
            </p>
            <p className="mt-2">
              <strong>Vercel Inc.</strong><br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, etc.) est la propriété de Pulse Montreal 
              ou de ses partenaires et est protégé par les lois sur la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Données personnelles</h2>
            <p>
              Les données personnelles collectées sur ce site sont traitées conformément à notre 
              <Link href="/politique-confidentialite" className="text-sky-400 hover:text-sky-300 underline">
                Politique de confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Responsabilité</h2>
            <p>
              Pulse Montreal s'efforce d'assurer l'exactitude des informations publiées sur le site. 
              Cependant, nous ne pouvons garantir l'exhaustivité, la précision ou l'actualité des informations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Liens externes</h2>
            <p>
              Le site peut contenir des liens vers des sites externes. Pulse Montreal n'est pas responsable 
              du contenu de ces sites externes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p>
              Pour toute question concernant les mentions légales, vous pouvez nous contacter à : 
              <a href="mailto:contact@pulse-mtl.com" className="text-sky-400 hover:text-sky-300 underline ml-1">
                contact@pulse-mtl.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/cgu"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Conditions générales d'utilisation
          </Link>
          <Link
            href="/politique-confidentialite"
            className="px-4 py-2 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
}

