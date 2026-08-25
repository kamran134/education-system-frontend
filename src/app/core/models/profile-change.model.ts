/** Модерация самостоятельно введённых полей профиля (BASE_FIXES_TASK.md §2.4). */
export type ProfileChangeEntityType = 'school' | 'teacher' | 'district';
export type ProfileChangeStatus = 'pending' | 'approved' | 'rejected';

export interface ProfileChangeRequest {
    id: number;
    entityType: ProfileChangeEntityType;
    entityId: number;
    payload: Record<string, any>;
    status: ProfileChangeStatus;
    submittedBy: number;
    submittedAt: string;
    reviewedBy: number | null;
    reviewedAt: string | null;
    reviewNote: string | null;
}

export interface ProfileChangeQueueRow extends ProfileChangeRequest {
    entityName: string;
    submittedByEmail: string;
    current: Record<string, any>;
}

/**
 * Результат PATCH .../profile: админ пишет сразу (`applied: true`, тело — сама сущность),
 * владелец уходит в очередь модерации (`applied: false`, тело — заявка). Различаются по HTTP
 * статусу (200 vs 202) — см. соответствующий *.service.ts. Дискриминированный union по
 * `applied`, а не необязательные поля — иначе `if (result.applied) result.entity` не сужается
 * и `entity` остаётся `T | undefined` даже под проверкой.
 */
export type ProfileSaveResult<T> =
    | { applied: true; entity: T }
    | { applied: false; pendingRequest: ProfileChangeRequest };
