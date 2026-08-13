
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { District } from '../../../../core/models/district.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../services/school.service';
import { School, SchoolForCreation } from '../../../../core/models/school.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-school-editing-dialog',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent,
    SelectComponent
],
    templateUrl: './school-editing-dialog.component.html',
    styleUrl: './school-editing-dialog.component.scss'
})
export class SchoolEditingDialogComponent implements OnInit, OnDestroy {
    districts: District[] = [];
    selectedDistrict: District | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<SchoolEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { school: School | SchoolForCreation, isEditing: boolean, canDelete?: boolean },
        private districtService: DistrictService
    ) {}

    get modalTitle(): string {
        return this.data.isEditing ? 'Məktəbin redaktə edilməsi' : 'Yeni məktəb əlavə et';
    }

    get modalSubtitle(): string {
        return 'Məktəbin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.school.code &&
            this.data.school.name?.trim() &&
            this.data.school.district &&
            (this.data.school.studentCount !== undefined && this.data.school.studentCount >= 0)
        );
    }

    get districtOptions(): SelectOption[] {
        return this.districts.map(district => ({
            value: district.id,
            label: district.name
        }));
    }

    get selectedDistrictId(): string | number {
        return this.data.school.district?.id || '';
    }

    set selectedDistrictId(districtId: string | number) {
        this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, districtId)) || null;
        this.onDistrictSelectChanged();
    }

    // Kod = rayonun kodu (prefiks) + fərdi hissə (son 2 rəqəm). Redaktə zamanı yalnız fərdi
    // hissə dəyişilə bilər — prefiksi əl ilə dəyişmək backend-də rədd olunur (PHASE3 п.4: kaskad
    // yalnız District sahəsindən keçir, kodun özündən yox). Yaratma zamanı məhdudiyyət yoxdur.
    get isCodePrefixLocked(): boolean {
        return this.data.isEditing && !!this.selectedDistrict;
    }

    get codePrefix(): number {
        return this.selectedDistrict?.code ?? 0;
    }

    get ownCodeSuffix(): number {
        if (!this.selectedDistrict) return 0;
        return this.data.school.code % 100;
    }

    set ownCodeSuffix(value: number) {
        if (!this.selectedDistrict) return;
        const suffix = Math.max(0, Math.min(99, Math.floor(value) || 0));
        this.data.school.code = this.selectedDistrict.code * 100 + suffix;
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
            this.data.school = {
                id: '',
                code: 0,
                name: '',
                address: '',
                studentCount: 0,
                active: true,
            } as SchoolForCreation
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
                    this.selectedDistrict = this.districts.find(d => IdUtil.equals(d.id, this.data.school.district?.id)) || null;
                },
                error: (error) => {
                    console.error('error', error);
                }
            });
    }

    onDistrictSelectChanged(): void {
        this.data.school.district = this.selectedDistrict as District;
    }

    onSave(): void {
        this.dialogRef.close({ action: 'save', data: this.data.school });
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
