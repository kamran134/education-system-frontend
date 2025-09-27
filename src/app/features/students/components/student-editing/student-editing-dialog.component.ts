import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Student } from '../../../../core/models/student.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

@Component({
    selector: 'app-student-editing',
    standalone: true,
    imports: [
        MatDialogContent,
        MatFormFieldModule,
        MatInputModule,
        MatDialogActions,
        MatButtonModule,
        MatSelectModule,
        MatOptionModule,
        FormsModule,
        CommonModule
    ],
    templateUrl: './student-editing-dialog.component.html',
    styleUrl: './student-editing-dialog.component.scss'
})
export class StudentEditingDialogComponent implements OnInit {
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    grades: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    selectedDistrict: District | null = null;
    selectedSchool: School | null = null;
    selectedTeacher: Teacher | null = null;
    selectedGrade: number | null = null;

    constructor(
        public dialogRef: MatDialogRef<StudentEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { student: Student, isEditing: boolean },
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService
    ) { }

    ngOnInit(): void {
        this.loadDistricts();
    }

    loadDistricts(): void {
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        }

        this.districtService.getDistricts(params).subscribe({
            next: (response) => {
                this.districts = ResponseHandlerUtil.extractData<District[]>(response);
                this.selectedDistrict = this.districts.find(d => d._id === this.data.student.district?._id) || null;
                if (this.selectedDistrict) {
                    this.loadSchools(); // Загружаем школы только если район есть
                }
            },
            error: (error) => {
                console.error('error', error);
            }
        });
    }

    loadSchools(): void {
        this.schoolService.getSchoolsForFilter({ districtIds: this.selectedDistrict?._id }).subscribe({
            next: (response) => {
                this.schools = ResponseHandlerUtil.extractData<School[]>(response);
                this.selectedSchool = this.schools.find(s => s._id === this.data.student.school?._id) || null;
                if (this.selectedSchool) {
                    this.loadTeachers(); // Загружаем учителей только если школа есть
                }
            },
            error: (error) => {
                console.error('error', error);
            }
        });
    }

    loadTeachers(): void {
        this.teacherService.getTeachersForFilter({ schoolIds: this.selectedSchool?._id }).subscribe({
            next: (response) => {
                this.teachers = ResponseHandlerUtil.extractData<Teacher[]>(response);
                this.selectedTeacher = this.teachers.find(t => t._id === this.data.student.teacher?._id) || null;
            },
            error: (error) => {
                console.error('error', error);
            }
        });
    }

    onDistrictSelectChanged(): void {
        this.selectedSchool = null;
        this.selectedTeacher = null;
        this.loadSchools();
    }

    onSchoolSelectChanged(): void {
        this.selectedTeacher = null;
        this.loadTeachers();
    }

    onTeacherSelectChanged(): void {
        this.data.student.district = this.selectedDistrict as District;
        this.data.student.school = this.selectedSchool as School;
        this.data.student.teacher = this.selectedTeacher as Teacher;
    }

    onGradeSelectChanged(): void {
        this.data.student.grade = this.selectedGrade as number;
    }

    onSave(): void {
        this.dialogRef.close(this.data.student);
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
