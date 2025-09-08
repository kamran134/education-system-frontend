import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { School, SchoolResponse } from '../../../core/models/school.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ResponseFromBackend } from '../../../core/models/response.model';
import { RepairingResults } from '../../../core/models/student.model';

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
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        return this.http.get<SchoolResponse>(url);
    }

    getSchoolsForFilter(params: FilterParams): Observable<SchoolResponse> {
        let url: string = `${this.configService.getApiUrl()}/schools/filter`;
        if (params.districtIds) {
            url = `${url}?districtIds=${params.districtIds}`;
        }
        return this.http.get<SchoolResponse>(url);
    }

    createSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools`;
        return this.http.post(url, school, { withCredentials: true });
    }

    updateSchool(school: School): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${school._id}`;
        return this.http.put(url, school, { withCredentials: true });
    }

    deleteSchool(schoolId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/schools/${schoolId}`;
        return this.http.delete(url, { withCredentials: true });
    }

    deleteSchools(schoolIds: string): Observable<any> {
        console.log(schoolIds);
        const url: string = `${this.configService.getApiUrl()}/schools/delete/${schoolIds}`;
        return this.http.delete(url, { withCredentials: true });
    }

    repairSchools(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/schools/repair`;
        return this.http.get<RepairingResults>(url, { withCredentials: true });
    }

    uploadFile(file: File): Observable<ResponseFromBackend> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ResponseFromBackend>(`${this.configService.getApiUrl()}/schools/upload`, formData, { withCredentials: true });
    }
}
