import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { Observable } from 'rxjs';
import { Teacher, TeacherResponse } from '../../../core/models/teacher.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { ApiResponse } from '../../../core/models/response.model';
import { RepairingResults } from '../../../core/models/student.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class TeacherService {

  constructor(private http: HttpClient, private configService: ConfigService) { }

    getTeachers(params: FilterParams): Observable<TeacherResponse> {
        let url: string = `${this.configService.getApiUrl()}/teachers`;
        const queryParams: string[] = [];
        
        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }
        
        if (params.districtIds && params.districtIds.length > 0) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }
        
        if (params.schoolIds && params.schoolIds.length > 0) {
            queryParams.push(`schoolIds=${params.schoolIds}`);
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
        
        return this.http.get<ApiResponse<TeacherResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getTeacherById(teacherId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/teachers/${teacherId}`;
        return this.http.get<ApiResponse<any>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getTeachersForFilter(params: FilterParams): Observable<TeacherResponse> {
        let url: string = `${this.configService.getApiUrl()}/teachers/filter`;
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}?schoolIds=${params.schoolIds}`;
        }
        return this.http.get<ApiResponse<TeacherResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createTeacher(teacher: Teacher): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/teachers`;
        return this.http.post<ApiResponse<any>>(url, teacher, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateTeacher(teacher: Teacher): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/teachers/${teacher._id}`;
        return this.http.put<ApiResponse<any>>(url, teacher, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteTeacher(teacherId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/teachers/${teacherId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteTeachers(teacherIds: string): Observable<any> {
        console.log(teacherIds);
        const url: string = `${this.configService.getApiUrl()}/teachers/delete/${teacherIds}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    repairTeachers(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/teachers/repair`;
        return this.http.get<ApiResponse<RepairingResults>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/teachers/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateTeachersStats(): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/teachers/update-stats`;
        console.log('updateTeachersStats called');
        return this.http.post<ApiResponse<any>>(url, {}, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
