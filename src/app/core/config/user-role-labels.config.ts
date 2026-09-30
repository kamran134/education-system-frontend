/**
 * Azerbaijani display names of user roles. Same wording as the role tabs in the admin
 * "İstifadəçilər" page (dashboard/components/users) and the user edit dialog; those keep
 * private copies, new screens should import this one.
 */
export const USER_ROLE_LABELS: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    moderator: 'Moderator',
    regionRepresenter: 'Regional idarə nümayəndəsi',
    districtRepresenter: 'Rayon nümayəndəsi',
    schoolDirector: 'Məktəb direktoru',
    teacher: 'Layihə müəllimi',
    student: 'Şagird',
};

export function userRoleLabel(role: string): string {
    return USER_ROLE_LABELS[role] ?? role;
}
