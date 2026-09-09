import { ApiResponse } from "./response.model";

// Произвольный набор кодов предметов (IMTAHAN_NOVLERI_TASK.md §6), а не пять захардкоженных
// ключей — набор предметов буклета зависит от секции типа экзамена, а не фиксирован.
export type BookletDisciplines = Record<string, string[]>;

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
    // IMTAHAN_NOVLERI_TASK.md §5 "хвост шага 2": subjects.name_az по кодам disciplines, отдано
    // JOIN'ом сервером (GET /booklets/public/:id) — публичная страница буклета не может сама
    // сходить в /subjects (требует JWT). Опционально: старые ответы бэка/кэш без поля — компонент
    // фоллбэкает на сам код.
    disciplineNames?: Record<string, string>;
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
