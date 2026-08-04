import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { Exam, ExamResponse } from '../../../core/models/exam.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ApiResponse, ResponseFromBackend } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ExamService {

    constructor(private http: HttpClient, private configService: ConfigService) { }

    getExams(params: FilterParams): Observable<ExamResponse> {
        let url: string = `${this.configService.getApiUrl()}/exams`;
        const queryParams: string[] = [];

        // Добавляем пагинацию
        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }

        // Добавляем фильтры (только если они не пустые)
        if (params.search && params.search.trim() !== '') {
            queryParams.push(`search=${encodeURIComponent(params.search.trim())}`);
        }

        if (params.year && params.year !== 'null' && params.year !== '') {
            queryParams.push(`year=${params.year}`);
        }

        if (params.month && params.month !== 'null' && params.month !== '') {
            queryParams.push(`month=${params.month}`);
        }

        // Собираем URL с параметрами
        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        console.log('Exam API request URL:', url); // Для отладки
        console.log('Request params:', params); // Для отладки

        return this.http.get<ApiResponse<ExamResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getExamsForFilter(): Observable<ExamResponse> {
        const url: string = `${this.configService.getApiUrl()}/exams/filter`;
        return this.http.get<ApiResponse<ExamResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    addExam(exam: {name: string, code: number, date: Date}): Observable<Exam> {
        const url: string = `${this.configService.getApiUrl()}/exams`;
        return this.http.post<ApiResponse<Exam>>(url, exam, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadResults(file: File, examId: string | number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', String(examId));

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/student-results/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteResults(examId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/student-results/exam/${examId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteExam(examId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/exams/${examId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateExam(examId: string | number, exam: Partial<Exam>): Observable<Exam> {
        const url: string = `${this.configService.getApiUrl()}/exams/${examId}`;
        return this.http.put<ApiResponse<Exam>>(url, exam, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAllExams(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/exams`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    importLegacyResults(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<any>>(
            `${this.configService.getApiUrl()}/student-results/import-json`,
            formData,
            { withCredentials: true }
        ).pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    exportResultsAsJson(examId?: string | number): Observable<Blob> {
        const base: string = `${this.configService.getApiUrl()}/student-results/export`;
        const url: string = examId ? `${base}?examId=${examId}` : base;
        return this.http.get(url, { responseType: 'blob', withCredentials: true });
    }
}
