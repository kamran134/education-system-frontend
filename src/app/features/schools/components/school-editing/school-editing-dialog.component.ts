import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { District } from '../../../../core/models/district.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../services/school.service';
import { School, SchoolForCreation } from '../../../../core/models/school.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-school-editing-dialog',
    standalone: true,
    imports: [
        CommonModule,
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
            value: district._id,
            label: district.name
        }));
    }

    get selectedDistrictId(): string {
        return this.data.school.district?._id || '';
    }

    set selectedDistrictId(districtId: string) {
        this.selectedDistrict = this.districts.find(d => d._id === districtId) || null;
        this.onDistrictSelectChanged();
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
                _id: '',
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
                    this.selectedDistrict = this.districts.find(d => d._id === this.data.school.district?._id) || null;
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
