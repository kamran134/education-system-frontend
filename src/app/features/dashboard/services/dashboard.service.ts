import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "../../../core/services/config.service";
import { UserParams } from "../../../core/models/filterParams.model";
import { Observable, throwError } from "rxjs";
import { UserResponse, UserEdit } from "../../../core/models/user.model";
import { UserSettings } from "../../../core/models/settings.model";
import { ApiResponse } from "../../../core/models/response.model";
import { ResponseHandlerUtil } from "../../../core/utils/response-handler.util";
import { catchError, map } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    constructor(private http: HttpClient, private configService: ConfigService) { }

    private handleError(error: HttpErrorResponse): Observable<never> {
        const message = error.error?.message || error.message || 'Xidmət xətası baş verdi';
        return throwError(() => new Error(message));
    }

    getUsers(userParams: UserParams): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        let params = new HttpParams();
        if (userParams.page != null)       params = params.set('page', userParams.page);
        if (userParams.size != null)       params = params.set('size', userParams.size);
        if (userParams.email)              params = params.set('email', userParams.email);
        if (userParams.role)               params = params.set('role', userParams.role);
        if (userParams.isApproved != null) params = params.set('isApproved', userParams.isApproved);
        if (userParams.createdAt)          params = params.set('createdAt', userParams.createdAt.toISOString());
        if (userParams.updatedAt)          params = params.set('updatedAt', userParams.updatedAt.toISOString());
        if (userParams.sortColumn)         params = params.set('sortColumn', userParams.sortColumn);
        if (userParams.sortDirection)      params = params.set('sortDirection', userParams.sortDirection);
        return this.http.get<UserResponse>(url, { params, withCredentials: true }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    createUser(user: UserEdit): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        return this.http.post<UserResponse>(url, user, { withCredentials: true }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    editUser(user: UserEdit): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        return this.http.put<UserResponse>(url, user, { withCredentials: true }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    deleteUser(id: string | number): Observable<{message: string}> {
        const url = `${this.configService.getApiUrl()}/users/${id}`;
        return this.http.delete<{message: string}>(url, { withCredentials: true }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    changeUserPassword(id: string | number, newPassword: string): Observable<{message: string}> {
        const url = `${this.configService.getApiUrl()}/users/${id}/password`;
        return this.http.put<{message: string}>(url, { newPassword }, { withCredentials: true }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    getRatingColumns(id: string | number): Observable<UserSettings> {
        const url = `${this.configService.getApiUrl()}/user-settings?userId=${id}`;
        return this.http.get<ApiResponse<UserSettings>>(url, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<UserSettings>(response)),
            catchError(this.handleError.bind(this))
        );
    }

    saveRatingColumns(settings: UserSettings): Observable<{userSettings: UserSettings, message: string}> {
        const url = `${this.configService.getApiUrl()}/user-settings`;
        return this.http.put<ApiResponse<{userSettings: UserSettings, message: string}>>(url, settings, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<{userSettings: UserSettings, message: string}>(response)),
            catchError(this.handleError.bind(this))
        );
    }

    getGlobalColumns(): Observable<UserSettings> {
        const url = `${this.configService.getApiUrl()}/user-settings/global`;
        return this.http.get<ApiResponse<UserSettings>>(url, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<UserSettings>(response)),
            catchError(this.handleError.bind(this))
        );
    }

    saveGlobalColumns(settings: Partial<UserSettings>): Observable<{message: string}> {
        const url = `${this.configService.getApiUrl()}/user-settings/global`;
        return this.http.put<ApiResponse<{message: string}>>(url, settings, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<{message: string}>(response)),
            catchError(this.handleError.bind(this))
        );
    }
}
