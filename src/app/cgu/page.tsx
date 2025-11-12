import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation - Pulse Montreal',
  description: 'Conditions générales d\'utilisation de Pulse Montreal',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-4xl font-bold text-white mb-8">Conditions générales d'utilisation</h1>
        
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10 space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation du site Pulse Montreal 
              et de ses services. En accédant au site, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Acceptation des conditions</h2>
            <p>
              L'utilisation du site implique l'acceptation pleine et entière des présentes CGU. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Utilisation du site</h2>
            <p>
              Vous vous engagez à utiliser le site de manière conforme à la loi et aux présentes CGU. 
              Il est interdit d'utiliser le site pour :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Publier du contenu illégal, offensant ou diffamatoire</li>
              <li>Violer les droits de propriété intellectuelle</li>
              <li>Transmettre des virus ou codes malveillants</li>
              <li>Tenter d'accéder de manière non autorisée au site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Compte utilisateur</h2>
            <p>
              Pour publier des événements, vous devez créer un compte organisateur. Vous êtes responsable 
              de la confidentialité de vos identifiants et de toutes les activités effectuées avec votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contenu publié</h2>
            <p>
              En publiant un événement, vous garantissez que vous disposez des droits nécessaires et que 
              le contenu est exact et conforme à la loi. Pulse Montreal se réserve le droit de modérer 
              ou supprimer tout contenu non conforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Propriété intellectuelle</h2>
            <p>
              Tous les éléments du site (textes, images, logos, etc.) sont protégés par le droit d'auteur. 
              Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation de responsabilité</h2>
            <p>
              Pulse Montreal ne peut être tenu responsable des dommages directs ou indirects résultant 
              de l'utilisation du site ou de l'impossibilité de l'utiliser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Modification des CGU</h2>
            <p>
              Pulse Montreal se réserve le droit de modifier les présentes CGU à tout moment. 
              Les modifications prennent effet dès leur publication sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit québécois et canadien. 
              Tout litige sera soumis aux tribunaux compétents de Montréal, Québec.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              Pour toute question concernant les CGU, contactez-nous à : 
              <a href="mailto:contact@pulse-mtl.com" className="text-sky-400 hover:text-sky-300 underline ml-1">
                contact@pulse-mtl.com
              </a>
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

