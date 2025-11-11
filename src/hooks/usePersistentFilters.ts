import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventFilter } from '@/types';
import { parseFiltersFromString, sanitizeFilters, serializeFiltersToString } from '@/lib/urlFilters';

export const usePersistentFilters = (defaultFilters: EventFilter = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultRef = useRef<EventFilter>(defaultFilters);

  const initialFilters = useMemo(() => {
    const parsed = parseFiltersFromString(searchParams.toString());
    return sanitizeFilters({ ...defaultRef.current, ...parsed });
  }, [searchParams]);

  const [filters, setFiltersState] = useState<EventFilter>(initialFilters);
  const serializedRef = useRef<string>(serializeFiltersToString(initialFilters));

  useEffect(() => {
    const paramsString = searchParams.toString();
    if (paramsString === serializedRef.current) {
      return;
    }

    const parsed = sanitizeFilters({
      ...defaultRef.current,
      ...parseFiltersFromString(paramsString),
    });

    const serialized = serializeFiltersToString(parsed);
    serializedRef.current = serialized;
    setFiltersState(parsed);
  }, [searchParams]);

  useEffect(() => {
    const serialized = serializeFiltersToString(filters);
    if (serialized === serializedRef.current) {
      return;
    }

    serializedRef.current = serialized;
    const targetUrl = serialized.length > 0 ? `${pathname}?${serialized}` : pathname;
    router.replace(targetUrl, { scroll: false });
  }, [filters, pathname, router]);

  const setFilters = useCallback(
    (updater: EventFilter | ((prev: EventFilter) => EventFilter)) => {
      setFiltersState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: EventFilter) => EventFilter)(prev) : updater;
        return sanitizeFilters(next, { preserveEmpty: true });
      });
    },
    []
  );

  const updateFilterKey = useCallback(
    <K extends keyof EventFilter>(key: K, value: EventFilter[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    setFiltersState({});
    serializedRef.current = '';
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    setFilters,
    updateFilterKey,
    clearFilters,
  };
};
