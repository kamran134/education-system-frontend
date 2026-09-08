export interface Subject {
    code: string;
    nameAz: string;
    sortOrder: number;
    active: boolean;
}

export interface SubjectInput {
    code: string;
    nameAz: string;
    sortOrder?: number;
    active?: boolean;
}
