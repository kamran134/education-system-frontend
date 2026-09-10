// IMTAHAN_NOVLERI_TASK.md §16: exam_type_section_subjects задаёт ТОЛЬКО состав предметов
// секции — maxQuestions (число вопросов по предмету) больше не свойство конфига типа, а
// свойство конкретной работы (student_result_subject_scores.questionCount на каждом
// результате). exam_types.hasQuestionCounts снят тем же основанием: колонка "(sual sayı)"
// в шаблоне Excel теперь генерируется всегда, для любого типа.
export interface ExamTypeSectionSubject {
    subjectCode: string;
    nameAz: string;
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
    monthAwardMinRank: number | null;
    isBase: boolean;
    active: boolean;
    sortOrder: number;
    sections: ExamTypeInputSection[];
}
