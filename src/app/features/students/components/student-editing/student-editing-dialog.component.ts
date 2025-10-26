import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Student } from '../../../../core/models/student.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-student-editing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent,
        SelectComponent
    ],
    templateUrl: './student-editing-dialog.component.html',
    styleUrl: './student-editing-dialog.component.scss'
})
export class StudentEditingDialogComponent implements OnInit, OnDestroy {
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    grades: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    selectedDistrict: District | null = null;
    selectedSchool: School | null = null;
    selectedTeacher: Teacher | null = null;
    selectedGrade: number | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<StudentEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { student: Student, isEditing: boolean },
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService
    ) { }

    get modalTitle(): string {
        return this.data.isEditing ? 'Şagirdin redaktə edilməsi' : 'Yeni şagird əlavə et';
    }

    get modalSubtitle(): string {
        return 'Şagirdin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.student.code &&
            this.data.student.lastName?.trim() &&
            this.data.student.firstName?.trim() &&
            this.data.student.middleName?.trim() &&
            this.data.student.district &&
            this.data.student.school &&
            this.data.student.teacher &&
            this.data.student.grade
        );
    }

    get districtOptions(): SelectOption[] {
        return this.districts.map(district => ({
            value: district._id,
            label: district.name
        }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(school => ({
            value: school._id,
            label: school.name
        }));
    }

    get teacherOptions(): SelectOption[] {
        return this.teachers.map(teacher => ({
            value: teacher._id,
            label: teacher.fullname
        }));
    }

    get gradeOptions(): SelectOption[] {
        return this.grades.map(grade => ({
            value: grade,
            label: grade.toString()
        }));
    }

    get selectedDistrictId(): string {
        return this.data.student.district?._id || '';
    }

    set selectedDistrictId(districtId: string) {
        this.selectedDistrict = this.districts.find(d => d._id === districtId) || null;
        this.onDistrictSelectChanged();
    }

    get selectedSchoolId(): string {
        return this.data.student.school?._id || '';
    }

    set selectedSchoolId(schoolId: string) {
        this.selectedSchool = this.schools.find(s => s._id === schoolId) || null;
        this.onSchoolSelectChanged();
    }

    get selectedTeacherId(): string {
        return this.data.student.teacher?._id || '';
    }

    set selectedTeacherId(teacherId: string) {
        this.selectedTeacher = this.teachers.find(t => t._id === teacherId) || null;
        this.onTeacherSelectChanged();
    }

    get modalButtons(): ModalButton[] {
        return [
            {
                label: 'Ləğv et',
                variant: 'outline',
                action: () => this.onClose()
            },
            {
                label: 'Yadda saxla',
                variant: 'primary',
                disabled: !this.isValid,
                action: () => this.onSave()
            }
        ];
    }

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

        this.districtService.getDistricts(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
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
        this.schoolService.getSchoolsForFilter({ districtIds: this.selectedDistrict?._id })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
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
        this.teacherService.getTeachersForFilter({ schoolIds: this.selectedSchool?._id })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
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

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onModalClose(): void {
        this.onClose();
    }
}
