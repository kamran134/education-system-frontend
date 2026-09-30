/** Response shapes of GET /api/users/activity-stats and /api/users/activity-stats/users (GIRIS_STATISTIKASI_TASK.md). */

export interface RoleActivityStats {
    /** Role key, or 'all' for the totals row. */
    role: string;
    total: number;
    everLoggedIn: number;
    neverLoggedIn: number;
    last24h: number;
    last7d: number;
    last30d: number;
    onlineNow: number;
}

export interface DistrictActivityStats {
    districtId: number;
    districtName: string;
    regionName: string;
    directorsTotal: number;
    directorsLoggedIn: number;
    teachersTotal: number;
    teachersLoggedIn: number;
    onlineNow: number;
}

export interface LoginsByDay {
    /** 'YYYY-MM-DD' in Asia/Baku. */
    day: string;
    logins: number;
    uniqueUsers: number;
}

export interface ActivityStats {
    generatedAt: string;
    onlineWindowMinutes: number;
    /** Earliest recorded login event, null while user_login_events is still empty. */
    loginEventsSince: string | null;
    totals: RoleActivityStats;
    byRole: RoleActivityStats[];
    byDistrict: DistrictActivityStats[];
    loginsByDay: LoginsByDay[];
}

export type ActivityUserStatus = 'never' | 'online' | 'all';

export interface ActivityUsersParams {
    status: ActivityUserStatus;
    role?: string;
    districtId?: string | number;
    search?: string;
    /** 1-based. */
    page: number;
    size: number;
}

export interface ActivityUserItem {
    id: number;
    email: string;
    role: string;
    districtName: string | null;
    schoolName: string | null;
    teacherName: string | null;
    lastLoginAt: string | null;
    lastSeenAt: string | null;
    createdAt: string;
}

export interface ActivityUsersResult {
    items: ActivityUserItem[];
    total: number;
}
