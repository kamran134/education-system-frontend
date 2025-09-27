import { ApiResponse } from '../models/response.model';

/**
 * Утилита для обработки ответов от API с поддержкой как старого, так и нового формата
 */
export class ResponseHandlerUtil {
    
    /**
     * Извлекает данные из ответа API с поддержкой обоих форматов
     */
    static extractData<T>(response: any): T {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response) {
            const data = response.data;
            // Защита от null/undefined для массивов
            if (Array.isArray(data) || data === null || data === undefined) {
                return data || [] as T;
            }
            return data as T;
        }
        
        // Старый формат
        if (response && typeof response === 'object' && 'data' in response) {
            const data = response.data;
            // Защита от null/undefined для массивов
            if (Array.isArray(data) || data === null || data === undefined) {
                return data || [] as T;
            }
            return data as T;
        }
        
        // Если данные напрямую в ответе
        // Защита от null/undefined для массивов
        if (Array.isArray(response) || response === null || response === undefined) {
            return response || [] as T;
        }
        return response as T;
    }
    
    /**
     * Извлекает данные с пагинацией
     */
    static extractPaginatedData<T>(response: any): { data: T[], totalCount: number } {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response && response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
                return {
                    data: response.data.data,
                    totalCount: response.data.totalCount || 0
                };
            }
        }
        
        // Старый формат
        if (response && typeof response === 'object') {
            return {
                data: response.data || [],
                totalCount: response.totalCount || 0
            };
        }
        
        return { data: [], totalCount: 0 };
    }
    
    /**
     * Извлекает сообщение из ответа
     */
    static extractMessage(response: any): string | undefined {
        if (response && typeof response === 'object') {
            return response.message;
        }
        return undefined;
    }
    
    /**
     * Проверяет успешность ответа
     */
    static isSuccess(response: any): boolean {
        // Новый формат ResponseHandler
        if (response && typeof response === 'object' && 'success' in response) {
            return response.success === true;
        }
        
        // Старый формат - считаем успешным если есть данные и нет ошибки
        if (response && typeof response === 'object') {
            return !response.error;
        }
        
        return true;
    }
}