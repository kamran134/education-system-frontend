import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { ResponseHandlerUtil } from '../utils/response-handler.util';
import { ProfileChangeEntityType, ProfileChangeQueueRow, ProfileChangeRequest, ProfileChangeStatus } from '../models/profile-change.model';

/**
 * Клиент очереди модерации (BASE_FIXES_TASK.md §2.4/§2.7). Сами заявки создаются не отсюда —
 * они возникают как побочный эффект PATCH .../profile при статусе 202, см. школьный/учительский/
 * районный *.service.ts.
 */
@Injectable({
    providedIn: 'root'
})
export class ProfileChangeService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    private get baseUrl(): string {
        return `${this.configService.getApiUrl()}/profile-changes`;
    }

    /**
     * Бейдж-счётчик в меню «İdarəetmə» (BASE_FIXES_TASK.md §2.7) — грузится один раз при
     * инициализации шапки (app.component.ts) и дальше обновляется локально после approve/
     * reject/submit, а не поллингом.
     */
    private pendingCountSubject = new BehaviorSubject<number>(0);
    readonly pendingCount$ = this.pendingCountSubject.asObservable();

    refreshPendingCount(): void {
        this.count().subscribe({
            next: (n) => this.pendingCountSubject.next(n),
            error: () => {}
        });
    }

    listQueue(status: ProfileChangeStatus = 'pending'): Observable<ProfileChangeQueueRow[]> {
        return this.http.get<any>(`${this.baseUrl}?status=${status}`, { withCredentials: true })
            .pipe(map((response) => ResponseHandlerUtil.extractData<ProfileChangeQueueRow[]>(response)));
    }

    count(): Observable<number> {
        return this.http.get<any>(`${this.baseUrl}/count`, { withCredentials: true })
            .pipe(map((response) => ResponseHandlerUtil.extractData<{ pending: number }>(response).pending));
    }

    pendingIds(entityType: ProfileChangeEntityType): Observable<number[]> {
        return this.http.get<any>(`${this.baseUrl}/pending-ids?entityType=${entityType}`, { withCredentials: true })
            .pipe(map((response) => ResponseHandlerUtil.extractData<number[]>(response)));
    }

    /**
     * null, если у сущности нет pending-заявки — не 404, обычный успешный ответ. Не через
     * ResponseHandlerUtil.extractData: она считает null/undefined в data признаком списка и
     * подставляет [] (пустой массив — truthy!), из-за чего страница решала бы, что pending
     * есть, и падала на Object.keys(undefined) внутри баннера (поймано при ручной QA).
     */
    current(entityType: ProfileChangeEntityType, entityId: number): Observable<ProfileChangeRequest | null> {
        return this.http.get<any>(`${this.baseUrl}/current?entityType=${entityType}&entityId=${entityId}`, { withCredentials: true })
            .pipe(map((response) => (response?.data ?? null) as ProfileChangeRequest | null));
    }

    /** payload — только для сценария «Düzəliş et»: админ подтверждает СВОИ значения, не то,
     *  что изначально прислал владелец. */
    approve(id: number, payload?: Record<string, any>): Observable<ProfileChangeRequest> {
        return this.http.post<any>(`${this.baseUrl}/${id}/approve`, payload ? { payload } : {}, { withCredentials: true })
            .pipe(
                map((response) => ResponseHandlerUtil.extractData<ProfileChangeRequest>(response)),
                tap(() => this.refreshPendingCount())
            );
    }

    reject(id: number, reviewNote: string | null): Observable<ProfileChangeRequest> {
        return this.http.post<any>(`${this.baseUrl}/${id}/reject`, { reviewNote }, { withCredentials: true })
            .pipe(
                map((response) => ResponseHandlerUtil.extractData<ProfileChangeRequest>(response)),
                tap(() => this.refreshPendingCount())
            );
    }
}
