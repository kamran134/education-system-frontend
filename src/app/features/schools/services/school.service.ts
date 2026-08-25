import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { School, SchoolResponse } from '../../../core/models/school.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ApiResponse } from '../../../core/models/response.model';
import { RepairingResults } from '../../../core/models/student.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { toProfileSaveResult } from '../../../core/utils/profile-save-result.util';
import { ProfileSaveResult } from '../../../core/models/profile-change.model';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SchoolService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getSchools(params: FilterParams): Observable<SchoolResponse> {
        let url: string = `${this.configService.getApiUrl()}/schools`;
        const queryParams: string[] = [];

        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }

        if (params.districtIds) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }

        if (params.active !== undefined) {
            queryParams.push(`active=${params.active}`);
        }

        if (params.sortColumn && params.sortDirection) {
            queryParams.push(`sortColumn=${params.sortColumn}`);
            queryParams.push(`sortDirection=${params.sortDirection}`);
        }

        if (params.search) {
            queryParams.push(`search=${encodeURIComponent(params.search)}`);
        }

        if (params.code) {
            queryParams.push(`code=${params.code}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<SchoolResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getSchoolById(schoolId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}`;
        return this.http.get<ApiResponse<any>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getSchoolsForFilter(params: FilterParams): Observable<School[]> {
        let url: string = `${this.configService.getApiUrl()}/schools/filter`;
        const queryParams: string[] = [];

        if (params.districtIds) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }

        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }

        return this.http.get<ApiResponse<School[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools`;
        return this.http.post<ApiResponse<any>>(url, school, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${school.id}`;
        return this.http.put<ApiResponse<any>>(url, school, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    /**
     * Owner (schoolDirector своей школы) уходит в очередь модерации, а не пишет напрямую —
     * ответ 202 вместо 200 (BASE_FIXES_TASK.md §2.5). Различаем через observe:'response'.
     */
    updateSchoolProfile(schoolId: string | number, data: { description?: string | null; history?: string | null; directorName?: string | null; foundedYear?: number | null; achievements?: string | null }): Observable<ProfileSaveResult<School>> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}/profile`;
        return this.http.patch<ApiResponse<School>>(url, data, { withCredentials: true, observe: 'response' })
            .pipe(map(response => toProfileSaveResult<School>(response)));
    }

    deleteSchool(schoolId: string | number): Observable<any> {
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

    importLegacySchools(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(
            `${this.configService.getApiUrl()}/schools/legacy-import`,
            formData,
            { withCredentials: true }
        ).pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadAvatar(schoolId: string | number, formData: FormData): Observable<{ avatarUrl: string }> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}/avatar`;
        return this.http.post<ApiResponse<{ avatarUrl: string }>>(url, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAvatar(schoolId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}/avatar`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
