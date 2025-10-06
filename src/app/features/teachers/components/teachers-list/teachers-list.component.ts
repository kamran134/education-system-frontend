import { Component, OnInit } from '@angular/core';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { PageEvent } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { RepairingResults } from '../../../../core/models/student.model';
import { TeacherEditingDialogComponent } from '../teacher-editing/teacher-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { TableColumn } from '../../../../shared/models/tableColumn.model';
import { TableComponent } from '../../../../shared/components/table/table.component';

@Component({
    selector: 'app-teachers-list',
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
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
    TableComponent,
    MatProgressSpinnerModule
    ],
    templateUrl: './teachers-list.component.html',
    styleUrl: './teachers-list.component.scss'
})
export class TeachersListComponent implements OnInit {
    file: File | null = null;
    teachers: Teacher[] = [];
    districts: District[] = [];
    schools: School[] = [];
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
    isUpdatingStats = false;
    onUpdateTeachersStats(): void {
        this.isUpdatingStats = true;
        this.teacherService.updateTeachersStats().subscribe({
            next: (response: any) => {
                this.isUpdatingStats = false;
                this.snackBar.open('Statistika uğurla yeniləndi', 'OK', this.matSnackConfig);
                this.loadTeachers();
            },
            error: (error) => {
                this.isUpdatingStats = false;
                this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    missingSchoolCodes: number[] = [];
    teacherCodesWithoutSchoolCodes: number[] = [];
    incorrectTeacherCodes: number[] = [];
    repairingResults: RepairingResults = {};
    columns: TableColumn[] = [
        { key: 'code', title: 'Müəllimənin kodu' },
        { key: 'fullname', title: 'Soyadı, adı və ata adı' },
        { key: 'school', title: 'Məktəbi', valueFormatter: (teacher: Teacher) => (teacher.school || '').name },
        { key: 'district', title: 'Rayonu / şəhəri', valueFormatter: (teacher: Teacher) => (teacher.district || '').name },
        { key: 'studentCount', title: 'Şagird sayı' }
    ];
    actions = { edit: true, delete: true };

    constructor(
        private teacherService: TeacherService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0]
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        if (this.file) {
            this.teacherService.uploadFile(this.file).subscribe({
                next: (response) => {
                    this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'OK', this.matSnackConfig);
                    this.missingSchoolCodes = response.missingSchoolCodes || [];
                    this.teacherCodesWithoutSchoolCodes = response.teacherCodesWithoutSchoolCodes || [];
                    this.incorrectTeacherCodes = response.incorrectTeacherCodes || [];
                },
                error: (err) => this.snackBar.open(`Fayl yüklənməsində xəta!\n${err.message}`, 'Bağla', this.matSnackConfig)
            });
        }
        else {
            this.snackBar.open('Fayl seçilməyib', 'Bağla', this.matSnackConfig);
        }
    }

    onDistrictSelectChanged(): void {
        this.loadSchools();
        this.loadTeachers();
    }

    onSchoolSelectChanged(): void {
        this.loadTeachers();
    }

    ngOnInit(): void {
        this.loadDistricts();
        this.loadTeachers();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    loadTeachers(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
        }

        this.isLoading = true;
        this.teacherService.getTeachers(params)
            .subscribe({
                next: (response: TeacherResponse) => {
                    const paginatedData = ResponseHandlerUtil.extractPaginatedData<Teacher>(response);
                    this.teachers = paginatedData.data;
                    this.totalCount = paginatedData.totalCount;
                    this.isLoading = false;
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching teachers: ${err.message}`;
                }
            });
    }

    loadSchools(): void {
        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(",")
        }

        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (data: SchoolResponse) => {
                    this.schools = data.data;
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
                    this.districts = ResponseHandlerUtil.extractData<District[]>(response);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching districts: ${err.message}`;
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadTeachers();
    }

    onTeachersRepair(): void {
        this.isLoading = true;
        this.teacherService.repairTeachers().subscribe({
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

    onAllTeachersDelete(): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Bütün müəllimləri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                const teacherIds = this.teachers.map(s => s._id).join(",");
                this.teacherService.deleteTeachers(teacherIds).subscribe({
                    next: (response) => {
                        this.loadTeachers();
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }

    onTeacherCreate(): void {
        const dialogRef = this.dialog.open(TeacherEditingDialogComponent, {
            width: '1000px',
            data: {
                teacher: null,
                isEditing: false
            }
        });
        
        dialogRef.afterClosed().subscribe((result: Teacher) => {
            if (result) {
                this.teacherService.createTeacher(result).subscribe({
                    next: (response: ResponseFromBackend) => {
                        this.teachers = [...this.teachers, ResponseHandlerUtil.extractData<Teacher>(response)];
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yaradıldı', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onTeacherUpdate(teacher: Teacher): void {
        const dialogRef = this.dialog.open(TeacherEditingDialogComponent, {
            width: '1000px',
            data: { teacher, isEditing: true }
        });

        dialogRef.afterClosed().subscribe((result: Teacher) => {
            if (result) {
                this.teacherService.updateTeacher(result).subscribe({
                    next: (response) => {
                        const index = this.teachers.findIndex(s => s._id === result._id);
                        this.teachers[index] = ResponseHandlerUtil.extractData<Teacher>(response);
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onTeacherDelete(studentId: string): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Müəllimi silmək istədiyinizdən əminsiniz mi?\n\n DİQQƏT!\nMüəllim silinərkən onun BÜTÜN şagirdləri də silinəcək!' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.teacherService.deleteTeacher(studentId).subscribe({
                    next: (response) => {
                        this.teachers = this.teachers.filter(s => s._id !== studentId);
                        this.snackBar.open(response.message || 'Müəllim uğurla silindi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }    
}