import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LevelScale } from '../../../core/models/levelScale.model';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

@Injectable({
    providedIn: 'root'
})
export class LevelScaleService {
    constructor(private http: HttpClient, private configService: ConfigService) {}

    getLevelScales(): Observable<LevelScale[]> {
        const url: string = `${this.configService.getApiUrl()}/level-scales`;
        return this.http.get<ApiResponse<LevelScale[]>>(url)
            .pipe(map(response => ResponseHandlerUtil.extractData(response)));
    }
}
