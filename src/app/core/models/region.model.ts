import { ApiResponse } from "./response.model";
import { YearRating } from "./year-rating.model";

export interface RegionResponse {
    data: Region[];
    totalCount: number;
}

export interface RegionApiResponse extends ApiResponse<{ data: Region[], totalCount: number }> {}

export interface Region {
    id: number;
    name: string;
    code: number;
    score: number;
    averageScore: number;
    districtCount: number;
    studentCount: number;
    regionOfTheYearScore?: number;
    active: boolean;
    place?: number;
    filterPlace?: number | null;
    ratings?: YearRating[];
    avatarUrl?: string;
}
