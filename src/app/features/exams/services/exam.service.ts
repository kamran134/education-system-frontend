import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../services/config.service';
import { Observable } from 'rxjs';
import { Exam, ExamData } from '../../../models/exam.model';
import { FilterParams } from '../../../models/filterParams.model';
import { ExamResult } from '../../../models/examResult.model';
import { ResponseFromBackend } from '../../../models/response.model';

@Injectable({
    providedIn: 'root'
})
export class ExamService {

    constructor(private http: HttpClient, private configService: ConfigService) { }

    getExams(params: FilterParams): Observable<ExamData> {
        let url: string = `${this.configService.getApiUrl()}/exams`;
        if (params.page && params.size) {
            url = `${url}?page=${params.page}&size=${params.size}`;
        }
        return this.http.get<ExamData>(url);
    }

    addExam(exam: {name: string, code: number, date: Date}): Observable<Exam> {
        const url: string = `${this.configService.getApiUrl()}/exams`;
        return this.http.post<Exam>(url, exam, { withCredentials: true });
    }

    uploadResults(file: File, examId: string): Observable<ResponseFromBackend> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', examId);

        return this.http.post<ResponseFromBackend>(`${this.configService.getApiUrl()}/student-results/upload`, formData, { withCredentials: true });
    }

    deleteResults(examId: string): Observable<ResponseFromBackend> {
        const url: string = `${this.configService.getApiUrl()}/student-results/${examId}`;
        return this.http.delete<ResponseFromBackend>(url, { withCredentials: true });
    }

    deleteExam(examId: string): Observable<ResponseFromBackend> {
        const url: string = `${this.configService.getApiUrl()}/exams/${examId}`;
        return this.http.delete<ResponseFromBackend>(url, { withCredentials: true });
    }

    deleteAllExams(): Observable<ResponseFromBackend> {
        const url: string = `${this.configService.getApiUrl()}/exams`;
        return this.http.delete<ResponseFromBackend>(url, { withCredentials: true });
    }
}
