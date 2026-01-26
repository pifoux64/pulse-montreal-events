'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Plus, X, MapPin, Calendar, DollarSign, Users, Accessibility, Tag, Image as ImageIcon, Facebook, Loader2, Ticket, Upload } from 'lucide-react';
import { EventFormData, EventCategory, CustomFilter } from '@/types';
import { normalizeUrl } from '@/lib/utils';

// Fonction pour créer le schéma de validation avec traductions
const createEventFormSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(3, t('validation.titleMin')),
  description: z.string().min(20, t('validation.descriptionMin')),
  longDescription: z.string().optional(), // SPRINT 4: Description longue optionnelle
  lineup: z.array(z.string()).optional(), // SPRINT 4: Lineup optionnel
  startDate: z.string().min(1, t('validation.startDateRequired')),
  endDate: z.string().min(1, t('validation.endDateRequired')),
  location: z.object({
    name: z.string().min(1, t('validation.venueNameRequired')),
    address: z.string().min(1, t('validation.addressRequired')),
    city: z.string().min(1, t('validation.cityRequired')),
    postalCode: z.string().min(1, t('validation.postalCodeRequired')),
  }),
  category: z.string().min(1, t('validation.categoryRequired')),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).min(1, t('validation.tagsMin')),
  price: z.object({
    amount: z.number().min(0, t('validation.priceNegative')),
    currency: z.string().min(1, t('validation.currencyRequired')),
    isFree: z.boolean(),
  }),
  imageUrl: z.string()
    .min(1, t('validation.imageRequired'))
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => val && /^https?:\/\/.+/.test(val), t('validation.imageUrlInvalid')),
  ticketUrl: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), t('validation.ticketUrlInvalid'))
    .optional()
    .or(z.literal('')),
  customFilters: z.array(z.object({
    name: z.string().min(1, t('validation.filterNameRequired')),
    value: z.string().min(1, t('validation.filterValueRequired')),
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
  targetAudience: z.array(z.string()).min(1, t('validation.targetAudienceMin')),
  maxCapacity: z.number().min(1, t('validation.capacityMin')).optional(),
});

type EventFormSchema = z.infer<ReturnType<typeof createEventFormSchema>>;

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
  const t = useTranslations('publish');
  const eventFormSchema = createEventFormSchema(t);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newCustomFilter, setNewCustomFilter] = useState<Partial<CustomFilter>>({});
  const [facebookUrl, setFacebookUrl] = useState('');
  const [isImportingFacebook, setIsImportingFacebook] = useState(false);
  const [facebookImportError, setFacebookImportError] = useState<string | null>(null);
  const [eventbriteUrl, setEventbriteUrl] = useState('');
  const [isImportingEventbrite, setIsImportingEventbrite] = useState(false);
  const [eventbriteImportError, setEventbriteImportError] = useState<string | null>(null);
  const [genericUrl, setGenericUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [urlImportError, setUrlImportError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

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
      longDescription: initialData?.longDescription || '',
      lineup: initialData?.lineup || [],
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      location: initialData?.location || {
        name: '',
        address: '',
        city: 'Montréal',
        postalCode: '',
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
  const watchedImageUrl = watch('imageUrl');

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
      // Ajouter sourceUrl si disponible
      const formDataWithSource = {
        ...data,
        sourceUrl: sourceUrl || undefined,
      };
      await onSubmit(formDataWithSource as EventFormData);
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

  const fillFormWithImportedData = (importedData: any, sourceUrl?: string) => {
    // Pré-remplir le formulaire avec les données importées
    if (importedData.title) setValue('title', importedData.title);
    if (importedData.description) setValue('description', importedData.description);
    if (importedData.longDescription) setValue('longDescription', importedData.longDescription);
    if (importedData.startDate) {
      const startDate = new Date(importedData.startDate);
      // Format datetime-local: YYYY-MM-DDTHH:mm
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      setValue('startDate', `${year}-${month}-${day}T${hours}:${minutes}`);
    }
    if (importedData.endDate) {
      const endDate = new Date(importedData.endDate);
      // Format datetime-local: YYYY-MM-DDTHH:mm
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      setValue('endDate', `${year}-${month}-${day}T${hours}:${minutes}`);
    }
    if (importedData.location) {
      setValue('location', {
        name: importedData.location.name || '',
        address: importedData.location.address || '',
        city: importedData.location.city || 'Montréal',
        postalCode: importedData.location.postalCode || '',
      });
    }
    // Si venueName est fourni mais pas location.name, l'utiliser
    if (importedData.venueName && !importedData.location?.name) {
      const currentLocation = watch('location');
      setValue('location', {
        ...currentLocation,
        name: importedData.venueName,
      });
    }
    if (importedData.imageUrl) setValue('imageUrl', importedData.imageUrl);
    if (importedData.ticketUrl) setValue('ticketUrl', importedData.ticketUrl);
    // Si sourceUrl est fourni et pas de ticketUrl, l'utiliser comme ticketUrl
    if (sourceUrl && !importedData.ticketUrl) {
      setValue('ticketUrl', sourceUrl);
    }
    if (importedData.price) {
      setValue('price', {
        amount: importedData.price.amount || 0,
        currency: importedData.price.currency || 'CAD',
        isFree: importedData.price.isFree !== false,
      });
    }
  };

  const handleImportFacebook = async () => {
    if (!facebookUrl.trim()) {
      setFacebookImportError(t('import.enterFacebookUrl'));
      return;
    }

    setIsImportingFacebook(true);
    setFacebookImportError(null);

    try {
      const response = await fetch('/api/events/import-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: facebookUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('import.importError'));
      }

      const result = await response.json();
      fillFormWithImportedData(result.data);

      // Réinitialiser l'URL après import réussi
      setFacebookUrl('');
    } catch (error: any) {
      console.error('Erreur import Facebook:', error);
      setFacebookImportError(error.message || t('import.importErrorFacebook'));
    } finally {
      setIsImportingFacebook(false);
    }
  };

  const handleImportUrl = async () => {
    if (!genericUrl.trim()) {
      setUrlImportError(t('import.enterUrl'));
      return;
    }

    setIsImportingUrl(true);
    setUrlImportError(null);

    try {
      const response = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: genericUrl.trim() }),
      });

      const result = await response.json();

      // Si la réponse n'est pas OK ou si success est false
      if (!response.ok || !result.success) {
        const errorMessage = result.error || t('import.importError');
        const suggestion = result.suggestion || 'Veuillez copier manuellement les informations.';
        throw new Error(`${errorMessage}${suggestion ? ` ${suggestion}` : ''}`);
      }

      fillFormWithImportedData(result.data, genericUrl.trim());
      
      // Stocker l'URL source pour l'envoyer lors de la création
      setSourceUrl(genericUrl.trim());

      // Réinitialiser l'URL après import réussi
      setGenericUrl('');
    } catch (error: any) {
      console.error('Erreur import URL:', error);
      setUrlImportError(error.message || t('import.importErrorUrl'));
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleImportEventbrite = async () => {
    if (!eventbriteUrl.trim()) {
      setEventbriteImportError(t('import.enterEventbriteUrl'));
      return;
    }

    setIsImportingEventbrite(true);
    setEventbriteImportError(null);

    try {
      const response = await fetch('/api/events/import-eventbrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: eventbriteUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('import.importError'));
      }

      const result = await response.json();
      fillFormWithImportedData(result.data);

      // Réinitialiser l'URL après import réussi
      setEventbriteUrl('');
    } catch (error: any) {
      console.error('Erreur import Eventbrite:', error);
      setEventbriteImportError(error.message || t('import.importErrorEventbrite'));
    } finally {
      setIsImportingEventbrite(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Import depuis URL générique */}
      <div className="space-y-4">
        {/* Import URL générique */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('pasteEventLink')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('import.pasteGenericUrl')}
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={genericUrl}
              onChange={(e) => setGenericUrl(e.target.value)}
              placeholder={t('pasteEventLinkPlaceholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isImportingUrl}
            />
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={isImportingUrl || !genericUrl.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isImportingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
          {urlImportError && (
            <div className="mt-2">
              <p className="text-sm text-red-600">{urlImportError}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('manualCopyRequired')}
              </p>
            </div>
          )}
        </div>

        {/* Import depuis Facebook et Eventbrite */}
        <div className="space-y-4">
          {/* Import Facebook */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Facebook className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('importFromFacebook')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('import.pasteFacebookUrl')}
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/events/..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImportingFacebook}
            />
            <button
              type="button"
              onClick={handleImportFacebook}
              disabled={isImportingFacebook || !facebookUrl.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isImportingFacebook ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Facebook className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
          {facebookImportError && (
            <p className="mt-2 text-sm text-red-600">{facebookImportError}</p>
          )}
        </div>

        {/* Import Eventbrite */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Ticket className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('importFromEventbrite')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('import.pasteEventbriteUrl')}
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={eventbriteUrl}
              onChange={(e) => setEventbriteUrl(e.target.value)}
              placeholder="https://www.eventbrite.com/e/..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isImportingEventbrite}
            />
            <button
              type="button"
              onClick={handleImportEventbrite}
              disabled={isImportingEventbrite || !eventbriteUrl.trim()}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isImportingEventbrite ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
          {eventbriteImportError && (
            <p className="mt-2 text-sm text-red-600">{eventbriteImportError}</p>
          )}
        </div>
        </div>
      </div>

      {/* Informations de base */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('basicInfo')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('eventTitle')} *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('eventTitlePlaceholder')}
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
                  <option value="">{t('selectCategory')}</option>
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
                {t('subCategory')}
              </label>
              <Controller
                name="subCategory"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('selectSubCategory')}</option>
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
              {t('description')} *
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

          {/* SPRINT 4: Description longue pour Facebook/Eventbrite */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('longDescription')} <span className="text-gray-500">{t('optional')}</span>
            </label>
            <Controller
              name="longDescription"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('longDescriptionPlaceholder')}
                />
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('longDescriptionHelp')}
            </p>
          </div>

          {/* SPRINT 4: Lineup (artistes) pour RA/Bandsintown */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('lineup')} <span className="text-gray-500">{t('optional')}</span>
            </label>
            <Controller
              name="lineup"
              control={control}
              render={({ field }) => {
                const lineup = field.value || [];
                return (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            e.preventDefault();
                            field.onChange([...lineup, newTag.trim()]);
                            setNewTag('');
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('addArtist')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTag.trim()) {
                            field.onChange([...lineup, newTag.trim()]);
                            setNewTag('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {lineup.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {lineup.map((artist, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {artist}
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(lineup.filter((_, i) => i !== index));
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Liste des artistes qui se produiront. Requis pour Resident Advisor et Bandsintown.
                    </p>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Image de l'événement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <span>{t('imageTitle')}</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('imageLabel')} <span className="text-red-500">*</span>
            </label>
            
            {/* Upload de fichier */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 mb-2 text-blue-600 animate-spin" />
                      <p className="text-sm text-gray-600">{t('uploading')}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">{t('clickToUpload')}</span> {t('orDragDrop')}
                      </p>
                      <p className="text-xs text-gray-500">{t('imageRequirements')}</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setIsUploadingImage(true);
                    setImageUploadError(null);

                    try {
                      // Valider la taille du fichier (5MB max)
                      const MAX_SIZE = 5 * 1024 * 1024;
                      if (file.size > MAX_SIZE) {
                        throw new Error(t('imageTooLarge', { maxSize: '5MB' }));
                      }

                      // Valider les dimensions
                      const img = new Image();
                      const url = URL.createObjectURL(file);
                      
                      await new Promise<void>((resolve, reject) => {
                        img.onload = () => {
                          URL.revokeObjectURL(url);
                          const MIN_WIDTH = 400;
                          const MIN_HEIGHT = 300;
                          const MAX_WIDTH = 4000;
                          const MAX_HEIGHT = 4000;
                          
                          if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
                            reject(new Error(t('imageTooSmall', { minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT, width: img.width, height: img.height })));
                            return;
                          }
                          
                          if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
                            reject(new Error(t('imageTooBig', { maxWidth: MAX_WIDTH, maxHeight: MAX_HEIGHT, width: img.width, height: img.height })));
                            return;
                          }
                          
                          resolve();
                        };
                        
                        img.onerror = () => {
                          URL.revokeObjectURL(url);
                          reject(new Error(t('imageInvalid')));
                        };
                        
                        img.src = url;
                      });

                      const formData = new FormData();
                      formData.append('file', file);

                      const response = await fetch('/api/upload/image', {
                        method: 'POST',
                        body: formData,
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || t('uploadError'));
                      }

                      const data = await response.json();
                      setValue('imageUrl', data.url);
                    } catch (error: any) {
                      console.error('Erreur upload:', error);
                      setImageUploadError(error.message || t('uploadError'));
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }}
                />
              </label>
              {imageUploadError && (
                <p className="mt-2 text-sm text-red-600">{imageUploadError}</p>
              )}
            </div>

            {/* Ou URL en fallback */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('or')}</span>
              </div>
            </div>

            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <div className="space-y-3 mt-4">
                  <input
                    {...field}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('imageUrlPlaceholder')}
                  />
                  {errors.imageUrl && (
                    <p className="text-sm text-red-600">{errors.imageUrl.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {t('imageUrlHelp')}
                  </p>
                </div>
              )}
            />
          </div>

          {/* Aperçu de l'image */}
          {watchedImageUrl && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preview')}
              </label>
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={watchedImageUrl}
                  alt={t('imagePreviewAlt')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400"><p>${t('imageLoadError')}</p></div>`;
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setValue('imageUrl', '')}
                className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                {t('removeImage')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dates et horaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>{t('datesAndTimes')}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('startDate')} *
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
          <span>{t('location')}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('venueName')} *
            </label>
            <Controller
              name="location.name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('venueNamePlaceholder')}
                />
              )}
            />
            {errors.location?.name && (
              <p className="mt-1 text-sm text-red-600">{errors.location.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('city')} *
            </label>
            <Controller
              name="location.city"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('cityPlaceholder')}
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
                  placeholder={t('addressPlaceholder')}
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
                  placeholder={t('postalCodePlaceholder')}
                />
              )}
            />
            {errors.location?.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.location.postalCode.message}</p>
            )}
          </div>

        </div>
      </div>

      {/* Prix et billetterie */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span>{t('pricingAndTickets')}</span>
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
                  <span className="text-sm font-medium text-gray-700">{t('freeEvent')}</span>
                </label>
              )}
            />
          </div>

          {!watchedPrice.isFree && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('price')} *
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
                      placeholder={t('pricePlaceholder')}
                    />
                  )}
                />
                {errors.price?.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('currency')} *
                </label>
                <Controller
                  name="price.currency"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="CAD">{t('currencyCAD')}</option>
                      <option value="USD">{t('currencyUSD')}</option>
                      <option value="EUR">{t('currencyEUR')}</option>
                    </select>
                  )}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ticketLink')}
            </label>
            <Controller
              name="ticketUrl"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('ticketLinkPlaceholder')}
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
              {t('tags')} *
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('addTag')}
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
          <span>{t('targetAudienceAndCapacity')}</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('targetAudience')} *
            </label>
            <Controller
              name="targetAudience"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[t('adult'), t('family'), t('student'), t('senior'), t('child')].map((audience) => (
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
              {t('maxCapacity')}
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
                  placeholder={t('maxCapacityPlaceholder')}
                />
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('maxCapacityHelp')}
            </p>
          </div>
        </div>
      </div>

      {/* Accessibilité */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Accessibility className="w-5 h-5 text-blue-600" />
          <span>{t('accessibility')}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'wheelchairAccessible', label: t('wheelchairAccessible') },
            { key: 'hearingAssistance', label: t('hearingAssistance') },
            { key: 'visualAssistance', label: t('visualAssistance') },
            { key: 'quietSpace', label: t('quietSpace') },
            { key: 'genderNeutralBathrooms', label: t('genderNeutralBathrooms') },
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
          <h3 className="text-lg font-semibold text-gray-900">{t('customFilters')}</h3>
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
                placeholder={t('filterName')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={newCustomFilter.type || ''}
                onChange={(e) => setNewCustomFilter({ ...newCustomFilter, type: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('selectFilterType')}</option>
                <option value="text">{t('text')}</option>
                <option value="boolean">{t('boolean')}</option>
                <option value="select">{t('select')}</option>
                <option value="number">{t('number')}</option>
              </select>
              
              <button
                type="button"
                onClick={handleAddCustomFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add')}</span>
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
                          {t('required')}
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
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('cancel')}
        </button>
        
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {t('publishEvent')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
