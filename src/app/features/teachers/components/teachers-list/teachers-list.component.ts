import { Component, OnInit } from '@angular/core';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { MatDialog } from '@angular/material/dialog';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { AuthService } from '../../../../core/services/auth.service';
import { RepairingResults } from '../../../../core/models/student.model';
import { TeacherEditingDialogComponent } from '../teacher-editing/teacher-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, Settings } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { AdvancedFiltersComponent, FilterField } from '../../../../shared/components/ui/advanced-filters/advanced-filters.component';

@Component({
    selector: 'app-teachers-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent
    ],
    templateUrl: './teachers-list.component.html',
    styleUrls: ['./teachers-list.component.scss']
})
export class TeachersListComponent implements OnInit {
    teachers: Teacher[] = [];
    districts: District[] = [];
    schools: School[] = [];
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
    
    // Pagination
    totalCount = 0;
    pageSize = 100;
    pageIndex = 0;
    
    // Filters
    filterConfig: FilterField[] = [];
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Müəllimənin kodu', sortable: true, type: 'text' },
        { key: 'fullname', label: 'Soyadı, adı və ata adı', sortable: true, type: 'text' },
        { key: 'school.name', label: 'Məktəbi', sortable: true, type: 'text' },
        { key: 'district.name', label: 'Rayonu / şəhəri', sortable: true, type: 'text' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: true, type: 'number', align: 'center' }
    ];
    
    tableActions: TableAction[] = [
        {
            key: 'edit',
            label: 'Düzəliş et',
            icon: Edit,
            variant: 'primary',
            condition: () => this.isAdminOrSuperAdmin()
        },
        {
            key: 'delete',
            label: 'Sil',
            icon: Trash2,
            variant: 'danger',
            condition: () => this.isAdminOrSuperAdmin()
        }
    ];
    
    actionButtons: ActionButton[] = [];
    
    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly Settings = Settings;

    constructor(
        private teacherService: TeacherService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}





    ngOnInit(): void {
        this.setupActionButtons();
        this.loadDistricts();
        this.loadTeachers();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];
        
        if (this.isAdminOrSuperAdmin()) {
            this.actionButtons.push(
                {
                    label: 'Müəllim əlavə et',
                    icon: this.Plus,
                    action: () => this.onTeacherCreate(),
                    variant: 'primary'
                },
                {
                    label: 'Fayldan əlavə et',
                    icon: this.Upload,
                    action: () => this.onFileUpload(),
                    variant: 'secondary'
                },
                {
                    label: 'Qüsurları düzəlt',
                    icon: this.Settings,
                    action: () => this.onTeachersRepair(),
                    variant: 'secondary'
                },
                {
                    label: 'Statistikanı yenilə',
                    icon: this.RefreshCw,
                    action: () => this.onUpdateTeachersStats(),
                    variant: 'secondary'
                }
            );
        }
    }

    private setupFilters(): void {
        this.filterConfig = [
            {
                key: 'districts',
                label: 'Rayonlar / şəhərlər',
                type: 'multi-select',
                options: this.districts.map(d => ({ value: d._id, label: d.name })),
                placeholder: 'Rayonları seçin...',
                searchable: true,
                clearable: true,
                width: 'md'
            },
            {
                key: 'schools',
                label: 'Məktəblər',
                type: 'multi-select',
                options: this.schools.map(s => ({ value: s._id, label: s.name })),
                placeholder: 'Məktəbləri seçin...',
                searchable: true,
                clearable: true,
                width: 'md',
                dependsOn: 'districts'
            }
        ];
    }

    onFilterChange(filterData: any): void {
        // Handle district filter change
        if (filterData.districts !== undefined) {
            this.selectedDistrictIds = filterData.districts || [];
            this.selectedSchoolIds = []; // Clear school selection when districts change
            this.loadSchools(); // Reload schools for selected districts
        }
        
        // Handle school filter change
        if (filterData.schools !== undefined) {
            this.selectedSchoolIds = filterData.schools || [];
        }

        // Reset pagination and reload data
        this.pageIndex = 0;
        
        this.loadTeachers();
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onTeacherUpdate(event.item);
                break;
            case 'delete':
                this.onTeacherDelete(event.item._id);
                break;
        }
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
                    this.setupFilters();
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
                    this.setupFilters();
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching districts: ${err.message}`;
                }
            });
    }

    onPageChange(event: PaginationEvent): void {
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

    onFileUpload(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.style.display = 'none';
        
        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target?.files?.length) {
                const file = target.files[0];
                this.teacherService.uploadFile(file).subscribe({
                    next: (response) => {
                        this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'Bağla', this.matSnackConfig);
                        this.missingSchoolCodes = response.missingSchoolCodes || [];
                        this.teacherCodesWithoutSchoolCodes = response.teacherCodesWithoutSchoolCodes || [];
                        this.incorrectTeacherCodes = response.incorrectTeacherCodes || [];
                        this.loadTeachers();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error?.message || 'Fayl yüklənməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }    
}