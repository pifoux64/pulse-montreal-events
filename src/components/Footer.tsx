import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950/70 backdrop-blur-xl border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-white font-semibold mb-4">À propos</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-sky-400 transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-sky-400 transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/carte" className="hover:text-sky-400 transition-colors">
                  Carte
                </Link>
              </li>
              <li>
                <Link href="/calendrier" className="hover:text-sky-400 transition-colors">
                  Calendrier
                </Link>
              </li>
              <li>
                <Link href="/publier" className="hover:text-sky-400 transition-colors">
                  Publier un événement
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/mentions-legales" className="hover:text-sky-400 transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-sky-400 transition-colors">
                  Conditions générales d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="hover:text-sky-400 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <a href="mailto:contact@pulse-mtl.com" className="hover:text-sky-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="mailto:support@pulse-mtl.com" className="hover:text-sky-400 transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-400 transition-colors">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Pulse Montreal. Tous droits réservés.
          </p>
          <p className="text-slate-400 text-sm mt-4 md:mt-0 flex items-center gap-1">
            Fait avec <Heart className="w-4 h-4 text-red-500 fill-current" /> à Montréal
          </p>
        </div>
      </div>
    </footer>
  );
}

