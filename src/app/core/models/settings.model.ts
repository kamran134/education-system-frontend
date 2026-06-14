export interface RoleTabSettings {
    developingStudents?: string[];
    monthStudents?: string[];
    republicMonthStudents?: string[];
    allStudents?: string[];
    allTeachers?: string[];
    allSchools?: string[];
    allDistricts?: string[];
}

export interface RoleSettings {
    moderator?: RoleTabSettings;
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
    teacherViewCollumns?: string[];
    directorViewCollumns?: string[];
    districtViewCollumns?: string[];
    studentViewCollumns?: string[];
    roleSettings?: RoleSettings;
}
