import { Component, OnInit } from '@angular/core';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { SchoolService } from '../../services/school.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { DistrictService } from '../../../districts/services/district.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { AdvancedFiltersComponent, FilterField } from '../../../../shared/components/ui/advanced-filters/advanced-filters.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';

@Component({
    selector: 'app-schools-list',
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
    templateUrl: './schools-list.component.html',
    styleUrls: ['./schools-list.component.scss']
})
export class SchoolsListComponent implements OnInit {
    schools: School[] = [];
    districts: District[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';
    
    // Pagination
    totalCount = 0;
    pageSize = 1000;
    pageIndex = 0;
    
    // Sorting
    sortColumn = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
    
    // Navigation & Filters
    districtId?: string; // ID района из маршрута для фильтрации
    selectedDistrictIds: string[] = [];
    filterConfig: FilterField[] = [];
    districtOptions: SelectOption[] = [];
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Məktəb kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Məktəb adı', sortable: true, type: 'text' },
        { key: 'district.name', label: 'Rayon / şəhər', sortable: true, type: 'text' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: true, type: 'number', align: 'center' }
    ];
    
    tableActions: TableAction[] = [
        {
            key: 'edit',
            label: 'Düzəliş et',
            icon: Edit,
            variant: 'primary',
            condition: () => this.authService.canEditSchools()
        }
    ];
    
    actionButtons: ActionButton[] = [];
    backButton?: BackButton;
    
    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly ArrowLeft = ArrowLeft;
    readonly Trash = Trash;
    
    isUpdatingStats = false;
    
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }

    constructor(
        private schoolService: SchoolService,
        private districtService: DistrictService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Check if we're viewing schools for a specific district
        this.route.params.subscribe(params => {
            this.districtId = params['id'];
            if (this.districtId) {
                this.selectedDistrictIds = [this.districtId];
            }
            // Setup buttons after we know if districtId exists
            this.setupActionButtons();
        });
        
        // Restore state from query parameters if coming back
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['schoolPage'] !== undefined) {
                this.pageIndex = parseInt(queryParams['schoolPage']) || 0;
            }
            if (queryParams['schoolPageSize'] !== undefined) {
                this.pageSize = parseInt(queryParams['schoolPageSize']) || 100;
            }
            if (queryParams['selectedDistrictIds'] && !this.districtId) {
                // Only restore district selection if not in filtered view
                this.selectedDistrictIds = queryParams['selectedDistrictIds'].split(',').filter((id: string) => id.trim() !== '');
            }
        });
        
        this.setupFilters();
        this.loadDistricts();
        this.loadSchools();
    }
    
    private setupActionButtons(): void {
        this.actionButtons = [];
        
        // Setup back button - always show it
        this.backButton = {
            show: true,
            action: () => this.goBack()
        };

        if (this.authService.canCreateSchools()) {
            this.actionButtons.push({
                label: 'Məktəb əlavə et',
                icon: this.Plus,
                action: () => this.openAddSchoolDialog(),
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
                    label: 'Statistikanı yenilə',
                    icon: this.RefreshCw,
                    action: () => this.onUpdateSchoolsStats(),
                    variant: 'secondary'
                }
            );
        }
        
        if (this.authService.canDeleteSchools() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Ekranda olanları sil',
                icon: this.Trash,
                action: () => this.onAllSchoolsDelete(),
                variant: 'secondary'
            });
        }
        console.log('Final actionButtons array:', this.actionButtons);
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }
    
    loadDistricts(): void {
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        };

        this.districtService.getDistricts(params).subscribe({
            next: (response: DistrictResponse) => {
                this.districts = ResponseHandlerUtil.extractData<District[]>(response) || [];
                this.districtOptions = this.districts.map(district => ({
                    value: district._id,
                    label: `${district.name} (${district.studentCount || 0} şagird)`
                }));
            },
            error: (err: any) => {
                console.error('Error loading districts:', err);
            }
        });
    }
    
    setupFilters(): void {
        this.filterConfig = [
            {
                type: 'multi-select',
                key: 'districtIds',
                label: 'Rayon / şəhər seçin',
                options: this.districts.map(d => ({ value: d._id, label: d.name })),
                placeholder: 'Rayonları seçin...',
                searchable: true,
                clearable: true
            }
        ];
    }
    
    onFilterChange(filters: Record<string, any>): void {
        this.selectedDistrictIds = filters['districtIds'] || [];
        this.pageIndex = 0;
        this.loadSchools();
    }
    
    onUpdateSchoolsStats(): void {
        this.isUpdatingStats = true;
        this.setupActionButtons();
        
        this.schoolService.updateSchoolsStats().subscribe({
            next: (response: any) => {
                this.isUpdatingStats = false;
                this.setupActionButtons();
                this.snackBar.open('Statistika uğurla yeniləndi', 'OK', this.matSnackConfig);
                this.loadSchools();
            },
            error: (error) => {
                this.isUpdatingStats = false;
                this.setupActionButtons();
                this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }
    
    openAddSchoolDialog(): void {
        const dialogRef = this.dialog.open(SchoolEditingDialogComponent, {
          width: '1000px',
          data: { 
            school: null, 
            isEditing: false,
            canDelete: false
          },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.schoolService.createSchool(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newSchool = ResponseHandlerUtil.extractData<School>(response);
                        // Добавляем новую школу в начало списка
                        this.schools = [newSchool, ...this.schools];
                        this.totalCount++;
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Məktəb uğurla yaradıldı', 'OK', this.matSnackConfig);
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    loadSchools(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
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

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onSchoolEdit(event.item);
                break;
        }
    }

    onSchoolView(school: any): void {
        // Save current state in query parameters for back navigation
        const queryParams: any = {
            schoolPage: this.pageIndex,
            schoolPageSize: this.pageSize,
            selectedDistrictIds: this.selectedDistrictIds.join(',')
        };
        
        // If we came from districts, preserve district state
        this.route.queryParams.subscribe(currentParams => {
            if (currentParams['districtPage'] !== undefined) {
                queryParams.districtPage = currentParams['districtPage'];
            }
            if (currentParams['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = currentParams['districtPageSize'];
            }
        });
        
        this.router.navigate(['/schools', school._id, 'teachers'], { 
            queryParams 
        });
    }

    goBack(): void {
        // If we came from a district, navigate back to districts with preserved state
        if (this.districtId) {
            this.route.queryParams.subscribe(params => {
                const queryParams: any = {};
                if (params['districtPage'] !== undefined) {
                    queryParams.districtPage = params['districtPage'];
                }
                if (params['districtPageSize'] !== undefined) {
                    queryParams.districtPageSize = params['districtPageSize'];
                }
                this.router.navigate(['/districts'], { queryParams });
            });
        } else {
            // Otherwise, go to home page
            this.router.navigate(['/']);
        }
    }

    onSchoolEdit(school: School): void {
        const dialogRef = this.dialog.open(SchoolEditingDialogComponent, {
            width: '1000px',
            data: { 
                school, 
                isEditing: true,
                canDelete: this.authService.canDeleteSchools()
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleSchoolDelete(school);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.schoolService.updateSchool(result.data).subscribe({
                    next: (response) => {
                        const updatedSchool = ResponseHandlerUtil.extractData<School>(response);
                        const index = this.schools.findIndex(s => s._id === result.data._id);
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.schools = [
                                ...this.schools.slice(0, index),
                                updatedSchool,
                                ...this.schools.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Məktəb uğurla yeniləndi', 'Bağla', this.matSnackConfig);
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

    private handleSchoolDelete(school: School): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { 
                title: 'Silinməyə razılıq', 
                text: 'Məktəbi silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəb silinərkən ona bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!' 
            }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.schoolService.deleteSchool(school._id).subscribe({
                    next: (data) => {
                        this.loadSchools();
                        this.snackBar.open('Məktəb uğurla silindi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onAllSchoolsDelete(): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { 
                title: 'Silinməyə razılıq', 
                text: 'Ekranda göstərilən bütün məktəbləri silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəblər silinərkən onlara bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!' 
            }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                const schoolIds = this.schools.map(s => s._id).join(",");
                this.schoolService.deleteSchools(schoolIds).subscribe({
                    next: (response) => {
                        this.loadSchools();
                        this.snackBar.open('Məktəblər uğurla silindi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
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
                this.schoolService.uploadFile(file).subscribe({
                    next: (response) => {
                        this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'Bağla', this.matSnackConfig);
                        this.loadSchools();
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

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadSchools();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.loadSchools();
    }

}
