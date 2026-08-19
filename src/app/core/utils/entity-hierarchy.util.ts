import { UserInfo } from '../models/auth.models';

/**
 * Может ли текущий пользователь кликнуть в хлебную крошку АНЦЕСТОРА (район/регион выше школы,
 * регион выше района) на профильной странице. Найдено ревью 19.08.2026 (PROFILE_AS_HOME_TASK.md):
 * иерархия строго "вниз" — учитель не видит даже свою школу, школа не видит свой район.
 * Единственное исключение — крошка ведёт на СОБСТВЕННУЮ сущность пользователя (тогда это
 * легитимный переход "к себе домой", а не подъём по чужой иерархии).
 *
 * Это НЕ граница безопасности — та же проверка (canViewEntity) уже применена на бэкенде в
 * GET .../:id, вернёт 403 при прямом заходе по URL. Здесь только UX: не показывать ссылку,
 * которая всё равно упрётся в 403. Тот же принцип, что и у *hasPermission/canShowUI в rbac —
 * фронтенд только прячет UI, авторизация проверяется на сервере.
 */
export function canViewAncestorCrumb(
    user: UserInfo | null,
    targetType: 'region' | 'district' | 'school',
    targetId: number
): boolean {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'moderator') return true;

    const ownerRoleByType: Record<typeof targetType, string> = {
        region: 'regionRepresenter',
        district: 'districtRepresenter',
        school: 'schoolDirector',
    };

    return user.role === ownerRoleByType[targetType] && String(user.profile?.entityId) === String(targetId);
}
