import { UserRole } from './rbac.config';

/**
 * Роли с привязанной сущностью (self-service): их профиль — домашняя страница, и для них
 * шапка приложения сворачивается в одно меню вместо полной навигации (BASE_FIXES_TASK.md §1.2).
 * Тот же список используют HomeComponent (какой профиль считать «домом») и AppComponent
 * (какую шапку рисовать) — держим его в одном месте, чтобы не разъезжались.
 */
export const OWNER_ROLES: readonly UserRole[] = ['student', 'teacher', 'schoolDirector', 'districtRepresenter', 'regionRepresenter'];

export function isOwnerRole(role: string | null | undefined): boolean {
    return !!role && OWNER_ROLES.includes(role as UserRole);
}
