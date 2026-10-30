export interface RoleTabSettings {
    developingStudents?: string[];
    monthStudents?: string[];
    republicMonthStudents?: string[];
    allStudents?: string[];
    allTeachers?: string[];
    allSchools?: string[];
    allDistricts?: string[];
    allRegions?: string[];
    examResults?: string[];
    // Г2: order/visibility of the «Reytinqlər» table columns on this role's own profile; no key = current set.
    profileRatings?: string[];
}

export interface RoleSettings {
    moderator?: RoleTabSettings;
    regionRepresenter?: RoleTabSettings;
    districtRepresenter?: RoleTabSettings;
    schoolDirector?: RoleTabSettings;
    teacher?: RoleTabSettings;
    student?: RoleTabSettings;
}

export interface UserSettings {
    userId: string;
    developingStudentCollumns?: string[];
    studentCollumns: string[];
    allStudentCollumns: string[];
    allTeacherCollumns: string[];
    allSchoolCollumns: string[];
    allDistrictCollumns: string[];
    allRegionCollumns?: string[];
    teacherViewCollumns?: string[];
    directorViewCollumns?: string[];
    districtViewCollumns?: string[];
    studentViewCollumns?: string[];
    examResultCollumns?: string[];
    roleSettings?: RoleSettings;
}
