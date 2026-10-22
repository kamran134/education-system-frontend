/** Which metric the "Filtr üzrə yer" column was ranked by (the backend's `filterPlaceBasis`). */
export type FilterPlaceBasis = 'score' | 'averageScore';

/** Small grey caption under the "Filtr üzrə yer" header; null when the response did not say. */
export function filterPlaceSublabel(basis: FilterPlaceBasis | null | undefined): string | null {
    if (basis === 'averageScore') return 'orta xal üzrə';
    if (basis === 'score') return 'ümumi xal üzrə';
    return null;
}

/** Reads `filterPlaceBasis` from a list response in either envelope ({ data: { ... } } or flat). */
export function extractFilterPlaceBasis(response: unknown): FilterPlaceBasis | null {
    if (!response || typeof response !== 'object') return null;
    const r = response as { filterPlaceBasis?: unknown; data?: { filterPlaceBasis?: unknown } };
    const value = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data.filterPlaceBasis : r.filterPlaceBasis;
    return value === 'score' || value === 'averageScore' ? value : null;
}
