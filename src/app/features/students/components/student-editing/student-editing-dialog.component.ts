import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Student, StudentForCreation } from '../../../../core/models/student.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
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
        @Inject(MAT_DIALOG_DATA) public data: { student: Student | StudentForCreation, isEditing: boolean, canDelete?: boolean },
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
            value: district.id,
            label: district.name
        }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(school => ({
            value: school.id,
            label: school.name
        }));
    }

    get teacherOptions(): SelectOption[] {
        return this.teachers.map(teacher => ({
            value: teacher.id,
            label: teacher.fullname
        }));
    }

    get gradeOptions(): SelectOption[] {
        return this.grades.map(grade => ({
            value: grade,
            label: grade.toString()
        }));
    }

    // Kod = müəllimin kodu (prefiks) + fərdi hissə (son 3 rəqəm). Redaktə zamanı yalnız fərdi
    // hissə dəyişilə bilər — prefiksi əl ilə dəyişmək backend-də rədd olunur (teacher/school
    // dialoqları ilə eyni qayda). Yaratma zamanı məhdudiyyət yoxdur.
    get isCodePrefixLocked(): boolean {
        return this.data.isEditing && !!this.selectedTeacher;
    }

    get codePrefix(): number {
        return this.selectedTeacher?.code ?? 0;
    }

    get ownCodeSuffix(): number {
        if (!this.selectedTeacher) return 0;
        return this.data.student.code % 1000;
    }

    set ownCodeSuffix(value: number) {
        if (!this.selectedTeacher) return;
        const suffix = Math.max(0, Math.min(999, Math.floor(value) || 0));
        this.data.student.code = this.selectedTeacher.code * 1000 + suffix;
    }

    get selectedDistrictId(): string | number {
        return this.data.student.district?.id || '';
    }

    set selectedDistrictId(districtId: string | number) {
        this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, districtId)) || null;
        this.onDistrictSelectChanged();
    }

    get selectedSchoolId(): string | number {
        return this.data.student.school?.id || '';
    }

    set selectedSchoolId(schoolId: string | number) {
        this.selectedSchool = this.schools.find(s => IdUtil.equals(s.id, schoolId)) || null;
        this.onSchoolSelectChanged();
    }

    get selectedTeacherId(): string | number {
        return this.data.student.teacher?.id || '';
    }

    set selectedTeacherId(teacherId: string | number) {
        this.selectedTeacher = this.teachers.find(t => IdUtil.equals(t.id, teacherId)) || null;
        this.onTeacherSelectChanged();
    }

    get modalButtons(): ModalButton[] {
        const buttons: ModalButton[] = [
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

        // Добавляем кнопку удаления только при редактировании и если есть права
        if (this.data.isEditing && this.data.canDelete) {
            buttons.splice(1, 0, {
                label: 'Sil',
                variant: 'danger',
                action: () => this.onDelete()
            });
        }

        return buttons;
    }

    ngOnInit(): void {
        this.loadDistricts();
        if (!this.data.isEditing) {
            this.data.student = {
                code: 0,
                lastName: '',
                firstName: '',
                middleName: '',
                grade: 5
            };
        }
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
                    this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, this.data.student.district?.id)) || null;
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
        this.schoolService.getSchoolsForFilter({ districtIds: this.selectedDistrict?.id !== undefined ? String(this.selectedDistrict.id) : undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.schools = ResponseHandlerUtil.extractData<School[]>(response);
                    this.selectedSchool = this.schools.find(s => IdUtil.equals(s.id, this.data.student.school?.id)) || null;
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
        this.teacherService.getTeachersForFilter({ schoolIds: this.selectedSchool?.id !== undefined ? String(this.selectedSchool.id) : undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.teachers = ResponseHandlerUtil.extractData<Teacher[]>(response);
                    this.selectedTeacher = this.teachers.find(t => IdUtil.equals(t.id, this.data.student.teacher?.id)) || null;
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
        this.dialogRef.close({ action: 'save', data: this.data.student });
    }

    onDelete(): void {
        this.dialogRef.close({ action: 'delete' });
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
