/**
 * RBAC (Role-Based Access Control) Configuration
 * 
 * Централизованная конфигурация прав доступа для всех ролей в системе.
 * Определяет какие маршруты, действия и UI элементы доступны каждой роли.
 */

export type UserRole = 
    | 'superadmin' 
    | 'admin' 
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
        canAccessDistricts: boolean;           // /districts
        canAccessSchools: boolean;             // /schools
        canAccessTeachers: boolean;            // /teachers
        canAccessStudents: boolean;            // /students
        canAccessExams: boolean;               // /exams
    };
    
    // CRUD операции
    crud: {
        canCreateUsers: boolean;
        canEditUsers: boolean;
        canDeleteUsers: boolean;
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
    };
    
    // Фильтрация данных (для RBAC на бэкенде)
    dataAccess: {
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
        showDistrictsSection: boolean;
        showSchoolsSection: boolean;
        showTeachersSection: boolean;
        showStudentsSection: boolean;
        showExamsSection: boolean;
        showStatsSection: boolean;
        // Рейтинги - табы
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
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
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
        },
        dataAccess: {
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
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: true,
            showStatsSection: true,
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
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
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
        },
        dataAccess: {
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
            showDistrictsSection: true,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: true,
            showStatsSection: true,
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
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
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
        },
        dataAccess: {
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
            // Районный представитель НЕ видит секцию районов и экзаменов
            showDistrictsSection: false,
            showSchoolsSection: true,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: false,
            showStatsSection: true,
            // В рейтингах вкладка районов показывает только его район
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
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
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
        },
        dataAccess: {
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
            // Директор школы НЕ видит секции районов, школ и экзаменов
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: true,
            showStudentsSection: true,
            showExamsSection: false,
            showStatsSection: true,
            // В рейтингах нет вкладки районов, вкладка школ показывает только его школу
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
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessDistricts: true,
            canAccessSchools: true,
            canAccessTeachers: true,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
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
        },
        dataAccess: {
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
            // Учитель НЕ видит секции районов, школ, учителей и экзаменов
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: false,
            showStudentsSection: true,
            showExamsSection: false,
            showStatsSection: true,
            // В рейтингах нет вкладок районов и школ, вкладка учителей показывает только его
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
            canAccessRatingColumns: true,
            canAccessProfile: true,
            canAccessStats: true,
            canAccessDistricts: false,
            canAccessSchools: false,
            canAccessTeachers: false,
            canAccessStudents: true,
            canAccessExams: true,
        },
        crud: {
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
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
        },
        dataAccess: {
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
            showDistrictsSection: false,
            showSchoolsSection: false,
            showTeachersSection: false,
            showStudentsSection: true,
            showExamsSection: false,
            showStatsSection: true,
            // В рейтингах видит только вкладку студентов (себя)
            showDistrictsTab: false,
            showSchoolsTab: false,
            showTeachersTab: false,
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
        if (permissions.routes.canAccessDistricts) routes.push('/districts');
        if (permissions.routes.canAccessSchools) routes.push('/schools');
        if (permissions.routes.canAccessTeachers) routes.push('/teachers');
        if (permissions.routes.canAccessStudents) routes.push('/students');
        if (permissions.routes.canAccessExams) routes.push('/exams');
        if (permissions.routes.canAccessAdminPanel) routes.push('/admin');
        if (permissions.routes.canAccessUserManagement) routes.push('/admin/users');
        if (permissions.routes.canAccessRatingColumns) routes.push('/admin/rating-columns');

        return routes;
    }
}
