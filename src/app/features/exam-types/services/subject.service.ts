import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subject, SubjectInput } from '../../../core/models/subject.model';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getSubjects(): Observable<Subject[]> {
        const url: string = `${this.configService.getApiUrl()}/subjects`;
        return this.http.get<ApiResponse<Subject[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createSubject(input: SubjectInput): Observable<Subject> {
        const url: string = `${this.configService.getApiUrl()}/subjects`;
        return this.http.post<ApiResponse<Subject>>(url, input, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateSubject(code: string, input: Partial<SubjectInput>): Observable<Subject> {
        const url: string = `${this.configService.getApiUrl()}/subjects/${code}`;
        return this.http.put<ApiResponse<Subject>>(url, input, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
