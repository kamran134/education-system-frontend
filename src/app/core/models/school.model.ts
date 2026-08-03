import { District } from "./district.model";
import { ApiResponse } from "./response.model";
import { YearRating } from "./year-rating.model";

export interface SchoolResponse {
    data: School[];
    totalCount: number;
}

export interface SchoolApiResponse extends ApiResponse<{ data: School[], totalCount: number }> {}

export interface School {
    _id: string;
    name: string;
    address: string;
    code: number;
    districtCode: number;
    district: District;
    score?: number;
    averageScore?: number;
    studentCount?: number;
    schoolOfTheYearScore?: number;
    place?: number;
    districtPlace?: number | null;
    filterPlace?: number | null;
    active: boolean;
    ratings?: YearRating[];
    avatarUrl?: string;
}

export interface SchoolForCreation {
    name: string;
    address: string;
    code: number;
    districtCode?: number;
    district?: District;
    studentCount?: number;
    active?: boolean;
}
