import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { Teacher, TeacherForCreation } from '../../../../core/models/teacher.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SchoolService } from '../../../schools/services/school.service';
import { DistrictService } from '../../../districts/services/district.service';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

@Component({
    selector: 'app-teacher-editing-dialog',
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
    templateUrl: './teacher-editing-dialog.component.html',
    styleUrl: './teacher-editing-dialog.component.scss'
})
export class TeacherEditingDialogComponent implements OnInit{
    districts: District[] = [];
    selectedDistrict: District | null = null;
    selectedSchool: School | null = null;
    schools: School[] = [];
    
    constructor(
        public dialogRef: MatDialogRef<TeacherEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { teacher: Teacher | TeacherForCreation, isEditing: boolean },
        private districtService: DistrictService,
        private schoolService: SchoolService
    ) { }

    ngOnInit(): void {
        this.loadDistricts();
        if (!this.data.isEditing) {
            this.data.teacher = {
                fullname: '',
                code: 0,
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

        this.districtService.getDistricts(params).subscribe({
            next: (response) => {
                this.districts = ResponseHandlerUtil.extractData<District[]>(response);
                this.selectedDistrict = this.districts.find(d => d._id === this.data.teacher.district?._id) || null;
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
                this.selectedSchool = this.schools.find(s => s._id === this.data.teacher.school?._id) || null;
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
        this.dialogRef.close(this.data.teacher);
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
