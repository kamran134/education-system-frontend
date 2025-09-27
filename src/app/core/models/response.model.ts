// Новый формат ответа с ResponseHandler
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

// Старый формат (оставляем для совместимости)
export interface ResponseFromBackend {
    data: any;
    message?: string;
    error?: string;
    totalCount?: number;
    missingDistrictCodes?: number[];
    incorrectSchoolCodes?: number[];
    schoolCodesWithoutDistrictCodes?: number[];
    missingSchoolCodes?: number[];
    incorrectTeacherCodes?: number[];
    teacherCodesWithoutSchoolCodes?: number[];
    incorrectStudentCodes?: number[];
    studentsWithoutTeacher?: number[];
}