
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { District, DistrictResponse, DistrictProfileUpdate } from '../../../core/models/district.model';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class DistrictService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getDistricts(params: FilterParams): Observable<DistrictResponse> {
        let url: string = `${this.configService.getApiUrl()}/districts`;
        const queryParams: string[] = [];

        if (params.regionIds && params.regionIds.length > 0) {
            queryParams.push(`regionIds=${params.regionIds}`);
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

        return this.http.get<ApiResponse<DistrictResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getDistrictsForFilter(params?: FilterParams): Observable<District[]> {
        let url: string = `${this.configService.getApiUrl()}/districts/filter`;
        if (params?.regionIds && params.regionIds.length > 0) {
            url = `${url}?regionIds=${params.regionIds}`;
        }
        return this.http.get<ApiResponse<District[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getDistrictById(districtId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}`;
        return this.http.get<ApiResponse<any>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    addDistrict(district: {name: string, code: number, studentCount: number, regionId?: number | null}): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts`;
        return this.http.post<ApiResponse<any>>(url, district, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateDistrict(districtId: string | number, district: {name: string, code: number, studentCount: number, regionId?: number | null}): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}`;
        return this.http.put<ApiResponse<any>>(url, district, { withCredentials: true })
            .pipe(map(response => response));
    }

    updateDistrictProfile(districtId: string | number, data: DistrictProfileUpdate): Observable<District> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}/profile`;
        return this.http.patch<ApiResponse<District>>(url, data, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteDistrict(districtId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateDistrictsStats(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/update-stats`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadAvatar(districtId: string | number, formData: FormData): Observable<{ avatarUrl: string }> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}/avatar`;
        return this.http.post<ApiResponse<{ avatarUrl: string }>>(url, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAvatar(districtId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}/avatar`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
