import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../../core/services/config.service';
import { FilterParams } from '../../../core/models/filterParams.model';
import { RepairingResults, Student, StudentData, StudentWithResult } from '../../../core/models/student.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getStudents(params: FilterParams): Observable<StudentData> {
        let url: string = `${this.configService.getApiUrl()}/students?page=${params.page}&size=${params.size}`;
        if (params.defective) {
            url = `${url}&defective=true`;
        }
        if (params.districtIds && params.districtIds.length > 0) {
            url = `${url}&districtIds=${params.districtIds}`;
        }
        if (params.schoolIds && params.schoolIds.length > 0) {
            url = `${url}&schoolIds=${params.schoolIds}`;
        }
        if (params.teacherIds && params.teacherIds.length > 0) {
            url = `${url}&teacherIds=${params.teacherIds}`;
        }
        if (params.grades && params.grades.length > 0) {
            url = `${url}&grades=${params.grades}`;
        }
        if (params.examIds && params.examIds.length > 0) {
            url = `${url}&examIds=${params.examIds}`
        }
        if (params.sortColumn && params.sortDirection) {
            url = `${url}&sortColumn=${params.sortColumn}&sortDirection=${params.sortDirection}`;
        }
        if (params.code) {
            url = `${url}&code=${params.code}`;
        }
        return this.http.get<StudentData>(url);
    }

    getStudentById(studentId: string): Observable<StudentWithResult> {
        let url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.get<StudentWithResult>(url);
    }

    searchStudents(searchString: string): Observable<StudentData> {
        let url: string = `${this.configService.getApiUrl()}/students/search/${searchString}`;
        return this.http.get<StudentData>(url);
    }

    createStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students`;
        return this.http.post<StudentWithResult>(url, student, { withCredentials: true });
    }

    updateStudent(student: Student): Observable<StudentWithResult> {
        const url: string = `${this.configService.getApiUrl()}/students/${student._id}`;
        return this.http.put<StudentWithResult>(url, student, { withCredentials: true });
    }

    deleteStudent(studentId: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/${studentId}`;
        return this.http.delete(url, { withCredentials: true });
    }

    deleteStudents(studentIds: string): Observable<any> {
        const url: string = `${this.configService.getApiUrl()}/students/delete/${studentIds}`;
        return this.http.delete(url, { withCredentials: true });
    }

    repairStudents(): Observable<RepairingResults> {
        const url: string = `${this.configService.getApiUrl()}/students/repair`;
        return this.http.get<RepairingResults>(url, { withCredentials: true });
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(`${this.configService.getApiUrl()}/students/upload`, formData, { withCredentials: true });
    }
}
