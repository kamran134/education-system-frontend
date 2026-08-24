import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

export interface GradeBucket {
    grade: number | null;
    count: number;
    targetGrade: number | null; // null = buraxılış sinfi (və ya sinfi olmayan yazı) — dəyişmir
}

export interface GradePromotionPreview {
    windowOpen: boolean;
    alreadyPromotedThisYear: boolean;
    targetAcademicYear: number;
    byGrade: GradeBucket[];
    promotableCount: number;
    ceilingCount: number;
    currentYearClosed: boolean;
}

export interface GradePromotionResult {
    academicYear: number;
    promotedCount: number;
    ceilingCount: number;
}

export interface AcademicYearClosurePreview {
    academicYear: number;
    alreadyClosed: boolean;
    closedAt: string | null;
    closedBy: string | null;
    closedReason: 'manual' | 'auto' | null;
    counts: Record<string, { count: number; sumScore: number }>;
}

export interface AcademicYearClosureResult {
    academicYear: number;
}

@Injectable({
    providedIn: 'root'
})
export class AcademicYearService {
    constructor(private http: HttpClient, private configService: ConfigService) { }

    previewPromotion(): Observable<GradePromotionPreview> {
        const url = `${this.configService.getApiUrl()}/academic-year/promotion`;
        return this.http.get<ApiResponse<GradePromotionPreview>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    executePromotion(): Observable<GradePromotionResult> {
        const url = `${this.configService.getApiUrl()}/academic-year/promotion`;
        return this.http.post<ApiResponse<GradePromotionResult>>(url, { confirm: true }, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    previewClosure(): Observable<AcademicYearClosurePreview> {
        const url = `${this.configService.getApiUrl()}/academic-year/closure`;
        return this.http.get<ApiResponse<AcademicYearClosurePreview>>(url, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }

    executeClosure(note?: string): Observable<AcademicYearClosureResult> {
        const url = `${this.configService.getApiUrl()}/academic-year/closure`;
        return this.http.post<ApiResponse<AcademicYearClosureResult>>(url, { confirm: true, note }, { withCredentials: true })
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
