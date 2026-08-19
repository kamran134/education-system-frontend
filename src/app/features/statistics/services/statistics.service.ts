import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    StatisticsFilter,
    StatisticsResponse,
    YearlyStatistics,
    MonthlyStatistics,
    InkishafFilter,
    InkishafStatistics
} from '../../../core/models/statistics.model';
import { ApiResponse } from '../../../core/models/response.model';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private apiUrl = `${environment.apiUrl}/statistics`;

    constructor(private http: HttpClient) { }

    /**
     * Получить полную статистику (годовая + помесячная)
     */
    getStatistics(filters?: StatisticsFilter): Observable<ApiResponse<StatisticsResponse>> {
        let params = new HttpParams();

        if (filters) {
            if (filters.regionIds && filters.regionIds.length > 0) {
                params = params.set('regionIds', filters.regionIds.join(','));
            }
            if (filters.districtIds && filters.districtIds.length > 0) {
                params = params.set('districtIds', filters.districtIds.join(','));
            }
            if (filters.schoolIds && filters.schoolIds.length > 0) {
                params = params.set('schoolIds', filters.schoolIds.join(','));
            }
            if (filters.teacherIds && filters.teacherIds.length > 0) {
                params = params.set('teacherIds', filters.teacherIds.join(','));
            }
            if (filters.grades && filters.grades.length > 0) {
                params = params.set('grades', filters.grades.join(','));
            }
            if (filters.year) {
                params = params.set('year', filters.year.toString());
            }
            if (filters.month != null) {
                params = params.set('month', filters.month.toString());
            }
        }

        return this.http.get<ApiResponse<StatisticsResponse>>(this.apiUrl, { params });
    }

    /**
     * Получить только годовую статистику
     */
    getYearlyStatistics(filters?: StatisticsFilter): Observable<ApiResponse<YearlyStatistics>> {
        let params = new HttpParams();

        if (filters) {
            if (filters.regionIds && filters.regionIds.length > 0) {
                params = params.set('regionIds', filters.regionIds.join(','));
            }
            if (filters.districtIds && filters.districtIds.length > 0) {
                params = params.set('districtIds', filters.districtIds.join(','));
            }
            if (filters.schoolIds && filters.schoolIds.length > 0) {
                params = params.set('schoolIds', filters.schoolIds.join(','));
            }
            if (filters.teacherIds && filters.teacherIds.length > 0) {
                params = params.set('teacherIds', filters.teacherIds.join(','));
            }
            if (filters.grades && filters.grades.length > 0) {
                params = params.set('grades', filters.grades.join(','));
            }
            if (filters.year) {
                params = params.set('year', filters.year.toString());
            }
            if (filters.month != null) {
                params = params.set('month', filters.month.toString());
            }
        }

        return this.http.get<ApiResponse<YearlyStatistics>>(`${this.apiUrl}/yearly`, { params });
    }

    /**
     * Получить только помесячную статистику
     */
    getMonthlyStatistics(filters?: StatisticsFilter): Observable<ApiResponse<MonthlyStatistics[]>> {
        let params = new HttpParams();

        if (filters) {
            if (filters.regionIds && filters.regionIds.length > 0) {
                params = params.set('regionIds', filters.regionIds.join(','));
            }
            if (filters.districtIds && filters.districtIds.length > 0) {
                params = params.set('districtIds', filters.districtIds.join(','));
            }
            if (filters.schoolIds && filters.schoolIds.length > 0) {
                params = params.set('schoolIds', filters.schoolIds.join(','));
            }
            if (filters.teacherIds && filters.teacherIds.length > 0) {
                params = params.set('teacherIds', filters.teacherIds.join(','));
            }
            if (filters.grades && filters.grades.length > 0) {
                params = params.set('grades', filters.grades.join(','));
            }
            if (filters.year) {
                params = params.set('year', filters.year.toString());
            }
            if (filters.month != null) {
                params = params.set('month', filters.month.toString());
            }
        }

        return this.http.get<ApiResponse<MonthlyStatistics[]>>(`${this.apiUrl}/monthly`, { params });
    }

    /**
     * Получить inkişaf statistikası по минимуму участий
     */
    getInkishafStatistics(filters?: InkishafFilter): Observable<ApiResponse<InkishafStatistics>> {
        let params = new HttpParams();

        if (filters) {
            if (filters.districtIds && filters.districtIds.length > 0) {
                params = params.set('districtIds', filters.districtIds.join(','));
            }
            if (filters.schoolIds && filters.schoolIds.length > 0) {
                params = params.set('schoolIds', filters.schoolIds.join(','));
            }
            if (filters.grades && filters.grades.length > 0) {
                params = params.set('grades', filters.grades.join(','));
            }
            if (filters.year) {
                params = params.set('year', filters.year.toString());
            }
            if (filters.minParticipations != null) {
                params = params.set('minParticipations', filters.minParticipations.toString());
            }
        }

        return this.http.get<ApiResponse<InkishafStatistics>>(`${this.apiUrl}/inkishaf`, { params });
    }
}
