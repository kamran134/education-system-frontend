import { District } from "./district.model";
import { ExamResult } from "./examResult.model";
import { Region } from "./region.model";
import { School } from "./school.model";
import { Student } from "./student.model";
import { Teacher } from "./teacher.model";

export interface Stats {
    developingStudents?: ExamResult[];
    studentsOfMonth?: ExamResult[];
    studentsOfMonthByRepublic?: ExamResult[];
    studentsRating?: Student[];
    students?: Student[];
    teachers?: Teacher[];
    schools?: School[];
    districts?: District[];
    regions?: Region[];
}

export interface StatsResponse {
    data: Stats;
    message: string;
    success: boolean;
}