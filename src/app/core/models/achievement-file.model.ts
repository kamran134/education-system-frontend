/** Файлы «Uğurlar» профиля учителя/школы (UGURLAR_FILES_TASK.md). Значения entityType совпадают
 *  с ProfileChangeEntityType: файловая операция едет в payload той же заявки модерации. */
export type AchievementFileEntityType = 'teacher' | 'school';

export interface AchievementFile {
    id: number;
    originalName: string;
    mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
    sizeBytes: number;
    status: 'pending' | 'approved';
    /** Владельцу/админу: на файл подана заявка на удаление, он ещё виден. Остальным всегда false. */
    pendingRemoval: boolean;
    uploadedAt: string;
    /** Подписанные короткоживущие ссылки — в list() уже превращены в абсолютные. */
    fileUrl: string;
    downloadUrl: string;
    thumbUrl: string | null;
}

export interface AchievementFileList {
    files: AchievementFile[];
    /** Источник истины о правах — сервер; профиль сам права не вычисляет. */
    canManage: boolean;
    limit: number;
}
