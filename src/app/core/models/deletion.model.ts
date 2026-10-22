/** Response shapes of GET /api/deletions and POST /api/deletions/:id/restore (SOFT_DELETE_TASK.md §7). */

export type DeletionEntityType = 'district' | 'school' | 'teacher' | 'student';

/** What was hidden together with the root entity (the root itself is not counted). */
export interface DeletionCounts {
    schools: number;
    teachers: number;
    students: number;
    results: number;
}

export interface DeletionItem {
    id: number;
    entityType: DeletionEntityType;
    entityId: number;
    code: number | null;
    name: string | null;
    path: { districtName: string | null; schoolName: string | null; teacherName: string | null };
    /** ISO timestamp. */
    deletedAt: string;
    deletedBy: { id: number; email: string } | null;
    counts: DeletionCounts;
}

export interface DeletionsParams {
    type?: DeletionEntityType;
    search?: string;
    page: number;
    size: number;
}

export interface DeletionsResult {
    data: DeletionItem[];
    totalCount: number;
    page: number;
    size: number;
    totalPages: number;
}
