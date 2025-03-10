import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../services/config.service';
import { Observable } from 'rxjs';
import { Stats } from '../../../models/stats.model';
import { FilterParams } from '../../../models/filterParams.model';

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    updateStats(): Observable<any> {
        let url: string = `${this.configService.getApiUrl()}/stats`;
        return this.http.post(url, {}, { withCredentials: true });
    }

    updateStatsByRepublic(): Observable<any> {
        let url: string = `${this.configService.getApiUrl()}/stats/by-republic`;
        return this.http.post(url, {}, { withCredentials: true });
    }

    getStudentsStats(month: string, params: FilterParams): Observable<Stats> {
        let url: string = `${this.configService.getApiUrl()}/stats/students?month=${month}`;
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
        return this.http.get<Stats>(url, {});
    }

    getStatsByExam(examId: string): Observable<Stats> {
        let url: string = `${this.configService.getApiUrl()}/stats/by-exam/${examId}`;
        return this.http.get<Stats>(url, {});
    }

    getTeachersStats(params: FilterParams): Observable<Stats> {
        let url: string = `${this.configService.getApiUrl()}/teachers`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}?districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        return this.http.get<Stats>(url, {});
    }

    getSchoolsStats(params: FilterParams): Observable<Stats> {
        let url: string = `${this.configService.getApiUrl()}/stats/schools`;
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}?districtIds=${params.districtIds}`;
        }
        return this.http.get<Stats>(url, {});
    }

    getDistrictsStats(): Observable<Stats> {
        let url: string = `${this.configService.getApiUrl()}/stats/districts`;
        return this.http.get<Stats>(url, {});
    }
}
