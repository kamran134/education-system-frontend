import { ApiResponse } from '../models/response.model';

/**
 * Утилита для обработки ответов от API с поддержкой как старого, так и нового формата
 */
export class ResponseHandlerUtil {

    /**
     * Извлекает данные из ответа API с поддержкой обоих форматов
     */
    static extractData<T>(response: unknown): T {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response) {
            const data = (response as { data?: unknown }).data;
            // Защита от null/undefined для массивов
            if (Array.isArray(data) || data === null || data === undefined) {
                return (data ?? []) as unknown as T;
            }
            return data as unknown as T;
        }

        // Старый формат
        if (response && typeof response === 'object' && 'data' in response) {
            const data = (response as { data?: unknown }).data;
            // Защита от null/undefined для массивов
            if (Array.isArray(data) || data === null || data === undefined) {
                return (data ?? []) as unknown as T;
            }
            return data as unknown as T;
        }

        // Если данные напрямую в ответе
        // Защита от null/undefined для массивов
        if (Array.isArray(response) || response === null || response === undefined) {
            return (response ?? []) as unknown as T;
        }
        return response as unknown as T;
    }

    /**
     * Извлекает данные с пагинацией
     */
    static extractPaginatedData<T>(response: unknown): { data: T[], totalCount: number } {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response) {
            const r = response as { data?: { data?: unknown; totalCount?: unknown } };
            if (r.data?.data && Array.isArray(r.data.data)) {
                return {
                    data: r.data.data as T[],
                    totalCount: typeof r.data.totalCount === 'number' ? r.data.totalCount : 0
                };
            }
        }

        // Старый формат
        if (response && typeof response === 'object') {
            const r = response as { data?: unknown; totalCount?: unknown };
            return {
                data: Array.isArray(r.data) ? r.data as T[] : [],
                totalCount: typeof r.totalCount === 'number' ? r.totalCount : 0
            };
        }

        return { data: [], totalCount: 0 };
    }

    /**
     * Извлекает сообщение из ответа
     */
    static extractMessage(response: unknown): string | undefined {
        if (response && typeof response === 'object' && 'message' in response) {
            const msg = (response as { message?: unknown }).message;
            return typeof msg === 'string' ? msg : undefined;
        }
        return undefined;
    }

    /**
     * Проверяет успешность ответа
     */
    static isSuccess(response: unknown): boolean {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response) {
            return (response as { success: unknown }).success === true;
        }

        // Старый формат - считаем успешным если есть данные и нет ошибки
        if (response && typeof response === 'object') {
            return !('error' in response && (response as { error?: unknown }).error);
        }

        return true;
    }
}
