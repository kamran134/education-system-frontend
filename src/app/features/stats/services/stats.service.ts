import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { Stats, StatsResponse } from '../../../core/models/stats.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { Exam } from '../../../core/models/exam.model';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    updateStats(): Observable<any> {
        let url: string = `${this.configService.getApiUrl()}/stats`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateAllStats(): Observable<any> {
        let url: string = `${this.configService.getApiUrl()}/stats/all`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateStatsByRepublic(): Observable<any> {
        let url: string = `${this.configService.getApiUrl()}/stats/by-republic`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getStudentsStats(params: FilterParams): Observable<StatsResponse> {
        let url: string = `${this.configService.getApiUrl()}/stats/students?month=${params.month}`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        if (params.teacherIds && params.teacherIds.length > 0) {
            url = `${url}&teacherIds=${params.teacherIds}`;
        }
        if (params.grades && params.grades.length > 0) {
            url = `${url}&grades=${params.grades}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        if (params.examIds) {
            url = `${url}&examIds=${params.examIds}`;
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        return this.http.get<ApiResponse<StatsResponse>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    // Отдельный метод для получения развивающихся студентов
    getDevelopingStudentsStats(params: FilterParams): Observable<any[]> {
        let url: string = `${this.configService.getApiUrl()}/stats/students/developing?month=${params.month}`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        if (params.teacherIds && params.teacherIds.length > 0) {
            url = `${url}&teacherIds=${params.teacherIds}`;
        }
        if (params.grades && params.grades.length > 0) {
            url = `${url}&grades=${params.grades}`;
        }
        if (params.levels && params.levels.length > 0) {
            url = `${url}&levels=${params.levels}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        if (params.examIds) {
            url = `${url}&examIds=${params.examIds}`;
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        return this.http.get<ApiResponse<any[]>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    // Отдельный метод для получения студентов месяца по районам
    getStudentsOfMonthStats(params: FilterParams): Observable<any[]> {
        let url: string = `${this.configService.getApiUrl()}/stats/students/month?month=${params.month}`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        if (params.teacherIds && params.teacherIds.length > 0) {
            url = `${url}&teacherIds=${params.teacherIds}`;
        }
        if (params.grades && params.grades.length > 0) {
            url = `${url}&grades=${params.grades}`;
        }
        if (params.levels && params.levels.length > 0) {
            url = `${url}&levels=${params.levels}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        if (params.examIds) {
            url = `${url}&examIds=${params.examIds}`;
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        return this.http.get<ApiResponse<any[]>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    // Отдельный метод для получения студентов месяца по республике
    getStudentsOfMonthByRepublicStats(params: FilterParams): Observable<any[]> {
        let url: string = `${this.configService.getApiUrl()}/stats/students/month-republic?month=${params.month}`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        if (params.teacherIds && params.teacherIds.length > 0) {
            url = `${url}&teacherIds=${params.teacherIds}`;
        }
        if (params.grades && params.grades.length > 0) {
            url = `${url}&grades=${params.grades}`;
        }
        if (params.levels && params.levels.length > 0) {
            url = `${url}&levels=${params.levels}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        if (params.examIds) {
            url = `${url}&examIds=${params.examIds}`;
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        return this.http.get<ApiResponse<any[]>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getStatsByExam(exam: Exam[]): Observable<StatsResponse> {
        // Используем первый экзамен из массива для получения статистики
        const examId = exam.length > 0 ? exam[0]._id : '';
        let url: string = `${this.configService.getApiUrl()}/stats/by-exam/${examId}`;
        return this.http.get<ApiResponse<StatsResponse>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getTeachersStats(params: FilterParams): Observable<StatsResponse> {
        let url: string = `${this.configService.getApiUrl()}/stats/teachers`;
        const queryParams = [];

        if (params.districtIds && params.districtIds.length > 0) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            queryParams.push(`schoolIds=${params.schoolIds}`);
        }
        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`);
        }
        if (params.page) {
            queryParams.push(`page=${params.page}`);
        }
        if (params.size) {
            queryParams.push(`size=${params.size}`);
        }
        if (params.academicYear) {
            queryParams.push(`academicYear=${params.academicYear}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<StatsResponse>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getSchoolsStats(params: FilterParams): Observable<StatsResponse> {
        let url: string = `${this.configService.getApiUrl()}/stats/schools`;
        const queryParams = [];

        if (params.districtIds && params.districtIds.length > 0) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }
        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`);
        }
        if (params.page) {
            queryParams.push(`page=${params.page}`);
        }
        if (params.size) {
            queryParams.push(`size=${params.size}`);
        }
        if (params.academicYear) {
            queryParams.push(`academicYear=${params.academicYear}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<StatsResponse>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getDistrictsStats(params: FilterParams): Observable<StatsResponse> {
        let url: string = `${this.configService.getApiUrl()}/stats/districts`;
        const queryParams = [];

        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`);
        }
        if (params.page) {
            queryParams.push(`page=${params.page}`);
        }
        if (params.size) {
            queryParams.push(`size=${params.size}`);
        }
        if (params.academicYear) {
            queryParams.push(`academicYear=${params.academicYear}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<StatsResponse>>(url, {})
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
