import { ApiResponse } from "./response.model";

export interface BookletDisciplines {
    az?: string[];
    math?: string[];
    lifeKnowledge?: string[];
    logic?: string[];
    english?: string[];
}

export interface Booklet {
    _id: string;
    exam: string;
    variant: string;
    grade: number;
    disciplines: BookletDisciplines;
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
}
