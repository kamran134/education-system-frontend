import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    getApiUrl(): string {
        return environment.apiUrl;
    };

    getAuthUrl(): string {
        return environment.authUrl;
    }

    /** Origin the server serves static /uploads/... files from — apiUrl without the trailing /api. */
    getAssetBaseUrl(): string {
        return this.getApiUrl().replace(/\/api\/?$/, '');
    }

    /** Prefixes a relative /uploads/... path (e.g. avatarUrl) with the asset base. Absolute URLs pass through untouched. */
    resolveAssetUrl(url?: string | null): string | null {
        if (!url) return null;
        if (/^https?:\/\//.test(url)) return url;
        return `${this.getAssetBaseUrl()}${url}`;
    }
}
