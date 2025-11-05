import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { FilterParams } from '../../../core/models/filterParams.model';
import { RepairingResults, Student, StudentResponse, StudentWithResult, StudentWithResultResponse, StudentApiResponse } from '../../../core/models/student.model';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { map } from 'rxjs/operators';
import { ExamResult } from '../../../core/models/examResult.model';

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getStudents(params: FilterParams): Observable<StudentApiResponse> {
        let url: string = `${this.configService.getApiUrl()}/students`;
        const queryParams: string[] = [];
        
        if (params.page && params.size) {
            queryParams.push(`page=${params.page}`);
            queryParams.push(`size=${params.size}`);
        }
        
        if (params.defective) {
            queryParams.push('defective=true');
        }
        
        if (params.districtIds && params.districtIds.length > 0) {
            queryParams.push(`districtIds=${params.districtIds}`);
        }
        
        if (params.schoolIds && params.schoolIds.length > 0) {
            queryParams.push(`schoolIds=${params.schoolIds}`);
        }
        
        if (params.teacherIds && params.teacherIds.length > 0) {
            queryParams.push(`teacherIds=${params.teacherIds}`);
        }
        
        if (params.grades && params.grades.length > 0) {
            queryParams.push(`grades=${params.grades}`);
        }
        
        if (params.examIds && params.examIds.length > 0) {
            queryParams.push(`examIds=${params.examIds}`);
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
        
        return this.http.get<ApiResponse<StudentApiResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    getStudentById(studentId: string): Observable<StudentWithResultResponse> {
        let url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.get<ApiResponse<StudentWithResultResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    searchStudents(searchString: string): Observable<StudentApiResponse> {
        let url: string = `${this.configService.getApiUrl()}/students/search/${searchString}`;
        return this.http.get<ApiResponse<StudentApiResponse>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    createStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students`;
        return this.http.post<ApiResponse<StudentWithResult>>(url, student, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students/${student._id}`;
        return this.http.put<ApiResponse<StudentWithResult>>(url, student, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteStudent(studentId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    deleteStudents(studentIds: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/delete/${studentIds}`;
        return this.http.delete<ApiResponse<any>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    repairStudents(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/students/repair`;
        return this.http.get<ApiResponse<RepairingResults>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<any>>(`${this.configService.getApiUrl()}/students/upload`, formData, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    updateStudentResult(resultId: string, result: Partial<ExamResult>): Observable<ExamResult> {
        const url: string = `${this.configService.getApiUrl()}/student-results/${resultId}`;
        return this.http.put<ApiResponse<ExamResult>>(url, result, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
