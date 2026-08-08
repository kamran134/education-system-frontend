/**
 * RBAC (Role-Based Access Control) Configuration
 *
 * Централизованная конфигурация прав доступа для всех ролей в системе.
 * Определяет какие маршруты, действия и UI элементы доступны каждой роли.
 */

export type UserRole =
    | 'superadmin'
    | 'admin'
    | 'moderator'
    | 'regionRepresenter'
    | 'districtRepresenter'
    | 'schoolDirector'
    | 'teacher'
    | 'student';

export interface RolePermissions {
    // Навигация и маршруты
    routes: {
        canAccessAdminPanel: boolean;          // /admin/*
        canAccessUserManagement: boolean;      // /admin/users
        canAccessRatingColumns: boolean;       // /admin/rating-columns
        canAccessProfile: boolean;             // /profile
        canAccessStats: boolean;               // /stats
        canAccessStatistics: boolean;          // /statistics
        canAccessRegions: boolean;             // /regions
        canAccessDistricts: boolean;           // /districts
        canAccessSchools: boolean;             // /schools
        canAccessTeachers: boolean;            // /teachers
        canAccessStudents: boolean;            // /students
        canAccessExams: boolean;               // /exams
        canAccessBooklets: boolean;            // /booklets
    };

    // CRUD операции
    crud: {
        canCreateUsers: boolean;
        canEditUsers: boolean;
        canDeleteUsers: boolean;
        canCreateRegions: boolean;
        canEditRegions: boolean;
        canDeleteRegions: boolean;
        canCreateDistricts: boolean;
        canEditDistricts: boolean;
        canDeleteDistricts: boolean;
        canCreateSchools: boolean;
        canEditSchools: boolean;
        canDeleteSchools: boolean;
        canCreateTeachers: boolean;
        canEditTeachers: boolean;
        canDeleteTeachers: boolean;
        canCreateStudents: boolean;
        canEditStudents: boolean;
        canDeleteStudents: boolean;
        canCreateExams: boolean;
        canEditExams: boolean;
        canDeleteExams: boolean;
        canEditExamResults: boolean;
        canDeleteExamResults: boolean;
        canEditBooklets: boolean;
        canDeleteBooklets: boolean;
    };

    // Фильтрация данных (для RBAC на бэкенде)
    dataAccess: {
        seeAllRegions: boolean;
        seeOwnRegionOnly: boolean;
        seeAllDistricts: boolean;
        seeOwnDistrictOnly: boolean;
        seeAllSchools: boolean;
        seeOwnSchoolOnly: boolean;
        seeAllTeachers: boolean;
        seeOwnTeachersOnly: boolean;
        seeAllStudents: boolean;
        seeOwnStudentsOnly: boolean;
    };

    // UI элементы
    ui: {
        showAdminMenu: boolean;
        showUserManagementLink: boolean;
        showRatingColumnsLink: boolean;
        showStatsUpdateButton: boolean;
        showExportButtons: boolean;
        showBulkActions: boolean;
        // Главная страница - секции
        showRegionsSection: boolean;
        showDistrictsSection: boolean;
        showSchoolsSection: boolean;
        showTeachersSection: boolean;
        showStudentsSection: boolean;
        showExamsSection: boolean;
        showBookletsSection: boolean;
        showStatsSection: boolean;
        // Рейтинги - табы
        showRegionsTab: boolean;
        showDistrictsTab: boolean;
        showSchoolsTab: boolean;
        showTeachersTab: boolean;
        showStudentsTab: boolean;
    };
}

/**
 * Конфигурация прав доступа для каждой роли
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    /**
     * SUPERADMIN - полный доступ ко всему
     */
    superadmin: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: true,
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: true,
            canAccessRegions: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canCreateRegions: true,
            canEditRegions: true,
            canDeleteRegions: true,
            canCreateDistricts: true,
            canEditDistricts: true,
            canDeleteDistricts: true,
            canCreateSchools: true,
            canEditSchools: true,
            canDeleteSchools: true,
            canCreateTeachers: true,
            canEditTeachers: true,
            canDeleteTeachers: true,
            canCreateStudents: true,
            canEditStudents: true,
            canDeleteStudents: true,
            canCreateExams: true,
            canEditExams: true,
            canDeleteExams: true,
            canEditExamResults: true,
            canDeleteExamResults: true,
            canEditBooklets: true,
            canDeleteBooklets: true,
        },
        dataAccess: {
            seeAllRegions: true,
            seeOwnRegionOnly: false,
            seeAllDistricts: true,
            seeOwnDistrictOnly: false,
            seeAllSchools: true,
            seeOwnSchoolOnly: false,
            seeAllTeachers: true,
            seeOwnTeachersOnly: false,
            seeAllStudents: true,
            seeOwnStudentsOnly: false,
        },
        ui: {
            showAdminMenu: true,
            showUserManagementLink: true,
            showRatingColumnsLink: true,
            showStatsUpdateButton: true,
            showExportButtons: true,
            showBulkActions: true,
            // Суперадмин видит все
            showRegionsSection: true,
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: true,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            showRegionsTab: true,
            showDistrictsTab: true,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * ADMIN - почти полный доступ, кроме некоторых системных операций
     */
    admin: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: true,
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: true,
            canAccessRegions: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canCreateRegions: true,
            canEditRegions: true,
            canDeleteRegions: true,
            canCreateDistricts: true,
            canEditDistricts: true,
            canDeleteDistricts: true,
            canCreateSchools: true,
            canEditSchools: true,
            canDeleteSchools: true,
            canCreateTeachers: true,
            canEditTeachers: true,
            canDeleteTeachers: true,
            canCreateStudents: true,
            canEditStudents: true,
            canDeleteStudents: true,
            canCreateExams: true,
            canEditExams: false,
            canDeleteExams: true,
            canEditExamResults: true,
            canDeleteExamResults: true,
            canEditBooklets: true,
            canDeleteBooklets: true,
        },
        dataAccess: {
            seeAllRegions: true,
            seeOwnRegionOnly: false,
            seeAllDistricts: true,
            seeOwnDistrictOnly: false,
            seeAllSchools: true,
            seeOwnSchoolOnly: false,
            seeAllTeachers: true,
            seeOwnTeachersOnly: false,
            seeAllStudents: true,
            seeOwnStudentsOnly: false,
        },
        ui: {
            showAdminMenu: true,
            showUserManagementLink: true,
            showRatingColumnsLink: true,
            showStatsUpdateButton: true,
            showExportButtons: true,
            showBulkActions: true,
            // Админ видит все
            showRegionsSection: true,
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: true,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            showRegionsTab: true,
            showDistrictsTab: true,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * MODERATOR - может создавать и редактировать, но НЕ может удалять
     */
    moderator: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: true,
            canAccessRegions: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: true,
            canEditRegions: true,
            canDeleteRegions: false,   // НЕ МОЖЕТ УДАЛЯТЬ
            canCreateDistricts: true,
            canEditDistricts: true,
            canDeleteDistricts: false,  // НЕ МОЖЕТ УДАЛЯТЬ
            canCreateSchools: true,
            canEditSchools: true,
            canDeleteSchools: false,    // НЕ МОЖЕТ УДАЛЯТЬ
            canCreateTeachers: true,
            canEditTeachers: true,
            canDeleteTeachers: false,   // НЕ МОЖЕТ УДАЛЯТЬ
            canCreateStudents: true,
            canEditStudents: true,
            canDeleteStudents: false,   // НЕ МОЖЕТ УДАЛЯТЬ
            canCreateExams: true,
            canEditExams: false,        // НЕ МОЖЕТ РЕДАКТИРОВАТЬ
            canDeleteExams: false,      // НЕ МОЖЕТ УДАЛЯТЬ
            canEditExamResults: true,   // МОЖЕТ РЕДАКТИРОВАТЬ РЕЗУЛЬТАТЫ
            canDeleteExamResults: false,// НЕ МОЖЕТ УДАЛЯТЬ РЕЗУЛЬТАТЫ
            canEditBooklets: true,
            canDeleteBooklets: false,   // НЕ МОЖЕТ УДАЛЯТЬ
        },
        dataAccess: {
            seeAllRegions: true,
            seeOwnRegionOnly: false,
            seeAllDistricts: true,
            seeOwnDistrictOnly: false,
            seeAllSchools: true,
            seeOwnSchoolOnly: false,
            seeAllTeachers: true,
            seeOwnTeachersOnly: false,
            seeAllStudents: true,
            seeOwnStudentsOnly: false,
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: false,
            showStatsUpdateButton: false,
            showExportButtons: true,
            showBulkActions: false,  // НЕТ массовых действий (часто это удаление)
            // Модератор видит все секции кроме админ-панели
            showRegionsSection: true,
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: true,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            showRegionsTab: true,
            showDistrictsTab: true,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * DISTRICT REPRESENTER - видит только свой район и всё что в нём
     */
    districtRepresenter: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: false,
            canAccessRegions: false,
            canAccessDistricts: false,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: false,
            canEditRegions: false,
            canDeleteRegions: false,
            canCreateDistricts: false,
            canEditDistricts: false,
            canDeleteDistricts: false,
            canCreateSchools: false,
            canEditSchools: false,
            canDeleteSchools: false,
            canCreateTeachers: false,
            canEditTeachers: false,
            canDeleteTeachers: false,
            canCreateStudents: false,
            canEditStudents: false,
            canDeleteStudents: false,
            canCreateExams: false,
            canEditExams: false,
            canDeleteExams: false,
            canEditExamResults: false,
            canDeleteExamResults: false,
            canEditBooklets: false,
            canDeleteBooklets: false,
        },
        dataAccess: {
            seeAllRegions: false,
            seeOwnRegionOnly: false,
            seeAllDistricts: false,
            seeOwnDistrictOnly: true,
            seeAllSchools: false,
            seeOwnSchoolOnly: false,  // Видит школы своего района
            seeAllTeachers: false,
            seeOwnTeachersOnly: false, // Видит учителей своего района
            seeAllStudents: false,
            seeOwnStudentsOnly: false, // Видит студентов своего района
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: true,
            showStatsUpdateButton: false,
            showExportButtons: true,
            showBulkActions: false,
            // Районный представитель НЕ видит секцию регионов, районов и экзаменов
            showRegionsSection: false,
            showDistrictsSection: false,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: false,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            // В рейтингах нет вкладки регионов (уровень выше своего), вкладка районов показывает только его район
            showRegionsTab: false,
            showDistrictsTab: true,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * SCHOOL DIRECTOR - видит только свою школу
     */
    schoolDirector: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: false,
            canAccessRegions: false,
            canAccessDistricts: false,
            canAccessSchools: false,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: false,
            canEditRegions: false,
            canDeleteRegions: false,
            canCreateDistricts: false,
            canEditDistricts: false,
            canDeleteDistricts: false,
            canCreateSchools: false,
            canEditSchools: false,
            canDeleteSchools: false,
            canCreateTeachers: false,
            canEditTeachers: false,
            canDeleteTeachers: false,
            canCreateStudents: false,
            canEditStudents: false,
            canDeleteStudents: false,
            canCreateExams: false,
            canEditExams: false,
            canDeleteExams: false,
            canEditExamResults: false,
            canDeleteExamResults: false,
            canEditBooklets: false,
            canDeleteBooklets: false,
        },
        dataAccess: {
            seeAllRegions: false,
            seeOwnRegionOnly: false,
            seeAllDistricts: false,
            seeOwnDistrictOnly: false,
            seeAllSchools: false,
            seeOwnSchoolOnly: true,
            seeAllTeachers: false,
            seeOwnTeachersOnly: false, // Видит учителей своей школы
            seeAllStudents: false,
            seeOwnStudentsOnly: false, // Видит студентов своей школы
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: true,
            showStatsUpdateButton: false,
            showExportButtons: true,
            showBulkActions: false,
            // Директор школы НЕ видит секции регионов, районов, школ и экзаменов
            showRegionsSection: false,
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: false,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            // В рейтингах нет вкладок регионов и районов, вкладка школ показывает только его школу
            showRegionsTab: false,
            showDistrictsTab: false,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * TEACHER - видит только себя и своих студентов
     */
    teacher: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: false,
            canAccessRegions: false,
            canAccessDistricts: false,
            canAccessSchools: false,
            canAccessTeachers: false,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: false,
            canEditRegions: false,
            canDeleteRegions: false,
            canCreateDistricts: false,
            canEditDistricts: false,
            canDeleteDistricts: false,
            canCreateSchools: false,
            canEditSchools: false,
            canDeleteSchools: false,
            canCreateTeachers: false,
            canEditTeachers: false,
            canDeleteTeachers: false,
            canCreateStudents: false,
            canEditStudents: false,
            canDeleteStudents: false,
            canCreateExams: false,
            canEditExams: false,
            canDeleteExams: false,
            canEditExamResults: false,
            canDeleteExamResults: false,
            canEditBooklets: false,
            canDeleteBooklets: false,
        },
        dataAccess: {
            seeAllRegions: false,
            seeOwnRegionOnly: false,
            seeAllDistricts: false,
            seeOwnDistrictOnly: false,
            seeAllSchools: false,
            seeOwnSchoolOnly: false,
            seeAllTeachers: false,
            seeOwnTeachersOnly: true,
            seeAllStudents: false,
            seeOwnStudentsOnly: false, // Видит своих студентов
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: true,
            showStatsUpdateButton: false,
            showExportButtons: true,
            showBulkActions: false,
            // Учитель НЕ видит секции регионов, районов, школ, учителей и экзаменов
            showRegionsSection: false,
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: false,
            showStudentsSection: true,
            showExamsSection: false,
            showBookletsSection: false, // заказчик попросил скрыть раздел Kitabçalar (2026-08-08)
            showStatsSection: true,
            // В рейтингах нет вкладок регионов, районов и школ, вкладка учителей показывает только его
            showRegionsTab: false,
            showDistrictsTab: false,
            showSchoolsTab: false,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },

    /**
     * STUDENT - видит только себя
     */
    student: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: false,
            canAccessRegions: false,
            canAccessDistricts: false,
            canAccessSchools: false,
            canAccessTeachers: false,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: false,
            canEditRegions: false,
            canDeleteRegions: false,
            canCreateDistricts: false,
            canEditDistricts: false,
            canDeleteDistricts: false,
            canCreateSchools: false,
            canEditSchools: false,
            canDeleteSchools: false,
            canCreateTeachers: false,
            canEditTeachers: false,
            canDeleteTeachers: false,
            canCreateStudents: false,
            canEditStudents: false,
            canDeleteStudents: false,
            canCreateExams: false,
            canEditExams: false,
            canDeleteExams: false,
            canEditExamResults: false,
            canDeleteExamResults: false,
            canEditBooklets: false,
            canDeleteBooklets: false,
        },
        dataAccess: {
            seeAllRegions: false,
            seeOwnRegionOnly: false,
            seeAllDistricts: false,
            seeOwnDistrictOnly: false,
            seeAllSchools: false,
            seeOwnSchoolOnly: false,
            seeAllTeachers: false,
            seeOwnTeachersOnly: false,
            seeAllStudents: false,
            seeOwnStudentsOnly: true,
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: true,
            showStatsUpdateButton: false,
            showExportButtons: false,
            showBulkActions: false,
            // Студент видит только себя в секции студентов и рейтингах, не видит экзамены
            showRegionsSection: false,
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: false,
            showStudentsSection: true,
            showExamsSection: false,
            showBookletsSection: false,
            showStatsSection: true,
            // В рейтингах видит только вкладку студентов (себя)
            showRegionsTab: false,
            showDistrictsTab: false,
            showSchoolsTab: false,
            showTeachersTab: false,
            showStudentsTab: true,
        },
    },

    /**
     * REGION REPRESENTER - видит только свой регион и всё что в нём (районы/школы/учителя/студенты
     * своего региона). Зеркалит districtRepresenter на уровень выше. PHASE3 п.1б (REGIONS_TASKS.md).
     */
    regionRepresenter: {
        routes: {
            canAccessAdminPanel: true,
            canAccessUserManagement: false,
            canAccessRatingColumns: false,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessStatistics: false,
            canAccessRegions: false, // свой регион видит в кабинете, не в CRUD-разделе
            canAccessDistricts: true, // районы своего региона — просмотр, без CRUD (см. crud ниже)
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
            canAccessBooklets: false,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canCreateRegions: false,
            canEditRegions: false,
            canDeleteRegions: false,
            canCreateDistricts: false,
            canEditDistricts: false,
            canDeleteDistricts: false,
            canCreateSchools: false,
            canEditSchools: false,
            canDeleteSchools: false,
            canCreateTeachers: false,
            canEditTeachers: false,
            canDeleteTeachers: false,
            canCreateStudents: false,
            canEditStudents: false,
            canDeleteStudents: false,
            canCreateExams: false,
            canEditExams: false,
            canDeleteExams: false,
            canEditExamResults: false,
            canDeleteExamResults: false,
            canEditBooklets: false,
            canDeleteBooklets: false,
        },
        dataAccess: {
            seeAllRegions: false,
            seeOwnRegionOnly: true,
            seeAllDistricts: false,
            seeOwnDistrictOnly: false, // Видит районы своего региона (не один конкретный)
            seeAllSchools: false,
            seeOwnSchoolOnly: false,   // Видит школы своего региона
            seeAllTeachers: false,
            seeOwnTeachersOnly: false, // Видит учителей своего региона
            seeAllStudents: false,
            seeOwnStudentsOnly: false, // Видит студентов своего региона
        },
        ui: {
            showAdminMenu: false,
            showUserManagementLink: false,
            showRatingColumnsLink: true,
            showStatsUpdateButton: false,
            showExportButtons: true,
            showBulkActions: false,
            // Региональный представитель НЕ видит секцию регионов (CRUD) и экзаменов,
            // но видит районы своего региона — они ниже его уровня, как школы/учителя/студенты
            showRegionsSection: false,
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: false,
            showBookletsSection: false,
            showStatsSection: true,
            // В рейтингах вкладка регионов показывает только его регион, районов — только его районы
            showRegionsTab: true,
            showDistrictsTab: true,
            showSchoolsTab: true,
            showTeachersTab: true,
            showStudentsTab: true,
        },
    },
};

/**
 * Вспомогательные функции для проверки прав
 */
export class RbacService {
    /**
     * Получить права для конкретной роли
     */
    static getPermissions(role: UserRole): RolePermissions {
        return ROLE_PERMISSIONS[role];
    }

    /**
     * Проверить, может ли роль выполнить действие
     */
    static can(role: UserRole, permission: keyof RolePermissions, action: string): boolean {
        const permissions = this.getPermissions(role);
        const category = permissions[permission] as any;
        return category?.[action] ?? false;
    }

    /**
     * Проверить доступ к маршруту
     */
    static canAccessRoute(role: UserRole, route: keyof RolePermissions['routes']): boolean {
        return this.getPermissions(role).routes[route];
    }

    /**
     * Проверить права на CRUD операцию
     */
    static canPerformCrud(role: UserRole, action: keyof RolePermissions['crud']): boolean {
        return this.getPermissions(role).crud[action];
    }

    /**
     * Проверить права на доступ к данным
     */
    static hasDataAccess(role: UserRole, access: keyof RolePermissions['dataAccess']): boolean {
        return this.getPermissions(role).dataAccess[access];
    }

    /**
     * Проверить видимость UI элемента
     */
    static canShowUI(role: UserRole, element: keyof RolePermissions['ui']): boolean {
        return this.getPermissions(role).ui[element];
    }

    /**
     * Проверить, является ли роль админской (admin или superadmin)
     */
    static isAdmin(role: UserRole): boolean {
        return role === 'admin' || role === 'superadmin';
    }

    /**
     * Получить список доступных маршрутов для роли
     */
    static getAccessibleRoutes(role: UserRole): string[] {
        const permissions = this.getPermissions(role);
        const routes: string[] = [];

        if (permissions.routes.canAccessProfile) routes.push('/profile');
        if (permissions.routes.canAccessStats) routes.push('/stats');
        if (permissions.routes.canAccessRegions) routes.push('/regions');
        if (permissions.routes.canAccessDistricts) routes.push('/districts');
        if (permissions.routes.canAccessSchools) routes.push('/schools');
        if (permissions.routes.canAccessTeachers) routes.push('/teachers');
        if (permissions.routes.canAccessStudents) routes.push('/students');
        if (permissions.routes.canAccessExams) routes.push('/exams');
        if (permissions.routes.canAccessBooklets) routes.push('/booklets');
        if (permissions.routes.canAccessAdminPanel) routes.push('/admin');
        if (permissions.routes.canAccessUserManagement) routes.push('/admin/users');
        if (permissions.routes.canAccessRatingColumns) routes.push('/admin/rating-columns');

        return routes;
    }
}
