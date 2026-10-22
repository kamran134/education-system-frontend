import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { DeletionCounts, DeletionsParams, DeletionsResult } from '../../../core/models/deletion.model';

/** «Silinənlər» — soft-deleted districts / schools / teachers / students (admin + superadmin only). */
@Injectable({
    providedIn: 'root'
})
export class DeletionsService {

    constructor(private http: HttpClient, private configService: ConfigService) { }

    /** Keeps the server's message (e.g. the 409 «Əvvəlcə ... bərpa edin») so the UI can show it as is. */
    private handleError(error: HttpErrorResponse): Observable<never> {
        const message = error.error?.message || error.message || 'Xidmət xətası baş verdi';
        return throwError(() => new Error(message));
    }

    getDeletions(p: DeletionsParams): Observable<DeletionsResult> {
        const url = `${this.configService.getApiUrl()}/deletions`;
        let params = new HttpParams().set('page', p.page).set('size', p.size);
        if (p.type)   params = params.set('type', p.type);
        if (p.search) params = params.set('search', p.search);
        return this.http.get<ApiResponse<DeletionsResult>>(url, { params, withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<DeletionsResult>(response)),
            catchError(this.handleError.bind(this))
        );
    }

    restore(id: number): Observable<{ restored: DeletionCounts }> {
        const url = `${this.configService.getApiUrl()}/deletions/${id}/restore`;
        return this.http.post<ApiResponse<{ restored: DeletionCounts }>>(url, {}, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<{ restored: DeletionCounts }>(response)),
            catchError(this.handleError.bind(this))
        );
    }
}
