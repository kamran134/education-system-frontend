import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
    StatisticsFilter, 
    StatisticsResponse, 
    YearlyStatistics, 
    MonthlyStatistics 
} from '../../../core/models/statistics.model';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private apiUrl = `${environment.apiUrl}/statistics`;

    constructor(private http: HttpClient) { }

    /**
     * Получить полную статистику (годовая + помесячная)
     */
    getStatistics(filters?: StatisticsFilter): Observable<any> {
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
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    /**
     * Получить только годовую статистику
     */
    getYearlyStatistics(filters?: StatisticsFilter): Observable<any> {
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
        }

        return this.http.get<any>(`${this.apiUrl}/yearly`, { params });
    }

    /**
     * Получить только помесячную статистику
     */
    getMonthlyStatistics(filters?: StatisticsFilter): Observable<any> {
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
        }

        return this.http.get<any>(`${this.apiUrl}/monthly`, { params });
    }
}
