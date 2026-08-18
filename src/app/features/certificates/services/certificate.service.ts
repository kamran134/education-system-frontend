import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import {
    CertificateAvailability,
    CertificateField,
    CertificateTemplate,
    IssuedCertificate,
} from '../../../core/models/certificate.model';

@Injectable({
    providedIn: 'root',
})
export class CertificateService {
    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {}

    private get baseUrl(): string {
        return `${this.configService.getApiUrl()}/certificates`;
    }

    // ---- Конструктор шаблонов (админ) ----

    listTemplates(): Observable<CertificateTemplate[]> {
        return this.http
            .get<ApiResponse<CertificateTemplate[]>>(`${this.baseUrl}/templates`)
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateTemplate[]>(r)));
    }

    defaultLayout(): Observable<CertificateField[]> {
        return this.http
            .get<ApiResponse<CertificateField[]>>(`${this.baseUrl}/templates/default-layout`)
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateField[]>(r)));
    }

    getTemplate(id: number): Observable<CertificateTemplate> {
        return this.http
            .get<ApiResponse<CertificateTemplate>>(`${this.baseUrl}/templates/${id}`)
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateTemplate>(r)));
    }

    createTemplate(data: {
        awardCode: string;
        levelCode: string | null;
        name: string;
        image: File;
    }): Observable<CertificateTemplate> {
        const form = new FormData();
        form.append('image', data.image);
        form.append('awardCode', data.awardCode);
        if (data.levelCode) form.append('levelCode', data.levelCode);
        form.append('name', data.name);
        return this.http
            .post<ApiResponse<CertificateTemplate>>(`${this.baseUrl}/templates`, form)
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateTemplate>(r)));
    }

    updateTemplateFields(id: number, fields: CertificateField[], active?: boolean): Observable<CertificateTemplate> {
        return this.http
            .put<ApiResponse<CertificateTemplate>>(`${this.baseUrl}/templates/${id}`, { fields, active })
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateTemplate>(r)));
    }

    replaceTemplateImage(id: number, image: File): Observable<CertificateTemplate> {
        const form = new FormData();
        form.append('image', image);
        return this.http
            .post<ApiResponse<CertificateTemplate>>(`${this.baseUrl}/templates/${id}/image`, form)
            .pipe(map((r) => ResponseHandlerUtil.extractData<CertificateTemplate>(r)));
    }

    deleteTemplate(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/templates/${id}`).pipe(map(() => undefined));
    }

    // studentResultId не передан -> сервер подставляет данные примера заказчика (§7 плана)
    previewTemplate(id: number, fields: CertificateField[], studentResultId?: number): Observable<Blob> {
        return this.http.post(
            `${this.baseUrl}/templates/${id}/preview`,
            { fields, studentResultId },
            { responseType: 'blob' }
        );
    }

    listIssued(page: number, size: number): Observable<{ rows: IssuedCertificate[]; total: number }> {
        return this.http
            .get<ApiResponse<{ rows: IssuedCertificate[]; total: number }>>(
                `${this.baseUrl}/issued?page=${page}&size=${size}`
            )
            .pipe(map((r) => ResponseHandlerUtil.extractData<{ rows: IssuedCertificate[]; total: number }>(r)));
    }

    revokeIssued(id: number, reason: string): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.baseUrl}/issued/${id}/revoke`, { reason }).pipe(map(() => undefined));
    }

    // ---- Скачивание — доступ как у /students/:id, без RBAC-гейта (см. certificate.model.ts) ----

    availabilityForStudent(studentId: number): Observable<Record<number, CertificateAvailability>> {
        return this.http
            .get<ApiResponse<Record<number, CertificateAvailability>>>(
                `${this.baseUrl}/availability/student/${studentId}`
            )
            .pipe(map((r) => ResponseHandlerUtil.extractData<Record<number, CertificateAvailability>>(r)));
    }

    downloadForResult(studentResultId: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/result/${studentResultId}`, { responseType: 'blob' });
    }

    // ---- Публичная проверка (без авторизации, отдельный /api/public) ----

    verifyByToken(token: string): Observable<{
        valid: boolean;
        serial?: string;
        issuedAt?: string;
        revokedAt?: string | null;
        data?: IssuedCertificate['data'];
    }> {
        return this.http
            .get<ApiResponse<any>>(`${this.configService.getApiUrl()}/public/certificates/${token}`)
            .pipe(map((r) => ResponseHandlerUtil.extractData(r)));
    }
}
