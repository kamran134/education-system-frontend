import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExamType, ExamTypeInput } from '../../../core/models/examType.model';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

@Injectable({
    providedIn: 'root'
})
export class ExamTypeService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getExamTypes(): Observable<ExamType[]> {
        const url: string = `${this.configService.getApiUrl()}/exam-types`;
        return this.http.get<ApiResponse<ExamType[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createExamType(input: ExamTypeInput): Observable<ExamType> {
        const url: string = `${this.configService.getApiUrl()}/exam-types`;
        return this.http.post<ApiResponse<ExamType>>(url, input, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateExamType(id: number, input: ExamTypeInput): Observable<ExamType> {
        const url: string = `${this.configService.getApiUrl()}/exam-types/${id}`;
        return this.http.put<ApiResponse<ExamType>>(url, input, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteExamType(id: number): Observable<void> {
        const url: string = `${this.configService.getApiUrl()}/exam-types/${id}`;
        return this.http.delete<ApiResponse<void>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
