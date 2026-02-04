import { EventFilter, AccessibilityInfo } from '@/types';

const ACCESSIBILITY_KEYS: Array<keyof AccessibilityInfo> = [
  'wheelchairAccessible',
  'hearingAssistance',
  'visualAssistance',
  'quietSpace',
  'signLanguage',
  'audioDescription',
  'braille',
];

const FILTER_PARAM_KEYS = [
  'q',
  'cat',
  'sub',
  'start',
  'end',
  'min',
  'max',
  'lat',
  'lng',
  'radius',
  'tags',
  'aud',
  'acc',
  'past',
];

type SanitizeOptions = {
  preserveEmpty?: boolean;
};

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDate = (value: string | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const uniqueStrings = (values: string[] | undefined): string[] | undefined => {
  if (!values || values.length === 0) return undefined;
  const cleaned = values
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  if (!cleaned.length) return undefined;
  const unique: string[] = [];
  for (const value of cleaned) {
    if (!unique.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      unique.push(value);
    }
  }
  return unique;
};

export const sanitizeFilters = (filters: EventFilter, options: SanitizeOptions = {}): EventFilter => {
  const sanitized: EventFilter = {};

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    sanitized.searchQuery = filters.searchQuery.trim();
  }

  const categories = uniqueStrings(filters.categories);
  if (categories) sanitized.categories = categories;

  const subCategories = uniqueStrings(filters.subCategories);
  if (subCategories) sanitized.subCategories = subCategories;

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    const hasStart = start && !Number.isNaN(new Date(start).getTime());
    const hasEnd = end && !Number.isNaN(new Date(end).getTime());
    if (hasStart || hasEnd) {
      sanitized.dateRange = {
        ...(hasStart ? { start: new Date(start) } : {}),
        ...(hasEnd ? { end: new Date(end) } : {}),
      } as EventFilter['dateRange'];
    }
  }

  if (filters.priceRange) {
    const min = typeof filters.priceRange.min === 'number' ? filters.priceRange.min : undefined;
    const max = typeof filters.priceRange.max === 'number' ? filters.priceRange.max : undefined;
    if (Number.isFinite(min) || Number.isFinite(max)) {
      sanitized.priceRange = {
        ...(Number.isFinite(min) ? { min } : {}),
        ...(Number.isFinite(max) ? { max } : {}),
      };
    }
  }

  if (filters.location) {
    const { lat, lng, radius } = filters.location;
    const hasLat = typeof lat === 'number' && Number.isFinite(lat);
    const hasLng = typeof lng === 'number' && Number.isFinite(lng);
    const hasRadius = typeof radius === 'number' && Number.isFinite(radius);
    if (hasLat && hasLng) {
      sanitized.location = {
        lat,
        lng,
        radius: hasRadius ? radius : 5,
      };
    }
  }

  const tags = uniqueStrings(filters.tags);
  if (tags) sanitized.tags = tags;

  if (filters.targetAudience && filters.targetAudience.length > 0) {
    const audiences = uniqueStrings(filters.targetAudience);
    if (audiences) sanitized.targetAudience = audiences;
  }

  if (filters.accessibility) {
    const entries = Object.entries(filters.accessibility)
      .filter(([key, value]) => ACCESSIBILITY_KEYS.includes(key as keyof AccessibilityInfo) && Boolean(value));
    if (entries.length > 0) {
      sanitized.accessibility = entries.reduce((acc, [key]) => {
        acc[key as keyof AccessibilityInfo] = true;
        return acc;
      }, {} as Partial<AccessibilityInfo>);
    }
  }

  if (filters.customFilters && Object.keys(filters.customFilters).length > 0) {
    sanitized.customFilters = filters.customFilters;
  }

  if (filters.includePast === true) {
    sanitized.includePast = true;
  }

  if (options.preserveEmpty) {
    return { ...(options.preserveEmpty ? filters : {}), ...sanitized };
  }

  return sanitized;
};

export const serializeFiltersToString = (filters: EventFilter): string => {
  const sanitized = sanitizeFilters(filters);
  const params = new URLSearchParams();

  if (sanitized.searchQuery) {
    params.set('q', sanitized.searchQuery);
  }

  if (sanitized.categories?.length) {
    params.set('cat', sanitized.categories.join(','));
  }

  if (sanitized.subCategories?.length) {
    params.set('sub', sanitized.subCategories.join(','));
  }

  if (sanitized.dateRange) {
    if (sanitized.dateRange.start) {
      params.set('start', sanitized.dateRange.start.toISOString());
    }
    if (sanitized.dateRange.end) {
      params.set('end', sanitized.dateRange.end.toISOString());
    }
  }

  if (sanitized.priceRange) {
    if (typeof sanitized.priceRange.min === 'number') {
      params.set('min', sanitized.priceRange.min.toString());
    }
    if (typeof sanitized.priceRange.max === 'number') {
      params.set('max', sanitized.priceRange.max.toString());
    }
  }

  if (sanitized.location) {
    params.set('lat', sanitized.location.lat.toString());
    params.set('lng', sanitized.location.lng.toString());
    if (typeof sanitized.location.radius === 'number') {
      params.set('radius', sanitized.location.radius.toString());
    }
  }

  if (sanitized.tags?.length) {
    params.set('tags', sanitized.tags.join(','));
  }

  if (sanitized.targetAudience?.length) {
    params.set('aud', sanitized.targetAudience.join(','));
  }

  if (sanitized.accessibility) {
    const activeAccessibility = ACCESSIBILITY_KEYS.filter((key) => sanitized.accessibility?.[key]);
    if (activeAccessibility.length) {
      params.set('acc', activeAccessibility.join(','));
    }
  }

  if (sanitized.customFilters && Object.keys(sanitized.customFilters).length > 0) {
    params.set('custom', JSON.stringify(sanitized.customFilters));
  }

  if (sanitized.includePast) {
    params.set('past', '1');
  }

  params.sort();
  return params.toString();
};

export const parseFiltersFromString = (rawParams: string): EventFilter => {
  if (!rawParams) return {};
  const params = new URLSearchParams(rawParams);
  const filters: EventFilter = {};

  const q = params.get('q') || params.get('search');
  if (q) {
    filters.searchQuery = q;
  }

  const categories = params.get('cat');
  if (categories) {
    filters.categories = categories.split(',');
  }

  const subCategories = params.get('sub');
  if (subCategories) {
    filters.subCategories = subCategories.split(',');
  }

  const start = parseDate(params.get('start'));
  const end = parseDate(params.get('end'));
  if (start || end) {
    filters.dateRange = {} as EventFilter['dateRange'];
    if (start) filters.dateRange.start = start;
    if (end) filters.dateRange.end = end;
  }

  const min = parseNumber(params.get('min'));
  const max = parseNumber(params.get('max'));
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filters.priceRange = {} as EventFilter['priceRange'];
    if (Number.isFinite(min)) filters.priceRange.min = min!;
    if (Number.isFinite(max)) filters.priceRange.max = max!;
  }

  const lat = parseNumber(params.get('lat'));
  const lng = parseNumber(params.get('lng'));
  const radius = parseNumber(params.get('radius'));
  if (typeof lat === 'number' && typeof lng === 'number') {
    filters.location = {
      lat,
      lng,
      radius: typeof radius === 'number' ? radius : 5,
    };
  }

  const tags = params.get('tags');
  if (tags) {
    filters.tags = tags.split(',');
  }

  const audience = params.get('aud');
  if (audience) {
    filters.targetAudience = audience.split(',');
  }

  const accessibility = params.get('acc');
  if (accessibility) {
    const entries = accessibility.split(',');
    filters.accessibility = entries.reduce((acc, key) => {
      if (ACCESSIBILITY_KEYS.includes(key as keyof AccessibilityInfo)) {
        acc[key as keyof AccessibilityInfo] = true;
      }
      return acc;
    }, {} as Partial<AccessibilityInfo>);
  }

  const custom = params.get('custom');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') {
        filters.customFilters = parsed;
      }
    } catch (error) {
      // Ignore malformed custom filters
    }
  }

  const past = params.get('past');
  if (past === '1' || past === 'true') {
    filters.includePast = true;
  }

  return sanitizeFilters(filters);
};
