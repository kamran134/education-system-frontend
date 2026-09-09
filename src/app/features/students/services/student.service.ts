import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { FilterParams } from '../../../core/models/filterParams.model';
import { RepairingResults, Student, StudentResponse, StudentWithResult, StudentWithResultResponse, StudentApiResponse } from '../../../core/models/student.model';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';
import { ExamResult } from '../../../core/models/examResult.model';
import { ProfileSaveResult } from '../../../core/models/profile-change.model';
import { toProfileSaveResult } from '../../../core/utils/profile-save-result.util';

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getStudents(params: FilterParams): Observable<StudentApiResponse> {
        let url: string = `${this.configService.getApiUrl()}/students`;
        const queryParams: string[] = [];

        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }

        if (params.defective) {
            queryParams.push('defective=true');
        }

        if (params.districtIds && params.districtIds.length > 0) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }

        if (params.schoolIds && params.schoolIds.length > 0) {
            queryParams.push(`schoolIds=${params.schoolIds}`);
        }

        if (params.teacherIds && params.teacherIds.length > 0) {
            queryParams.push(`teacherIds=${params.teacherIds}`);
        }

        if (params.grades && params.grades.length > 0) {
            queryParams.push(`grades=${params.grades}`);
        }

        if (params.examIds && params.examIds.length > 0) {
            queryParams.push(`examIds=${params.examIds}`);
        }

        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}`);
            queryParams.push(`sortDirection=${params.sortDirection}`);
        }

        if (params.search) {
            queryParams.push(`search=${encodeURIComponent(params.search)}`);
        }

        if (params.code) {
            queryParams.push(`code=${params.code}`);
        }

        if (params.academicYear) {
            queryParams.push(`academicYear=${params.academicYear}`);
        }

        if (params.month) {
            queryParams.push(`month=${params.month}`);
        }

        // IMTAHAN_NOVLERI_TASK.md §5-§6 шаг 3: без него бэкенд подставляет базовый тип —
        // существующий реестр/İlin şagirdləri (features/stats) не передают его и видят то же,
        // что и раньше. features/type-ratings передаёт выбранный тип явно.
        if (params.examTypeId) {
            queryParams.push(`examTypeId=${params.examTypeId}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<StudentApiResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getStudentById(studentId: string | number): Observable<StudentWithResultResponse> {
        let url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.get<ApiResponse<StudentWithResultResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    searchStudents(searchString: string): Observable<StudentApiResponse> {
        let url: string = `${this.configService.getApiUrl()}/students/search/${searchString}`;
        return this.http.get<ApiResponse<StudentApiResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students`;
        return this.http.post<ApiResponse<StudentWithResult>>(url, student, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students/${student.id}`;
        return this.http.put<ApiResponse<StudentWithResult>>(url, student, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    /**
     * Заявка на правку ФИО ученика (п.3 ТЗ 04.09.2026) — подаёт учитель этого ученика, идёт
     * через ту же очередь модерации, что и у школы/учителя/района (BASE_FIXES_TASK.md §2.5):
     * 200 — применено сразу (админ), 202 — ушло на подтверждение (учитель), см. toProfileSaveResult.
     */
    updateStudentProfile(studentId: string | number, data: { lastName?: string | null; firstName?: string; middleName?: string | null }): Observable<ProfileSaveResult<Student>> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}/profile`;
        return this.http.patch<ApiResponse<Student>>(url, data, { withCredentials: true, observe: 'response' })
            .pipe(map(response => toProfileSaveResult<Student>(response)));
    }

    deleteStudent(studentId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteStudents(studentIds: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/delete/${studentIds}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    repairStudents(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/students/repair`;
        return this.http.get<ApiResponse<RepairingResults>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/students/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateStudentResult(resultId: string | number, result: Partial<ExamResult>): Observable<ExamResult> {
        const url: string = `${this.configService.getApiUrl()}/student-results/${resultId}`;
        return this.http.put<ApiResponse<ExamResult>>(url, result, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteStudentResult(resultId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/student-results/${resultId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadAvatar(studentId: string | number, formData: FormData): Observable<{ avatarUrl: string }> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}/avatar`;
        return this.http.post<ApiResponse<{ avatarUrl: string }>>(url, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAvatar(studentId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}/avatar`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    bulkUploadAvatars(formData: FormData): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/bulk-upload/avatars`;
        return this.http.post<ApiResponse<any>>(url, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    importLegacyStudents(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(
            `${this.configService.getApiUrl()}/students/legacy-import`,
            formData,
            { withCredentials: true }
        ).pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
