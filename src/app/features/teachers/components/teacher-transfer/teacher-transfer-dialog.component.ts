import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { Teacher } from '../../../../core/models/teacher.model';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../services/teacher.service';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';

export interface TeacherTransferResult {
    teacher: Teacher;
    movedStudents: Array<{ id: number; fullname: string; oldCode: number; newCode: number }>;
    /** Name of the teacher the students went to (null if there was nobody to move). */
    targetTeacherName: string | null;
}

/**
 * «Başqa məktəbə köçür» (TRANSFERS_TASK.md §4.3): moves the teacher to another school. His students stay in the
 * old school and go to ONE other teacher of that school; past results and points stay where they were earned.
 */
@Component({
    selector: 'app-teacher-transfer-dialog',
    imports: [FormsModule, InputComponent, ModalComponent, SelectComponent],
    templateUrl: './teacher-transfer-dialog.component.html'
})
export class TeacherTransferDialogComponent implements OnInit {
    districts: District[] = [];
    schools: School[] = [];
    selectedDistrictId: string | number = '';
    selectedSchoolId: string | number = '';
    codeSuffix: number;

    oldSchoolTeachers: Teacher[] = [];
    studentsToTeacherId: string | number = '';

    isSubmitting = false;
    errorMessage = '';

    private destroyRef = inject(DestroyRef);

    constructor(
        public dialogRef: DialogRef<TeacherTransferResult | undefined>,
        @Inject(DIALOG_DATA) public data: { teacher: Teacher },
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService
    ) {
        this.codeSuffix = data.teacher.code % 100;
    }

    /** Live students of the teacher (the profile's real count, not the stored divisor). */
    get studentCount(): number {
        return this.data.teacher.actualStudentCount ?? 0;
    }

    get selectedSchool(): School | null {
        return this.schools.find(s => IdUtil.equals(s.id, this.selectedSchoolId)) ?? null;
    }

    get isSuffixValid(): boolean {
        const suffix = Number(this.codeSuffix);
        return Number.isInteger(suffix) && suffix >= 1 && suffix <= 99;
    }

    get newCode(): number | null {
        const school = this.selectedSchool;
        if (!school || !this.isSuffixValid) return null;
        return school.code * 100 + Number(this.codeSuffix);
    }

    get isValid(): boolean {
        return !!this.selectedSchool && this.isSuffixValid && (this.studentCount === 0 || this.studentsToTeacherId !== '');
    }

    get districtOptions(): SelectOption[] {
        return this.districts.map(d => ({ value: d.id, label: d.name }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(s => ({ value: s.id, label: s.name }));
    }

    get teacherOptions(): SelectOption[] {
        return this.oldSchoolTeachers.map(t => ({ value: t.id, label: `${t.fullname} (${t.code})` }));
    }

    get modalButtons(): ModalButton[] {
        return [
            { label: 'Ləğv et', variant: 'outline', action: () => this.dialogRef.close() },
            { label: 'Köçür', variant: 'primary', disabled: !this.isValid || this.isSubmitting, action: () => this.onSubmit() }
        ];
    }

    ngOnInit(): void {
        this.districtService.getDistricts({ page: 1, size: 1000, sortColumn: 'name', sortDirection: 'asc' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => { this.districts = ResponseHandlerUtil.extractData<District[]>(response); },
                error: (error) => { console.error('error', error); }
            });

        const oldSchoolId = this.data.teacher.school?.id;
        if (oldSchoolId !== undefined && oldSchoolId !== null) {
            this.teacherService.getTeachersForFilter({ schoolIds: String(oldSchoolId) })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (teachers) => {
                        this.oldSchoolTeachers = (teachers ?? []).filter(t => !IdUtil.equals(t.id, this.data.teacher.id));
                    },
                    error: (error) => { console.error('error', error); }
                });
        }
    }

    onDistrictChanged(districtId: string | number): void {
        this.selectedDistrictId = districtId;
        this.selectedSchoolId = '';
        this.schools = [];
        if (districtId === '' || districtId === null || districtId === undefined) return;
        this.schoolService.getSchoolsForFilter({ districtIds: String(districtId) })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    // The current school is not a destination.
                    this.schools = ResponseHandlerUtil.extractData<School[]>(response)
                        .filter(s => !IdUtil.equals(s.id, this.data.teacher.school?.id));
                },
                error: (error) => { console.error('error', error); }
            });
    }

    onSubmit(): void {
        const school = this.selectedSchool;
        if (!school || !this.isValid) return;
        this.isSubmitting = true;
        this.errorMessage = '';

        const targetId = this.studentsToTeacherId === '' ? undefined : Number(this.studentsToTeacherId);
        this.teacherService.transferTeacher(this.data.teacher.id, {
            schoolId: Number(school.id),
            codeSuffix: Number(this.codeSuffix),
            ...(targetId !== undefined && { studentsToTeacherId: targetId }),
        }).subscribe({
            next: (response) => {
                const target = this.oldSchoolTeachers.find(t => t.id === targetId);
                this.dialogRef.close({ ...response, targetTeacherName: target?.fullname ?? null });
            },
            error: (error) => {
                this.isSubmitting = false;
                this.errorMessage = error.error?.message ?? 'Köçürmə zamanı xəta baş verdi';
            }
        });
    }
}
