import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ExamResult } from '../../../core/models/examResult.model';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

export interface ExamResultsResponse {
    data: ExamResult[];
    totalCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class ExamResultsService {
    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {}

    getExamResults(params: FilterParams): Observable<ExamResultsResponse> {
        let url = `${this.configService.getApiUrl()}/exam-results`;
        const queryParams: string[] = [];
        
        console.log('🔍 ExamResultsService params:', params);
        
        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }
        
        if (params.search) {
            queryParams.push(`search=${encodeURIComponent(params.search)}`);
        }
        
        if (params.code) {
            queryParams.push(`code=${params.code}`);
        }
        
        if (params.districtIds) {
            const districtIds = Array.isArray(params.districtIds) ? params.districtIds : [params.districtIds];
            if (districtIds.length > 0) {
                queryParams.push(`districtIds=${districtIds.join(',')}`);
            }
        }
        
        if (params.schoolIds) {
            const schoolIds = Array.isArray(params.schoolIds) ? params.schoolIds : [params.schoolIds];
            if (schoolIds.length > 0) {
                queryParams.push(`schoolIds=${schoolIds.join(',')}`);
            }
        }
        
        if (params.teacherIds) {
            const teacherIds = Array.isArray(params.teacherIds) ? params.teacherIds : [params.teacherIds];
            if (teacherIds.length > 0) {
                queryParams.push(`teacherIds=${teacherIds.join(',')}`);
            }
        }
        
        if (params.examIds) {
            // examIds уже приходит как строка с join(",") из компонента
            queryParams.push(`examIds=${params.examIds}`);
        }
        
        if (params.grades) {
            // grades уже приходит как строка с join(",") из компонента
            queryParams.push(`grades=${params.grades}`);
        }
        
        if (params.dateFrom) {
            queryParams.push(`dateFrom=${params.dateFrom}`);
        }
        
        if (params.dateTo) {
            queryParams.push(`dateTo=${params.dateTo}`);
        }
        
        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}`);
            queryParams.push(`sortDirection=${params.sortDirection}`);
        }
        
        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }
        
        console.log('🌐 Final URL:', url);
        
        return this.http.get<ApiResponse<ExamResultsResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response) as ExamResultsResponse));
    }

    updateStudentResult(resultId: string | number, result: any): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.configService.getApiUrl()}/student-results/${resultId}`, result)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteStudentResult(resultId: string | number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.configService.getApiUrl()}/student-results/${resultId}`)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}