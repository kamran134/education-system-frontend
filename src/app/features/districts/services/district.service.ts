
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DistrictResponse } from '../../../core/models/district.model';
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
        if (params.sortColumn && params.sortDirection) {
            url = `${url}?sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        return this.http.get<ApiResponse<DistrictResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    addDistrict(district: {name: string, code: number}): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts`;
        return this.http.post<ApiResponse<any>>(url, district, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteDistrict(districtId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateDistrictsStats(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/districts/update-stats`;
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
