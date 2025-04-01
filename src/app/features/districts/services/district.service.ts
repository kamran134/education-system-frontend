import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DistrictData } from '../../../core/models/district.model';
import { ConfigService } from '../../../core/services/config.service';
import { ResponseFromBackend } from '../../../core/models/response.model';
import { FilterParams } from '../../../core/models/filterParams.model';

@Injectable({
    providedIn: 'root'
})
export class DistrictService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getDistricts(params: FilterParams): Observable<DistrictData> {
        let url: string = `${this.configService.getApiUrl()}/districts`;
        if (params.sortColumn && params.sortDirection) {
            url = `${url}?sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        return this.http.get<DistrictData>(url);
    }

    addDistrict(district: {name: string, code: number}): Observable<ResponseFromBackend> {
        const url: string = `${this.configService.getApiUrl()}/districts`;
        return this.http.post<ResponseFromBackend>(url, district, { withCredentials: true });
    }

    deleteDistrict(districtId: string): Observable<ResponseFromBackend> {
        const url: string = `${this.configService.getApiUrl()}/districts/${districtId}`;
        return this.http.delete<ResponseFromBackend>(url, { withCredentials: true });
    }
}
