import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { MetodikaContent } from '../metodika-content.model';

/**
 * GET — публичный (страница «İSİM metodikası» без авторизации), PUT/DELETE — только
 * admin/superadmin (см. metodika.routes.ts на бэке). Используется и публичной страницей,
 * и админским редактором (dashboard/components/metodika-editor).
 */
@Injectable({
    providedIn: 'root'
})
export class MetodikaService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    getContent(): Observable<Partial<MetodikaContent> | null> {
        const url = `${this.configService.getApiUrl()}/metodika`;
        return this.http.get<ApiResponse<{ content: Partial<MetodikaContent> | null }>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData<{ content: Partial<MetodikaContent> | null }>(response).content));
    }

    saveContent(content: MetodikaContent): Observable<MetodikaContent> {
        const url = `${this.configService.getApiUrl()}/metodika`;
        return this.http.put<ApiResponse<{ content: MetodikaContent }>>(url, content, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData<{ content: MetodikaContent }>(response).content));
    }

    resetContent(): Observable<void> {
        const url = `${this.configService.getApiUrl()}/metodika`;
        return this.http.delete<ApiResponse<null>>(url, { withCredentials: true })
            .pipe(map(() => undefined));
    }
}
