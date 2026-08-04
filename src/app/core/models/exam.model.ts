import { ApiResponse } from "./response.model";

export interface ExamResponse {
    data: Exam[];
    totalCount: number;
}

export interface ExamApiResponse extends ApiResponse<{ data: Exam[], totalCount: number }> {}

export interface Exam {
    id: number;
    name: string;
    code: number;
    date: Date;
}