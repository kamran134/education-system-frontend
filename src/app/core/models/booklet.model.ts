import { ApiResponse } from "./response.model";

export interface BookletDisciplines {
    az?: string[];
    math?: string[];
    lifeKnowledge?: string[];
    logic?: string[];
    english?: string[];
}

export interface BookletDistrict {
    id: number;
    name: string;
    code: number;
}

export interface BookletExam {
    id: number;
    name: string;
    code: number;
    date: string;
}

export interface Booklet {
    id: number;
    exam: BookletExam | string;
    variant: string;
    grade: number;
    disciplines: BookletDisciplines;
    district?: BookletDistrict | string;
    name?: string;
}

export interface BookletResponse {
    data: Booklet[];
    totalCount: number;
}

export interface BookletApiResponse extends ApiResponse<{ data: Booklet[]; totalCount: number }> {}

export interface BookletInput {
    exam: string;
    variant: string;
    grade: number;
    disciplines: BookletDisciplines;
    district?: string;
    name?: string;
}
