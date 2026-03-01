import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { Booklet, BookletResponse } from '../../../core/models/booklet.model';

export interface BookletUploadResult {
    processedCount: number;
    errors: string[];
}

export interface BookletListParams {
    examId?: string;
    districtId?: string;
    page?: number;
    size?: number;
    sortColumn?: string;
    sortDirection?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BookletService {

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {}

    uploadBooklets(file: File, examId: string): Observable<BookletUploadResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', examId);

        return this.http
            .post<ApiResponse<BookletUploadResult>>(
                `${this.configService.getApiUrl()}/booklets/upload`,
                formData,
                { withCredentials: true }
            )
            .pipe(map(response => ResponseHandlerUtil.extractData<BookletUploadResult>(response)));
    }

    getBooklets(params: BookletListParams): Observable<BookletResponse> {
        const query: string[] = [];
        if (params.examId)         query.push(`examId=${params.examId}`);
        if (params.districtId)     query.push(`districtId=${params.districtId}`);
        if (params.page != null)   query.push(`page=${params.page}`);
        if (params.size != null)   query.push(`size=${params.size}`);
        if (params.sortColumn)     query.push(`sortColumn=${params.sortColumn}`);
        if (params.sortDirection)  query.push(`sortDirection=${params.sortDirection}`);

        const url = `${this.configService.getApiUrl()}/booklets${query.length ? '?' + query.join('&') : ''}`;
        return this.http
            .get<ApiResponse<BookletResponse>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData<BookletResponse>(response)));
    }

    getBookletById(id: string): Observable<Booklet> {
        return this.http
            .get<ApiResponse<Booklet>>(
                `${this.configService.getApiUrl()}/booklets/${id}`,
                { withCredentials: true }
            )
            .pipe(map(response => ResponseHandlerUtil.extractData<Booklet>(response)));
    }

    /** Public endpoint — no credentials required */
    getBookletPublic(id: string): Observable<Booklet> {
        return this.http
            .get<ApiResponse<Booklet>>(`${this.configService.getApiUrl()}/booklets/public/${id}`)
            .pipe(map(response => ResponseHandlerUtil.extractData<Booklet>(response)));
    }

    updateBooklet(id: string, data: { name?: string; districtId?: string }): Observable<Booklet> {
        return this.http
            .put<ApiResponse<Booklet>>(
                `${this.configService.getApiUrl()}/booklets/${id}`,
                data,
                { withCredentials: true }
            )
            .pipe(map(response => ResponseHandlerUtil.extractData<Booklet>(response)));
    }

    deleteBooklet(id: string): Observable<any> {
        return this.http
            .delete<ApiResponse<any>>(
                `${this.configService.getApiUrl()}/booklets/${id}`,
                { withCredentials: true }
            )
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
