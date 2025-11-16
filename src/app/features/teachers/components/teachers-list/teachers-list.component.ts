import { Component, OnInit } from '@angular/core';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, Settings, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { AdvancedFiltersComponent, FilterField } from '../../../../shared/components/ui/advanced-filters/advanced-filters.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';

@Component({
    selector: 'app-teachers-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent,
        SelectComponent
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
    schoolId: string | null = null;
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
    districtOptions: SelectOption[] = [];
    schoolOptions: SelectOption[] = [];
    missingSchoolCodes: number[] = [];
    teacherCodesWithoutSchoolCodes: number[] = [];
    incorrectTeacherCodes: number[] = [];
    repairingResults: RepairingResults = {};
    
    // Pagination
    totalCount = 0;
    pageSize = 1000;
    pageIndex = 0;
    
    // Sorting
    sortColumn = 'fullname';
    sortDirection: 'asc' | 'desc' = 'asc';
    
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
            condition: () => this.authService.canEditTeachers()
        }
    ];
    
    actionButtons: ActionButton[] = [];
    backButton?: BackButton;
    
    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly Settings = Settings;
    readonly ArrowLeft = ArrowLeft;
    readonly Trash = Trash;

    constructor(
        private teacherService: TeacherService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Check if we're viewing teachers for a specific school
        this.route.params.subscribe(params => {
            this.schoolId = params['id'];
            if (this.schoolId) {
                this.selectedSchoolIds = [this.schoolId];
            }
            // Setup buttons after we know if schoolId exists
            this.setupActionButtons();
        });
        
        // Restore state from query parameters if coming back
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['teacherPage'] !== undefined) {
                this.pageIndex = parseInt(queryParams['teacherPage']) || 0;
            }
            if (queryParams['teacherPageSize'] !== undefined) {
                this.pageSize = parseInt(queryParams['teacherPageSize']) || 1000;
            }
            if (queryParams['selectedDistrictIds'] && !this.schoolId) {
                // Only restore district selection if not in filtered view
                this.selectedDistrictIds = queryParams['selectedDistrictIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['selectedSchoolIds'] && !this.schoolId) {
                // Only restore school selection if not in filtered view
                this.selectedSchoolIds = queryParams['selectedSchoolIds'].split(',').filter((id: string) => id.trim() !== '');
            }
        });
        
        this.setupFilters();
        this.loadDistricts();
        this.loadTeachers();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];
        
        // Setup back button - always show it
        this.backButton = {
            show: true,
            action: () => this.goBack()
        };
        
        if (this.authService.canCreateTeachers()) {
            this.actionButtons.push({
                label: 'Müəllim əlavə et',
                icon: this.Plus,
                action: () => this.onTeacherCreate(),
                variant: 'primary'
            });
        }
        
        if (this.isAdminOrSuperAdmin()) {
            this.actionButtons.push(
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
        
        if (this.authService.canDeleteTeachers() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Ekranda olanları sil',
                icon: this.Trash,
                action: () => this.onAllTeachersDelete(),
                variant: 'secondary'
            });
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

    onDistrictChange(selectedDistricts: string[]): void {
        console.log('🎯 onDistrictChange called with:', selectedDistricts);
        this.selectedDistrictIds = selectedDistricts || [];
        this.selectedSchoolIds = []; // Clear school selection when districts change
        console.log('🔄 About to call loadSchools...');
        this.loadSchools(); // Reload schools for selected districts
        
        // Reset pagination and reload data
        this.pageIndex = 0;
        this.loadTeachers();
    }

    onSchoolChange(selectedSchools: string[]): void {
        this.selectedSchoolIds = selectedSchools || [];
        
        // Reset pagination and reload data
        this.pageIndex = 0;
        this.loadTeachers();
    }

    onFilterChange(filterData: any): void {
        // Handle district filter change
        if (filterData.districts !== undefined) {
            this.onDistrictChange(filterData.districts);
        }
        
        // Handle school filter change
        if (filterData.schools !== undefined) {
            this.onSchoolChange(filterData.schools);
        }
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onTeacherUpdate(event.item);
                break;
        }
    }

    onTeacherView(teacher: any): void {
        // Save current state in query parameters for back navigation
        const queryParams: any = {
            teacherPage: this.pageIndex,
            teacherPageSize: this.pageSize,
            selectedDistrictIds: this.selectedDistrictIds.join(','),
            selectedSchoolIds: this.selectedSchoolIds.join(',')
        };
        
        // Preserve previous states if they exist
        this.route.queryParams.subscribe(currentParams => {
            if (currentParams['districtPage'] !== undefined) {
                queryParams.districtPage = currentParams['districtPage'];
            }
            if (currentParams['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = currentParams['districtPageSize'];
            }
            if (currentParams['schoolPage'] !== undefined) {
                queryParams.schoolPage = currentParams['schoolPage'];
            }
            if (currentParams['schoolPageSize'] !== undefined) {
                queryParams.schoolPageSize = currentParams['schoolPageSize'];
            }
        });
        
        this.router.navigate(['/teachers', teacher._id, 'students'], { 
            queryParams 
        });
    }

    goBack(): void {
        // If we came from a school, navigate back to schools with preserved state
        if (this.schoolId) {
            this.route.queryParams.subscribe(params => {
                const queryParams: any = {};
                
                // Preserve all previous states
                if (params['districtPage'] !== undefined) {
                    queryParams.districtPage = params['districtPage'];
                }
                if (params['districtPageSize'] !== undefined) {
                    queryParams.districtPageSize = params['districtPageSize'];
                }
                if (params['schoolPage'] !== undefined) {
                    queryParams.schoolPage = params['schoolPage'];
                }
                if (params['schoolPageSize'] !== undefined) {
                    queryParams.schoolPageSize = params['schoolPageSize'];
                }
                if (params['selectedDistrictIds']) {
                    queryParams.selectedDistrictIds = params['selectedDistrictIds'];
                }
                
                this.router.navigate(['/schools'], { queryParams });
            });
        } else {
            // Otherwise, go to home page
            this.router.navigate(['/']);
        }
    }

    loadTeachers(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
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
        console.log('📚 loadSchools called with selectedDistrictIds:', this.selectedDistrictIds);
        if (this.selectedDistrictIds.length === 0) {
            this.schools = [];
            this.schoolOptions = [];
            console.log('❌ No districts selected, clearing schools');
            return;
        }

        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(","),
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        }

        console.log('📞 Calling schoolService.getSchoolsForFilter with params:', params);
        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (data: SchoolResponse) => {
                    console.log('✅ Schools response received:', data);
                    console.log('📊 data.data:', data.data);
                    console.log('🔍 Direct data:', data);
                    
                    // Попробуем разные варианты структуры ответа
                    this.schools = data.data || data || [];
                    console.log('🏗️ this.schools after assignment:', this.schools);
                    
                    this.schoolOptions = this.schools.map(school => {
                        console.log('🏫 Processing school:', school);
                        return {
                            value: school._id,
                            label: school.name
                        };
                    });
                    console.log('🏫 Updated schoolOptions:', this.schoolOptions);
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
                    this.districts = ResponseHandlerUtil.extractData<District[]>(response) || [];
                    this.districtOptions = this.districts.map(district => ({
                        value: district._id,
                        label: `${district.name} (${district.studentCount || 0} şagird)`
                    }));
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

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
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
                isEditing: false,
                canDelete: false
            }
        });
        
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.teacherService.createTeacher(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newTeacher = ResponseHandlerUtil.extractData<Teacher>(response);
                        // Добавляем нового учителя в начало списка
                        this.teachers = [newTeacher, ...this.teachers];
                        this.totalCount++;
                        this.isLoading = false;
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yaradıldı', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onTeacherUpdate(teacher: Teacher): void {
        const dialogRef = this.dialog.open(TeacherEditingDialogComponent, {
            width: '1000px',
            data: { 
                teacher, 
                isEditing: true,
                canDelete: this.authService.canDeleteTeachers()
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleTeacherDelete(teacher._id);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.teacherService.updateTeacher(result.data).subscribe({
                    next: (response) => {
                        const updatedTeacher = ResponseHandlerUtil.extractData<Teacher>(response);
                        const index = this.teachers.findIndex(s => s._id === result.data._id);
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.teachers = [
                                ...this.teachers.slice(0, index),
                                updatedTeacher,
                                ...this.teachers.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    private handleTeacherDelete(studentId: string): void {
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