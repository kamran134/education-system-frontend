import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { School, SchoolResponse } from '../../../core/models/school.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ApiResponse } from '../../../core/models/response.model';
import { RepairingResults } from '../../../core/models/student.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SchoolService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getSchools(params: FilterParams): Observable<SchoolResponse> {
        let url: string = `${this.configService.getApiUrl()}/schools`;
        if (params.page && params.size) {
            url = `${url}?page=${params.page}&size=${params.size}`;
        }
        if ((!params.page || !params.size) && params.districtIds) {
            url = `${url}?districtIds=${params.districtIds}`;
        } else if (params.districtIds) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        if (params.search) {
            // append search param for name-based lookups
            url = `${url}&search=${encodeURIComponent(params.search)}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        return this.http.get<ApiResponse<SchoolResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getSchoolsForFilter(params: FilterParams): Observable<SchoolResponse> {
        let url: string = `${this.configService.getApiUrl()}/schools/filter`;
        if (params.districtIds) {
            url = `${url}?districtIds=${params.districtIds}`;
        }
        return this.http.get<ApiResponse<SchoolResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools`;
        return this.http.post<ApiResponse<any>>(url, school, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${school._id}`;
        return this.http.put<ApiResponse<any>>(url, school, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteSchool(schoolId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteSchools(schoolIds: string): Observable<any> {
        console.log(schoolIds);
        const url: string = `${this.configService.getApiUrl()}/schools/delete/${schoolIds}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    repairSchools(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/schools/repair`;
        return this.http.get<ApiResponse<RepairingResults>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/schools/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateSchoolsStats(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/update-stats`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
