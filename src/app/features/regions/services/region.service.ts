import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Region, RegionResponse } from '../../../core/models/region.model';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RegionService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getRegions(params: FilterParams): Observable<RegionResponse> {
        let url: string = `${this.configService.getApiUrl()}/regions`;
        const queryParams: string[] = [];

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

        return this.http.get<ApiResponse<RegionResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getRegionsForFilter(): Observable<Region[]> {
        const url: string = `${this.configService.getApiUrl()}/regions/filter`;
        return this.http.get<ApiResponse<Region[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getRegionById(regionId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/regions/${regionId}`;
        return this.http.get<ApiResponse<any>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    addRegion(region: { name: string, code: number, regionOfTheYearScore?: number, active?: boolean }): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/regions`;
        return this.http.post<ApiResponse<any>>(url, region, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateRegion(regionId: string | number, region: { name: string, code: number, regionOfTheYearScore?: number, active?: boolean }): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/regions/${regionId}`;
        return this.http.put<ApiResponse<any>>(url, region, { withCredentials: true })
            .pipe(map(response => response));
    }

    deleteRegion(regionId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/regions/${regionId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadAvatar(regionId: string | number, formData: FormData): Observable<{ avatarUrl: string }> {
        const url: string = `${this.configService.getApiUrl()}/regions/${regionId}/avatar`;
        return this.http.post<ApiResponse<{ avatarUrl: string }>>(url, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteAvatar(regionId: string | number): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/regions/${regionId}/avatar`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
