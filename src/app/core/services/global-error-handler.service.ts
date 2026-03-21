import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: unknown): void {
        if (error instanceof HttpErrorResponse) {
            // HTTP errors are already handled by the auth interceptor and services
            return;
        }

        const message = error instanceof Error ? error.message : String(error);

        // Avoid logging chunk-load errors as critical (common with lazy loading)
        if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
            console.warn('[GlobalErrorHandler] Chunk load error — page reload may be required');
            return;
        }

        console.error('[GlobalErrorHandler] Unhandled error:', message);
    }
}
