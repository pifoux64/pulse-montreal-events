'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import { 
  Building2, 
  Plus, 
  Edit, 
  Calendar, 
  Eye, 
  Heart, 
  MapPin,
  Phone,
  Globe,
  Mail,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Inbox
} from 'lucide-react';
import VenueRequestsList from '@/components/VenueRequestsList';
import VenueAITools from '@/components/ai/VenueAITools';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Venue {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  capacity: number | null;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lon: number;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  contactEmail: string | null;
  types: string[];
  tags: string[];
  _count: {
    events: number;
    requests: number;
  };
  events: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string | null;
  }>;
}

interface Stats {
  totalEvents: number;
  upcomingEvents: number;
  totalViews: number;
  totalFavorites: number;
  viewsLast30Days: number;
  favoritesLast30Days: number;
}

export default function VenueDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    address: '',
    city: 'Montréal',
    postalCode: '',
    lat: '',
    lon: '',
    neighborhood: '',
    phone: '',
    website: '',
    contactEmail: '',
    types: [] as string[],
    tags: [] as string[],
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const venueTypes = ['bar', 'club', 'salle', 'centre_culturel', 'restaurant', 'café', 'théâtre', 'autre'];

  // Normalise une URL en ajoutant https:// si le protocole est manquant
  const normalizeUrl = (value: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/venue/dashboard');
    } else if (status === 'authenticated') {
      loadVenues();
    }
  }, [status, router]);

  useEffect(() => {
    // Afficher l'onboarding si l'utilisateur n'a pas de venues
    if (venues.length === 0 && !isLoading && status === 'authenticated') {
      setShowOnboarding(true);
    }
  }, [venues.length, isLoading, status]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/venues/me');
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des venues');
      }
      const data = await res.json();
      setVenues(data.venues || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (venueId: string) => {
    try {
      const res = await fetch(`/api/venues/${venueId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    }
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    loadStats(venue.id);
    setShowForm(false);
  };

  const handleNewVenue = () => {
    setSelectedVenue(null);
    setFormData({
      name: '',
      description: '',
      capacity: '',
      address: '',
      city: 'Montréal',
      postalCode: '',
      lat: '',
      lon: '',
      neighborhood: '',
      phone: '',
      website: '',
      contactEmail: '',
      types: [],
      tags: [],
    });
    setShowForm(true);
    setStats(null);
  };

  const handleEditVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description || '',
      capacity: venue.capacity?.toString() || '',
      address: venue.address,
      city: venue.city,
      postalCode: venue.postalCode,
      lat: venue.lat.toString(),
      lon: venue.lon.toString(),
      neighborhood: venue.neighborhood || '',
      phone: venue.phone || '',
      website: venue.website || '',
      contactEmail: venue.contactEmail || '',
      types: venue.types || [],
      tags: venue.tags || [],
    });
    setShowForm(true);
  };

  const handleGeocode = async () => {
    if (!formData.address || !formData.city) {
      alert('Veuillez remplir au moins l\'adresse et la ville');
      return;
    }

    try {
      const query = `${formData.address}, ${formData.city}, ${formData.postalCode}`;
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) {
          setFormData({
            ...formData,
            lat: data.lat.toString(),
            lon: data.lon.toString(),
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors du géocodage:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = selectedVenue 
        ? `/api/venues/${selectedVenue.id}`
        : '/api/venues';
      
      const method = selectedVenue ? 'PATCH' : 'POST';

      // Normaliser l'URL du site web si fournie
      const normalizedWebsite = formData.website ? normalizeUrl(formData.website) : null;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: normalizedWebsite,
          capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
          lat: parseFloat(formData.lat) || 0,
          lon: parseFloat(formData.lon) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      await loadVenues();
      setShowForm(false);
      setSelectedVenue(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <ModernLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Bienvenue sur le Dashboard Salle
              </h2>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {onboardingStep === 1 && (
              <div>
                <div className="mb-6">
                  <Building2 className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    Créez votre première salle
                  </h3>
                  <p className="text-slate-300 text-center">
                    Ajoutez votre salle, bar, club ou lieu culturel sur Pulse pour être visible par les organisateurs et le public.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="px-6 py-3 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Passer
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <div className="mb-6">
                  <MapPin className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    Remplissez les informations
                  </h3>
                  <p className="text-slate-300 text-center">
                    Nom, adresse, capacité, types d'événements... Toutes les informations qui aideront les organisateurs à vous trouver.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setOnboardingStep(3)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="px-6 py-3 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Précédent
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div>
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    C'est parti !
                  </h3>
                  <p className="text-slate-300 text-center">
                    Une fois votre salle créée, vous pourrez voir les statistiques, gérer les demandes de réservation et suivre vos événements.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowOnboarding(false);
                      handleNewVenue();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all"
                  >
                    Créer ma salle
                  </button>
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="px-6 py-3 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Précédent
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Dashboard Salle
              </h1>
              <p className="text-slate-300">
                Gérez vos salles et consultez vos statistiques
              </p>
            </div>
            <button
              onClick={handleNewVenue}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle salle
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des venues */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Mes salles</h2>
              {venues.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Aucune salle enregistrée. Créez votre première salle !
                </p>
              ) : (
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => handleSelectVenue(venue)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedVenue?.id === venue.id
                          ? 'bg-sky-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold">{venue.name}</div>
                      <div className="text-sm opacity-75 mt-1">
                        {venue._count.events} événement{venue._count.events > 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {showForm ? (
              /* Formulaire */
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedVenue ? 'Modifier la salle' : 'Nouvelle salle'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedVenue(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nom de la salle *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Ex: Le Belmont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Décrivez votre salle..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Capacité
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Quartier
                      </label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Ex: Plateau-Mont-Royal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="1234 Rue Example"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="H2X 1Y4"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleGeocode}
                        className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                      >
                        Géocoder
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.lon}
                        onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Site web
                      </label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        onBlur={(e) => {
                          // Normaliser l'URL lors de la perte de focus pour une meilleure UX
                          if (e.target.value.trim()) {
                            setFormData({ ...formData, website: normalizeUrl(e.target.value) });
                          }
                        }}
                        placeholder="leministere.ca ou https://leministere.ca"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email de contact
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Types de salle
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {venueTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const newTypes = formData.types.includes(type)
                              ? formData.types.filter(t => t !== type)
                              : [...formData.types, type];
                            setFormData({ ...formData, types: newTypes });
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${
                            formData.types.includes(type)
                              ? 'bg-sky-600 text-white'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enregistrement...' : selectedVenue ? 'Mettre à jour' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedVenue(null);
                      }}
                      className="px-6 py-3 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedVenue ? (
              /* Détails de la venue sélectionnée */
              <div className="space-y-6">
                {/* Informations */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedVenue.name}</h2>
                      {selectedVenue.slug && (
                        <Link
                          href={`/salle/${selectedVenue.slug}`}
                          target="_blank"
                          className="text-sm text-sky-400 hover:text-sky-300"
                        >
                          Voir la page publique →
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditVenue(selectedVenue)}
                      className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                  </div>

                  {selectedVenue.description && (
                    <p className="text-slate-300 mb-4">{selectedVenue.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4" />
                      {selectedVenue.address}, {selectedVenue.city}
                    </div>
                    {selectedVenue.capacity && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4" />
                        {selectedVenue.capacity.toLocaleString('fr-CA')} personnes
                      </div>
                    )}
                    {selectedVenue.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4" />
                        {selectedVenue.phone}
                      </div>
                    )}
                    {selectedVenue.website && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Globe className="w-4 h-4" />
                        <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                          Site web
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedVenue.types.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedVenue.types.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 bg-sky-600/30 text-sky-300 rounded-full text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                {stats && (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Statistiques</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
                        <div className="text-sm text-slate-400">Événements total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.upcomingEvents}</div>
                        <div className="text-sm text-slate-400">À venir</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString('fr-CA')}</div>
                        <div className="text-sm text-slate-400">Vues total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.viewsLast30Days.toLocaleString('fr-CA')}</div>
                        <div className="text-sm text-slate-400">Vues (30j)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalFavorites.toLocaleString('fr-CA')}</div>
                        <div className="text-sm text-slate-400">Favoris total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.favoritesLast30Days.toLocaleString('fr-CA')}</div>
                        <div className="text-sm text-slate-400">Favoris (30j)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendrier des événements */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Événements à venir
                  </h3>
                  {selectedVenue.events.length === 0 ? (
                    <p className="text-slate-400">Aucun événement à venir</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedVenue.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/evenement/${event.id}`}
                          className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="font-semibold text-white">{event.title}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            {format(new Date(event.startAt), 'PPP', { locale: fr })}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outils IA */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <VenueAITools venueId={selectedVenue.id} />
                </div>

                {/* Demandes de réservation */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Inbox className="w-5 h-5" />
                    Demandes de réservation
                    {selectedVenue._count.requests > 0 && (
                      <span className="ml-2 px-2 py-1 bg-sky-600 text-white text-sm rounded-full">
                        {selectedVenue._count.requests}
                      </span>
                    )}
                  </h3>
                  <VenueRequestsList venueId={selectedVenue.id} />
                </div>

                {/* Gestion d'abonnement */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <SubscriptionManager type="venue" venueId={selectedVenue.id} />
                </div>
              </div>
            ) : (
              /* Message si aucune venue sélectionnée */
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 text-lg mb-2">
                  {venues.length === 0 
                    ? 'Créez votre première salle pour commencer'
                    : 'Sélectionnez une salle pour voir les détails'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
