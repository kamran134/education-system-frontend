import { District } from "./district.model";

export interface SchoolResponse {
    data: School[];
    totalCount: number;
}

export interface School {
    _id: string;
    name: string;
    address: string;
    code: number;
    districtCode: number;
    district: District;
    score?: number;
    averageScore?: number;
    active: boolean;
}

export interface SchoolForCreation {
    name: string;
    address: string;
    code: number;
    districtCode?: number;
    district?: District;
    active?: boolean;
}