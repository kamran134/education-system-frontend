import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { District } from '../../../core/models/district.model';
import { DistrictService } from '../../districts/services/district.service';
import { SchoolService } from '../services/school.service';
import { School, SchoolForCreation } from '../../../core/models/school.model';

@Component({
    selector: 'app-school-editing-dialog',
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
    templateUrl: './school-editing-dialog.component.html',
    styleUrl: './school-editing-dialog.component.scss'
})
export class SchoolEditingDialogComponent implements OnInit {
    districts: District[] = [];
    selectedDistrict: District | null = null;

    constructor(
        public dialogRef: MatDialogRef<SchoolEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { school: School | SchoolForCreation, isEditing: boolean },
        private districtService: DistrictService
    ) {}

    ngOnInit(): void {
        this.loadDistricts();
        if (!this.data.isEditing) {
            this.data.school = {
                _id: '',
                code: 0,
                name: '',
                address: '',
            } as SchoolForCreation
        }
    }

    loadDistricts(): void {
        this.districtService.getDistricts().subscribe({
            next: (response) => {
                this.districts = response.data;
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
        this.dialogRef.close(this.data.school);
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
