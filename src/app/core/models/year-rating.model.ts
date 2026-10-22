/**
 * Represents a rating entry for a specific academic year.
 * `year` is the start year of the academic year (e.g., 2024 for 2024/2025).
 */
export interface YearRating {
    year: number;
    score: number;
    averageScore: number;
    place: number | null;
    districtPlace?: number | null;
    /** Place by average score (RATING_PLACES_TASK.md); place/districtPlace are by total score. */
    averagePlace?: number | null;
    averageDistrictPlace?: number | null;
}
