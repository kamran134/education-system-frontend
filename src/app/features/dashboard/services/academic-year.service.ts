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
}

export interface GradePromotionResult {
    academicYear: number;
    promotedCount: number;
    ceilingCount: number;
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
}
