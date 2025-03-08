import { District } from "./district.model";
import { School } from "./school.model";
import { Student } from "./student.model";
import { Teacher } from "./teacher.model";

export interface Stats {
    studentsOfMonth?: Student[];
    studentsOfMonthByRepublic?: Student[];
    studentsRating?: Student[];
    developingStudents?: Student[];
    teachers?: Teacher[];
    schools?: School[];
    districts?: District[];
}