import { Component, OnInit } from '@angular/core';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { SchoolService } from '../../services/school.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    MatSnackBar,
    MatSnackBarConfig,
    MatSnackBarModule
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DistrictService } from '../../../districts/services/district.service';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../../core/services/auth.service';
import { RepairingResults } from '../../../../core/models/student.model';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';

@Component({
    selector: 'app-schools-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatSnackBarModule,
        MatButtonModule,
        MatIconModule,
        MatPaginator,
        MatFormFieldModule,
        MatTableModule,
        MatSelectModule,
        MatOption,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './schools-list.component.html',
    styleUrl: './schools-list.component.scss'
})
export class SchoolsListComponent implements OnInit {
    file: File | null = null;
    schools: School[] = [];
    districts: District[] = [];
    totalCount: number = 0;
    pageSize: number = 100;
    pageIndex: number = 0;
    isLoading = false;
    hasError = false;
    errorMessage = '';
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }
    selectedDistrictIds: string[] = [];
    missingDistrictCodes: number[] = [];
    schoolCodesWithoutDistrictCodes: number[] = [];
    incorrectSchoolCodes: number[] = [];
    repairingResults: RepairingResults = {};
    displayedColumns: string[] = ['code', 'name', 'district', 'actions'];

    constructor(
        private schoolService: SchoolService,
        private districtService: DistrictService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.loadDistricts();
        this.loadSchools();
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0];
        }
    }

    onFileUpload(event: Event): void {
        event.preventDefault();

        if (this.file) {
            this.schoolService.uploadFile(this.file).subscribe({
                next: (response) => {
                    this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'OK', this.matSnackConfig);
                    this.missingDistrictCodes = response.missingDistrictCodes || [];
                    this.schoolCodesWithoutDistrictCodes = response.schoolCodesWithoutDistrictCodes || [];
                    this.incorrectSchoolCodes = response.incorrectSchoolCodes || [];
                },
                error: (err) => this.snackBar.open(`Fayl yüklənməsində xəta!\n${err.message}`, 'Bağla', this.matSnackConfig)
            });
        }
        else {
            this.snackBar.open('Fayl seçilməyib', 'Bağla', this.matSnackConfig);
        }
    }

    onSelectChanged(): void {
        this.loadSchools()
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    loadSchools(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(",")
        };
        
        this.isLoading = true;
        this.schoolService.getSchools(params)
        .subscribe({
            next: (data: SchoolResponse) => {
                this.schools = data.data;
                this.totalCount = data.totalCount;
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Error fetching schools: ${err.message}`;
            }
        });
    }

    loadDistricts(): void {
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        }

        this.districtService.getDistricts(params)
        .subscribe({
            next: (response: DistrictResponse) => {
                this.districts = response.data;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Error fetching districts: ${err.message};`
            }
        });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadSchools();
    }

    onSchoolsRepair(): void {
        this.isLoading = true;
        this.schoolService.repairSchools().subscribe({
            next: (response) => {
                this.repairingResults = response;
                this.snackBar.open(response.message || '', 'OK', this.matSnackConfig);
                this.isLoading = false;
            },
            error: (error) => {
                console.error(error);
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                this.isLoading = false;
            }
        });
    }

    onAllSchoolsDelete(): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Bütün məktəbləri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                const schoolIds = this.schools.map(s => s._id).join(",");
                this.schoolService.deleteSchools(schoolIds).subscribe({
                    next: (response) => {
                        this.loadSchools();
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }

    onSchoolCreate(): void {
        const dialogRef = this.dialog.open(SchoolEditingDialogComponent, {
            width: '1000px',
            data: {
                school: null,
                isEditing: false
            }
        });
        
        dialogRef.afterClosed().subscribe((result: School) => {
            if (result) {
                this.schoolService.createSchool(result).subscribe({
                    next: (response: ResponseFromBackend) => {
                        console.log(response);
                        this.schools = [...this.schools, response.data];
                        this.snackBar.open(response.message || 'Məktəb uğurla yaradıldı', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onSchoolUpdate(event: Event, school: School): void {
        event.stopPropagation();
        
        const dialogRef = this.dialog.open(SchoolEditingDialogComponent, {
            width: '1000px',
            data: { school, isEditing: true }
        });

        dialogRef.afterClosed().subscribe((result: School) => {
            if (result) {
                this.schoolService.updateSchool(result).subscribe({
                    next: (response) => {
                        const index = this.schools.findIndex(s => s._id === result._id);
                        this.schools[index] = result;
                        this.snackBar.open(response.message || 'Məktəb uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onSchoolDelete(event: Event, schoolId: string): void {
        event.stopPropagation();
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Məktəbi silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəb silinərkən ona bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.schoolService.deleteSchool(schoolId).subscribe({
                    next: (response) => {
                        this.schools = this.schools.filter(s => s._id !== schoolId);
                        this.snackBar.open(response.message || 'Məktəb uğurla silindi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }
}