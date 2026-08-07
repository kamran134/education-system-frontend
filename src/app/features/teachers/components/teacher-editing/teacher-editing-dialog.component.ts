import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Teacher, TeacherForCreation } from '../../../../core/models/teacher.model';
import { FormsModule } from '@angular/forms';
import { SchoolService } from '../../../schools/services/school.service';
import { DistrictService } from '../../../districts/services/district.service';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { CommonModule } from '@angular/common';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-teacher-editing-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent,
        SelectComponent
    ],
    templateUrl: './teacher-editing-dialog.component.html',
    styleUrl: './teacher-editing-dialog.component.scss'
})
export class TeacherEditingDialogComponent implements OnInit, OnDestroy {
    districts: District[] = [];
    selectedDistrict: District | null = null;
    selectedSchool: School | null = null;
    schools: School[] = [];
    
    private destroy$ = new Subject<void>();
    
    constructor(
        public dialogRef: MatDialogRef<TeacherEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { teacher: Teacher | TeacherForCreation, isEditing: boolean, canDelete?: boolean },
        private districtService: DistrictService,
        private schoolService: SchoolService
    ) { }

    get modalTitle(): string {
        return this.data.isEditing ? 'Müəllimin redaktə edilməsi' : 'Yeni müəllim əlavə et';
    }

    get modalSubtitle(): string {
        return 'Müəllimin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.teacher.code &&
            this.data.teacher.fullname?.trim() &&
            this.data.teacher.district &&
            this.data.teacher.school &&
            (this.data.teacher.studentCount !== undefined && this.data.teacher.studentCount >= 0)
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

    get selectedDistrictId(): string | number {
        return this.data.teacher.district?.id || '';
    }

    set selectedDistrictId(districtId: string | number) {
        this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, districtId)) || null;
        this.onDistrictSelectChanged();
    }

    get selectedSchoolId(): string | number {
        return this.data.teacher.school?.id || '';
    }

    set selectedSchoolId(schoolId: string | number) {
        this.selectedSchool = this.schools.find(s => IdUtil.equals(s.id, schoolId)) || null;
        this.onSchoolSelectChanged();
    }

    // Kod = məktəbin kodu (prefiks) + fərdi hissə (son 2 rəqəm). Redaktə zamanı yalnız fərdi
    // hissə dəyişilə bilər — prefiksi əl ilə dəyişmək backend-də rədd olunur (PHASE3 п.4: kaskad
    // yalnız Məktəb sahəsindən keçir, kodun özündən yox). Yaratma zamanı məhdudiyyət yoxdur —
    // backend createTeacher də tələb etmir.
    get isCodePrefixLocked(): boolean {
        return this.data.isEditing && !!this.selectedSchool;
    }

    get codePrefix(): number {
        return this.selectedSchool?.code ?? 0;
    }

    get ownCodeSuffix(): number {
        if (!this.selectedSchool) return 0;
        return this.data.teacher.code % 100;
    }

    set ownCodeSuffix(value: number) {
        if (!this.selectedSchool) return;
        const suffix = Math.max(0, Math.min(99, Math.floor(value) || 0));
        this.data.teacher.code = this.selectedSchool.code * 100 + suffix;
    }

    get activeOptions(): SelectOption[] {
        return [
            { value: true, label: 'Bəli' },
            { value: false, label: 'Xeyr' }
        ];
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
            this.data.teacher = {
                fullname: '',
                code: 0,
                studentCount: 0,
                active: true,
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
                    this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, this.data.teacher.district?.id)) || null;
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
                    this.selectedSchool = this.schools.find(s => IdUtil.equals(s.id, this.data.teacher.school?.id)) || null;
                },
                error: (error) => {
                    console.error('error', error);
                }
            });
    }

    onDistrictSelectChanged(): void {
        this.selectedSchool = null;
        this.loadSchools();
    }

    onSchoolSelectChanged(): void {
        this.data.teacher.district = this.selectedDistrict as District;
        this.data.teacher.school = this.selectedSchool as School;
    }

    onSave(): void {
        this.dialogRef.close({ action: 'save', data: this.data.teacher });
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
