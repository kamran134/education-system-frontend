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
        if (params.page && params.size) {
            url = `${url}?page=${params.page}&size=${params.size}`;
        }
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

    uploadResults(file: File, examId: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', examId);

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/student-results/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteResults(examId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/student-results/${examId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteExam(examId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/exams/${examId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAllExams(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/exams`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
