import { HttpResponse } from '@angular/common/http';

/**
 * Saves a blob response under the server-chosen name (Content-Disposition), falling back to
 * `fallbackName`. The backend builds readable ASCII names for generated files (e.g. results
 * templates: exam/section slugs) — the client shouldn't invent a second naming scheme.
 */
export function saveBlobResponse(response: HttpResponse<Blob>, fallbackName: string): void {
    const header = response.headers.get('Content-Disposition') || '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    const name = match ? decodeURIComponent(match[1]) : fallbackName;

    const url = URL.createObjectURL(response.body as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * With responseType 'blob' HttpClient doesn't parse a JSON error body — `error.error` is a Blob.
 * Resolves the server's `message`, or `fallback` when there is none.
 */
export async function blobErrorMessage(error: any, fallback: string): Promise<string> {
    if (error?.error instanceof Blob) {
        try {
            const parsed = JSON.parse(await error.error.text());
            return parsed?.message || fallback;
        } catch {
            return fallback;
        }
    }
    return error?.error?.message || fallback;
}
