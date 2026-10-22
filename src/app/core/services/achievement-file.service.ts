import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { PermissionsService } from './permissions.service';
import { ProfileChangeService } from './profile-change.service';
import { ResponseHandlerUtil } from '../utils/response-handler.util';
import { AchievementFile, AchievementFileEntityType, AchievementFileList } from '../models/achievement-file.model';

/**
 * Клиент файлов «Uğurlar» (UGURLAR_FILES_TASK.md). Статус ответа несёт смысл: 201/200 — применено
 * сразу (админ), 202 — ушло в очередь модерации (владелец).
 */
@Injectable({
    providedIn: 'root'
})
export class AchievementFileService {
    constructor(
        private http: HttpClient,
        private configService: ConfigService,
        private permissions: PermissionsService,
        private profileChangeService: ProfileChangeService
    ) {}

    private get baseUrl(): string {
        return `${this.configService.getApiUrl()}/achievement-files`;
    }

    /** Сервер отдаёт относительные /api/... ссылки: дев-стенд живёт на другом origin, чем прод. */
    private absolute(file: AchievementFile): AchievementFile {
        return {
            ...file,
            fileUrl: this.configService.resolveAssetUrl(file.fileUrl)!,
            downloadUrl: this.configService.resolveAssetUrl(file.downloadUrl)!,
            thumbUrl: this.configService.resolveAssetUrl(file.thumbUrl),
        };
    }

    /** Счётчик очереди в меню админский; у владельца этот запрос вернул бы 403 и он его не показывает. */
    private refreshCounterForModerator(): void {
        if (this.permissions.canAccessRoute('canAccessProfileChanges')) {
            this.profileChangeService.refreshPendingCount();
        }
    }

    list(entityType: AchievementFileEntityType, entityId: number): Observable<AchievementFileList> {
        return this.http.get<any>(`${this.baseUrl}/${entityType}/${entityId}`, { withCredentials: true })
            .pipe(map((response) => {
                const data = ResponseHandlerUtil.extractData<AchievementFileList>(response);
                return { ...data, files: data.files.map((f) => this.absolute(f)) };
            }));
    }

    upload(entityType: AchievementFileEntityType, entityId: number, file: File): Observable<{ file: AchievementFile; pending: boolean }> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<any>(`${this.baseUrl}/${entityType}/${entityId}`, formData, { withCredentials: true, observe: 'response' })
            .pipe(
                map((response: HttpResponse<any>) => ({
                    file: this.absolute(ResponseHandlerUtil.extractData<AchievementFile>(response.body)),
                    pending: response.status === 202,
                })),
                tap(() => this.refreshCounterForModerator())
            );
    }

    delete(id: number): Observable<{ pending: boolean }> {
        return this.http.delete<any>(`${this.baseUrl}/${id}`, { withCredentials: true, observe: 'response' })
            .pipe(
                map((response: HttpResponse<any>) => ({ pending: response.status === 202 })),
                tap(() => this.refreshCounterForModerator())
            );
    }

    cancelRemoval(id: number): Observable<void> {
        return this.http.post<any>(`${this.baseUrl}/${id}/cancel-removal`, {}, { withCredentials: true })
            .pipe(
                map(() => undefined),
                tap(() => this.refreshCounterForModerator())
            );
    }
}
