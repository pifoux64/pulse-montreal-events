'use client';

import { useState } from 'react';
import { EventFormData, EventCategory } from '@/types';
import Navigation from '@/components/Navigation';
import EventForm from '@/components/EventForm';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';

// Données de test pour les catégories
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#e74c3c',
    subCategories: [
      { id: '1-1', name: 'Reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-2', name: 'Jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-3', name: 'Rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-4', name: 'Électronique', nameEn: 'Electronic', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Art & Culture',
    nameEn: 'Art & Culture',
    icon: '🎨',
    color: '#9b59b6',
    subCategories: [
      { id: '2-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: '2' },
      { id: '2-2', name: 'Théâtre', nameEn: 'Theater', categoryId: '2' },
      { id: '2-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Sport',
    nameEn: 'Sports',
    icon: '⚽',
    color: '#3498db',
    subCategories: [
      { id: '3-1', name: 'Football', nameEn: 'Soccer', categoryId: '3' },
      { id: '3-2', name: 'Basketball', nameEn: 'Basketball', categoryId: '3' },
      { id: '3-3', name: 'Course', nameEn: 'Running', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Famille',
    nameEn: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f39c12',
    subCategories: [
      { id: '4-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: '4' },
      { id: '4-2', name: 'Parcs', nameEn: 'Parks', categoryId: '4' },
      { id: '4-3', name: 'Éducation', nameEn: 'Education', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Gastronomie',
    nameEn: 'Food & Drink',
    icon: '🍽️',
    color: '#e67e22',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
    ]
  }
];

export default function PublierPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Simulation d'une soumission API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Données de l\'événement:', data);
      
      // TODO: Implémenter l'appel API réel vers Supabase
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      
      setSubmitStatus('success');
      setSubmitMessage('Votre événement a été publié avec succès ! Il sera visible dans quelques minutes.');
      
      // Redirection après 3 secondes
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      setSubmitStatus('error');
      setSubmitMessage('Une erreur est survenue lors de la publication. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.')) {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Publier un événement
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Partagez votre événement avec la communauté montréalaise. Remplissez le formulaire ci-dessous pour le publier.
          </p>
        </div>

        {/* Message de statut */}
        {submitStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            submitStatus === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {submitStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">{submitMessage}</span>
            </div>
          </div>
        )}

        {/* Guide de publication */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Conseils pour une publication réussie
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Rédigez un titre clair et accrocheur</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Ajoutez une description détaillée avec les informations pratiques</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Utilisez des tags pertinents pour améliorer la visibilité</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Précisez les informations d'accessibilité si applicable</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Ajoutez des filtres personnalisés pour aider les utilisateurs à trouver votre événement</span>
            </li>
          </ul>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EventForm
            categories={mockCategories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Questions fréquentes
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Combien de temps faut-il pour qu'un événement soit visible ?
              </h4>
              <p className="text-gray-600">
                Les événements sont généralement visibles dans les 5 minutes suivant leur publication. 
                Notre équipe vérifie le contenu pour assurer la qualité.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Puis-je modifier un événement après publication ?
              </h4>
              <p className="text-gray-600">
                Oui, vous pouvez modifier vos événements à tout moment depuis votre tableau de bord organisateur.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Comment ajouter des filtres personnalisés ?
              </h4>
              <p className="text-gray-600">
                Utilisez la section "Filtres personnalisés" pour créer des critères spécifiques à votre événement, 
                comme "tenue blanche obligatoire" ou "repas inclus".
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
