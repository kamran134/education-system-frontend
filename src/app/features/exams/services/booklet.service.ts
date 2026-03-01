import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

export interface BookletUploadResult {
    processedCount: number;
    errors: string[];
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
}
