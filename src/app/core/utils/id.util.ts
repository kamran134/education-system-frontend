/**
 * Сравнение id, устойчивое к формату (Mongo ObjectId-строка vs Postgres-число).
 * Бэкенд переезжает с MongoDB на PostgreSQL — id меняется со строки на число.
 * Пока переключение не завершено для всех сущностей разом, разные ответы API
 * могут временно нести id разного типа для связанных сущностей (например,
 * district уже число, а school ещё строка) — `===` в таком случае молча
 * проваливается ("559" !== 559) без ошибки, просто ничего не находит.
 */
export class IdUtil {
    /**
     * true, если оба id ссылаются на одну и ту же сущность независимо от типа (string/number).
     * null/undefined никогда не равны друг другу или чему-либо ещё.
     */
    static equals(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
        if (a === null || a === undefined || b === null || b === undefined) {
            return false;
        }
        return String(a) === String(b);
    }
}
