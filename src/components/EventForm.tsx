'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, MapPin, Calendar, DollarSign, Users, Accessibility, Tag, Image as ImageIcon } from 'lucide-react';
import { EventFormData, EventCategory, CustomFilter } from '@/types';

// Schéma de validation avec Zod
const eventFormSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  location: z.object({
    name: z.string().min(1, 'Le nom du lieu est requis'),
    address: z.string().min(1, 'L\'adresse est requise'),
    city: z.string().min(1, 'La ville est requise'),
    postalCode: z.string().min(1, 'Le code postal est requis'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
  category: z.string().min(1, 'La catégorie est requise'),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).min(1, 'Au moins un tag est requis'),
  price: z.object({
    amount: z.number().min(0, 'Le prix ne peut pas être négatif'),
    currency: z.string().min(1, 'La devise est requise'),
    isFree: z.boolean(),
  }),
  imageUrl: z.string().url('URL d\'image invalide').optional().or(z.literal('')),
  ticketUrl: z.string().url('URL de billetterie invalide').optional().or(z.literal('')),
  customFilters: z.array(z.object({
    name: z.string().min(1, 'Le nom du filtre est requis'),
    value: z.string().min(1, 'La valeur du filtre est requise'),
    type: z.enum(['text', 'boolean', 'select', 'number']),
    options: z.array(z.string()).optional(),
    isRequired: z.boolean(),
  })),
  accessibility: z.object({
    wheelchairAccessible: z.boolean(),
    hearingAssistance: z.boolean(),
    visualAssistance: z.boolean(),
    quietSpace: z.boolean(),
    genderNeutralBathrooms: z.boolean(),
    other: z.array(z.string()),
  }),
  targetAudience: z.array(z.string()).min(1, 'Au moins un public cible est requis'),
  maxCapacity: z.number().min(1, 'La capacité doit être supérieure à 0').optional(),
});

type EventFormSchema = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  categories: EventCategory[];
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  initialData?: Partial<EventFormData>;
  isEditing?: boolean;
}

const EventForm = ({ 
  categories, 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false 
}: EventFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newCustomFilter, setNewCustomFilter] = useState<Partial<CustomFilter>>({});

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<EventFormSchema>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      location: initialData?.location || {
        name: '',
        address: '',
        city: 'Montréal',
        postalCode: '',
        coordinates: { lat: 45.5017, lng: -73.5673 },
      },
      category: initialData?.category || '',
      subCategory: initialData?.subCategory || '',
      tags: initialData?.tags || [],
      price: initialData?.price || {
        amount: 0,
        currency: 'CAD',
        isFree: false,
      },
      imageUrl: initialData?.imageUrl || '',
      ticketUrl: initialData?.ticketUrl || '',
      customFilters: initialData?.customFilters || [],
      accessibility: initialData?.accessibility || {
        wheelchairAccessible: false,
        hearingAssistance: false,
        visualAssistance: false,
        quietSpace: false,
        genderNeutralBathrooms: false,
        other: [],
      },
      targetAudience: initialData?.targetAudience || ['Adulte'],
      maxCapacity: initialData?.maxCapacity || undefined,
    },
  });

  const watchedCategory = watch('category');
  const watchedPrice = watch('price');
  const watchedTags = watch('tags');

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomFilter = () => {
    if (newCustomFilter.name && newCustomFilter.type) {
      const filter: CustomFilter = {
        name: newCustomFilter.name,
        value: newCustomFilter.value || '',
        type: newCustomFilter.type as 'text' | 'boolean' | 'select' | 'number',
        options: newCustomFilter.options || [],
        isRequired: newCustomFilter.isRequired || false,
        eventId: '', // Sera défini lors de la création
      };

      const currentFilters = watch('customFilters');
      setValue('customFilters', [...currentFilters, filter]);
      setNewCustomFilter({});
    }
  };

  const handleRemoveCustomFilter = (index: number) => {
    const currentFilters = watch('customFilters');
    setValue('customFilters', currentFilters.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: EventFormSchema) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubCategories = () => {
    const category = categories.find(cat => cat.id === watchedCategory);
    return category?.subCategories || [];
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Informations de base */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de l'événement *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Festival Reggae Montréal 2024"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {watchedCategory && getSubCategories().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sous-catégorie
              </label>
              <Controller
                name="subCategory"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez une sous-catégorie</option>
                    {getSubCategories().map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez votre événement en détail..."
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates et horaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Dates et horaires</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure de début *
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure de fin *
            </label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span>Localisation</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du lieu *
            </label>
            <Controller
              name="location.name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Parc Jean-Drapeau"
                />
              )}
            />
            {errors.location?.name && (
              <p className="mt-1 text-sm text-red-600">{errors.location.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville *
            </label>
            <Controller
              name="location.city"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Montréal"
                />
              )}
            />
            {errors.location?.city && (
              <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète *
            </label>
            <Controller
              name="location.address"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1 Circuit Gilles Villeneuve"
                />
              )}
            />
            {errors.location?.address && (
              <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal *
            </label>
            <Controller
              name="location.postalCode"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: H3C 1A9"
                />
              )}
            />
            {errors.location?.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.location.postalCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coordonnées GPS
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="location.coordinates.lat"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Latitude"
                  />
                )}
              />
              <Controller
                name="location.coordinates.lng"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Longitude"
                  />
                )}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Laissez vide pour la détection automatique
            </p>
          </div>
        </div>
      </div>

      {/* Prix et billetterie */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span>Prix et billetterie</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Controller
              name="price.isFree"
              control={control}
              render={({ field }) => (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Événement gratuit</span>
                </label>
              )}
            />
          </div>

          {!watchedPrice.isFree && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix *
                </label>
                <Controller
                  name="price.amount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  )}
                />
                {errors.price?.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise *
                </label>
                <Controller
                  name="price.currency"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="CAD">CAD (Dollar canadien)</option>
                      <option value="USD">USD (Dollar américain)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  )}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien de billetterie
            </label>
            <Controller
              name="ticketUrl"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/tickets"
                />
              )}
            />
            {errors.ticketUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.ticketUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tags et catégorisation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Tag className="w-5 h-5 text-blue-600" />
          <span>Tags et catégorisation</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags *
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ajouter un tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Ajouter
              </button>
            </div>
            
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Public cible et capacité */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Public cible et capacité</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public cible *
            </label>
            <Controller
              name="targetAudience"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Adulte', 'Famille', 'Étudiant', 'Senior', 'Enfant'].map((audience) => (
                    <label key={audience} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value.includes(audience)}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...field.value, audience]
                            : field.value.filter(a => a !== audience);
                          field.onChange(newValue);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{audience}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.targetAudience && (
              <p className="mt-1 text-sm text-red-600">{errors.targetAudience.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacité maximale
            </label>
            <Controller
              name="maxCapacity"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1000"
                />
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              Laissez vide si illimité
            </p>
          </div>
        </div>
      </div>

      {/* Accessibilité */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Accessibility className="w-5 h-5 text-blue-600" />
          <span>Accessibilité</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'wheelchairAccessible', label: 'Accessible en fauteuil roulant' },
            { key: 'hearingAssistance', label: 'Assistance auditive disponible' },
            { key: 'visualAssistance', label: 'Assistance visuelle disponible' },
            { key: 'quietSpace', label: 'Espace calme disponible' },
            { key: 'genderNeutralBathrooms', label: 'Toilettes neutres disponibles' },
          ].map((item) => (
            <Controller
              key={item.key}
              name={`accessibility.${item.key}`}
              control={control}
              render={({ field }) => (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              )}
            />
          ))}
        </div>
      </div>

      {/* Filtres personnalisés */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtres personnalisés</h3>
          <button
            type="button"
            onClick={() => setShowCustomFilters(!showCustomFilters)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showCustomFilters ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showCustomFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newCustomFilter.name || ''}
                onChange={(e) => setNewCustomFilter({ ...newCustomFilter, name: e.target.value })}
                placeholder="Nom du filtre"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={newCustomFilter.type || ''}
                onChange={(e) => setNewCustomFilter({ ...newCustomFilter, type: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Type de filtre</option>
                <option value="text">Texte</option>
                <option value="boolean">Oui/Non</option>
                <option value="select">Sélection</option>
                <option value="number">Nombre</option>
              </select>
              
              <button
                type="button"
                onClick={handleAddCustomFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            {watch('customFilters').length > 0 && (
              <div className="space-y-2">
                {watch('customFilters').map((filter, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{filter.name}</span>
                      <span className="text-sm text-gray-500">({filter.type})</span>
                      {filter.isRequired && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Requis
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFilter(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Annuler
        </button>
        
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Publier l\'événement')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
