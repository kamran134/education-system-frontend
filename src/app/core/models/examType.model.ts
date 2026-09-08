export interface ExamTypeSectionSubject {
    subjectCode: string;
    nameAz: string;
    maxQuestions: number;
    sortOrder: number;
}

export interface ExamTypeSection {
    id: number;
    nameAz: string;
    gradeFrom: number;
    gradeTo: number;
    subjects: ExamTypeSectionSubject[];
}

export interface ExamType {
    id: number;
    code: string;
    nameAz: string;
    levelScaleId: number;
    hasQuestionCounts: boolean;
    monthAwardMinRank: number | null;
    isBase: boolean;
    active: boolean;
    sortOrder: number;
    sections: ExamTypeSection[];
}

// То, что отправляется в POST/PUT /api/exam-types — без id у типа, секции/предметы
// у новых записей тоже без id (бэкенд заменяет sections/subjects целиком на присланное).
export interface ExamTypeInputSectionSubject {
    subjectCode: string;
    nameAz: string;
    maxQuestions: number;
    sortOrder: number;
}

export interface ExamTypeInputSection {
    id?: number;
    nameAz: string;
    gradeFrom: number;
    gradeTo: number;
    subjects: ExamTypeInputSectionSubject[];
}

export interface ExamTypeInput {
    code: string;
    nameAz: string;
    levelScaleId: number;
    hasQuestionCounts: boolean;
    monthAwardMinRank: number | null;
    isBase: boolean;
    active: boolean;
    sortOrder: number;
    sections: ExamTypeInputSection[];
}
