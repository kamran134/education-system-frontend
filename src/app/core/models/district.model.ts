import { ApiResponse } from "./response.model";

export interface DistrictResponse {
    data: District[];
    totalCount: number;
}

export interface DistrictApiResponse extends ApiResponse<{ data: District[], totalCount: number }> {}

export interface District {
    _id: string;
    name: string;
    code: number;
    region: string;
    rate: number;
    score: number;
    averageScore: number;
    studentCount: number;
    districtOfTheYearScore?: number;
    place?: number;
}