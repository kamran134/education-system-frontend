import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "../../../core/services/config.service";
import { UserParams } from "../../../core/models/filterParams.model";
import { Observable } from "rxjs";
import { UserResponse, UserEdit } from "../../../core/models/user.model";
import { UserSettings } from "../../../core/models/settings.model";
import { ResponseHandlerUtil } from "../../../core/utils/response-handler.util";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    
    constructor(private http: HttpClient, private configService: ConfigService) { }

    /**
     * Fetches users based on the provided parameters.
     * @param userParams - Parameters to filter users.
     * @returns An observable containing user data.
     */

    getUsers(userParams: UserParams): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        let params = new HttpParams();
        if (userParams.page != null)      params = params.set('page', userParams.page);
        if (userParams.size != null)      params = params.set('size', userParams.size);
        if (userParams.email)             params = params.set('email', userParams.email);
        if (userParams.role)              params = params.set('role', userParams.role);
        if (userParams.isApproved != null) params = params.set('isApproved', userParams.isApproved);
        if (userParams.createdAt)         params = params.set('createdAt', userParams.createdAt.toISOString());
        if (userParams.updatedAt)         params = params.set('updatedAt', userParams.updatedAt.toISOString());
        return this.http.get<UserResponse>(url, { params, withCredentials: true });
    }

    createUser(user: UserEdit): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        return this.http.post<UserResponse>(url, user, { withCredentials: true });
    }

    editUser(user: UserEdit): Observable<UserResponse> {
        const url = `${this.configService.getApiUrl()}/users`;
        return this.http.put<any>(url, user, { withCredentials: true });
    }

    deleteUser(id: string): Observable<{message: string}> {
        const url = `${this.configService.getApiUrl()}/users/${id}`;
        return this.http.delete<{message: string}>(url, { withCredentials: true });
    }

    getRatingColumns(id: string): Observable<UserSettings> {
        const url = `${this.configService.getApiUrl()}/user-settings?userId=${id}`;
        return this.http.get<any>(url, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<UserSettings>(response))
        );
    }

    saveRatingColumns(settings: UserSettings): Observable<{userSettings: UserSettings, message: string}> {
        const url = `${this.configService.getApiUrl()}/user-settings`;
        return this.http.put<any>(url, settings, { withCredentials: true }).pipe(
            map(response => ResponseHandlerUtil.extractData<{userSettings: UserSettings, message: string}>(response))
        );
    }
}