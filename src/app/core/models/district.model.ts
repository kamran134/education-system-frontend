export interface DistrictResponse {
    data: District[];
    totalCount: number;
}

export interface District {
    _id: string;
    name: string;
    code: number;
    region: string;
    rate: number;
    score: number;
    averageScore: number;
}