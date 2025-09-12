'use client';

import { useEffect, useState } from 'react';
import AppWrapper from './AppWrapper';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fonction de nettoyage des attributs d'extensions
    const cleanExtensionAttributes = () => {
      if (typeof document !== 'undefined') {
        const body = document.body;
        if (body) {
          const problematicAttributes = [
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded',
            'data-gr-ext-installed',
            'data-gramm',
            'data-gramm_editor',
            'data-enable-grammarly'
          ];
          
          problematicAttributes.forEach(attr => {
            if (body.hasAttribute(attr)) {
              body.removeAttribute(attr);
            }
          });
        }
      }
    };

    // Nettoyage immédiat
    cleanExtensionAttributes();
    
    // Nettoyage continu toutes les 500ms
    const interval = setInterval(cleanExtensionAttributes, 500);

    // Marquer comme monté immédiatement
    setMounted(true);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Afficher le contenu immédiatement
  return (
    <AppWrapper>
      {children}
    </AppWrapper>
  );
}
