import { Component, OnInit } from '@angular/core';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { SchoolService } from '../../services/school.service';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { DistrictService } from '../../../districts/services/district.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { runStatsUpdate } from '../../../../core/utils/stats-update.util';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { FileUploadErrorsDialogComponent, FileUploadErrorsData } from '../../../../shared/components/file-upload-errors-dialog/file-upload-errors-dialog.component';

@Component({
    selector: 'app-schools-list',
    imports: [
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

    constructor(
        private schoolService: SchoolService,
        private districtService: DistrictService,
        private authService: AuthService,
        private toastService: ToastService,
        private dialog: Dialog,
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

            // Restore district selection (for display purposes)
            if (queryParams['selectedDistrictIds']) {
                this.selectedDistrictIds = queryParams['selectedDistrictIds'].split(',').filter((id: string) => id.trim() !== '');
            }
        });

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
                // {
                //     label: 'Reytinqləri yenilə',
                //     icon: this.RefreshCw,
                //     action: () => this.onUpdateSchoolsStats(),
                //     variant: 'secondary'
                // }
            );
        }

        if (this.authService.canDeleteSchools() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Ekranda olanları sil',
                icon: this.Trash,
                action: () => this.onAllSchoolsDelete(),
                variant: 'secondary',
                showOnHover: true
            });
        }
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
                    value: district.id,
                    label: district.name
                }));
            },
            error: (err: any) => {
                console.error('Error loading districts:', err);
            }
        });
    }

onFilterChange(filters: Record<string, any>): void {
        this.selectedDistrictIds = filters['districtIds'] || [];
        this.pageIndex = 0;
        this.loadSchools();
    }

    onUpdateSchoolsStats(): void {
        runStatsUpdate(this.schoolService.updateSchoolsStats(), {
            setUpdating: v => { this.isUpdatingStats = v; },
            onSuccess: () => this.loadSchools(),
            toastService: this.toastService,
            onToggle: () => this.setupActionButtons()
        });
    }

    openAddSchoolDialog(): void {
        const dialogRef = this.dialog.open<any>(SchoolEditingDialogComponent, {
          width: '1000px',
          data: {
            school: null,
            isEditing: false,
            canDelete: false
          },
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.schoolService.createSchool(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newSchool = ResponseHandlerUtil.extractData<School>(response);
                        // Добавляем новую школу в начало списка
                        this.schools = [newSchool, ...this.schools];
                        this.totalCount++;
                        this.isLoading = false;
                        this.toastService.show(response.message || 'Məktəb uğurla yaradıldı', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.toastService.show(error.error.message, 'error');
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
            selectedDistrictIds: this.selectedDistrictIds.join(','),
            fromSchoolId: school.id  // Remember which school we're viewing
        };

        // If we came from districts, preserve district state
        this.route.queryParams.subscribe(currentParams => {
            if (currentParams['districtPage'] !== undefined) {
                queryParams.districtPage = currentParams['districtPage'];
            }
            if (currentParams['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = currentParams['districtPageSize'];
            }
            if (this.districtId) {
                queryParams.fromDistrictId = this.districtId;  // Remember which district
            }
        });

        this.router.navigate(['/schools', school.id, 'teachers'], {
            queryParams
        });
    }

    goBack(): void {
        this.route.queryParams.subscribe(params => {
            const queryParams: any = {};

            // Preserve pagination
            if (params['districtPage'] !== undefined) {
                queryParams.districtPage = params['districtPage'];
            }
            if (params['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = params['districtPageSize'];
            }

            // Check if we came from districts (either via route param or query param)
            const fromDistrictId = this.districtId || params['fromDistrictId'];

            if (fromDistrictId) {
                // Go back to districts LIST, not to specific district's schools
                this.router.navigate(['/districts'], { queryParams });
            } else {
                // Otherwise, go to home page
                this.router.navigate(['/panel']);
            }
        });
    }

    onSchoolEdit(school: School): void {
        const dialogRef = this.dialog.open<any>(SchoolEditingDialogComponent, {
            width: '1000px',
            data: {
                school,
                isEditing: true,
                canDelete: this.authService.canDeleteSchools()
            }
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleSchoolDelete(school);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.schoolService.updateSchool(result.data).subscribe({
                    next: (response) => {
                        const updatedSchool = ResponseHandlerUtil.extractData<School>(response);
                        const index = this.schools.findIndex(s => IdUtil.equals(s.id, result.data.id));
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.schools = [
                                ...this.schools.slice(0, index),
                                updatedSchool,
                                ...this.schools.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        const baseMessage = response.message || 'Məktəb uğurla yeniləndi';
                        const cascadeParts: string[] = [];
                        if (updatedSchool.cascadedTeachersCount) cascadeParts.push(`${updatedSchool.cascadedTeachersCount} müəllimin`);
                        if (updatedSchool.cascadedStudentsCount) cascadeParts.push(`${updatedSchool.cascadedStudentsCount} şagirdin`);
                        const cascadeMessage = cascadeParts.length ? ` (${cascadeParts.join(' və ')} kodu avtomatik yeniləndi)` : '';
                        this.toastService.show(baseMessage + cascadeMessage, 'success');
                    },
                    error: (error) => {
                        console.error(error);
                        this.isLoading = false;
                        this.toastService.show(error.error.message, 'error');
                    }
                });
            }
        });
    }

    private handleSchoolDelete(school: School): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Məktəbi silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəb silinərkən ona bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!'
            }
        });

        confirmRef.closed.subscribe((result: boolean) => {
            if (result) {
                this.schoolService.deleteSchool(school.id).subscribe({
                    next: (data) => {
                        this.loadSchools();
                        this.toastService.show('Məktəb uğurla silindi', 'success');
                    },
                    error: (error) => {
                        console.error(error);
                        this.toastService.show(error.error.message, 'error');
                    }
                });
            }
        });
    }

    onAllSchoolsDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Ekranda göstərilən bütün məktəbləri silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəblər silinərkən onlara bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!'
            }
        });

        confirmRef.closed.subscribe((result: boolean) => {
            if (result) {
                const schoolIds = this.schools.map(s => s.id).join(",");
                this.schoolService.deleteSchools(schoolIds).subscribe({
                    next: (response) => {
                        this.loadSchools();
                        this.toastService.show('Məktəblər uğurla silindi', 'success');
                    },
                    error: (error) => {
                        console.error(error);
                        this.toastService.show(error?.error?.message || 'Xəta baş verdi', 'error');
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
                        const validationErrors = response.validationErrors || {};

                        // Check if there are any validation errors
                        const hasErrors =
                            (validationErrors.incorrectSchoolCodes && validationErrors.incorrectSchoolCodes.length > 0) ||
                            (validationErrors.missingDistrictCodes && validationErrors.missingDistrictCodes.length > 0) ||
                            (validationErrors.schoolCodesWithoutDistrictCodes && validationErrors.schoolCodesWithoutDistrictCodes.length > 0) ||
                            (validationErrors.existingSchoolCodes && validationErrors.existingSchoolCodes.length > 0);

                        if (hasErrors) {
                            // Show error dialog
                            const dialogData: FileUploadErrorsData = {
                                type: 'schools',
                                errors: validationErrors
                            };

                            const dialogRef = this.dialog.open<any>(FileUploadErrorsDialogComponent, {
                                width: '700px',
                                maxWidth: '90vw',
                                data: dialogData,
                                disableClose: true
                            });

                            // Refresh table only after dialog is closed
                            dialogRef.closed.subscribe(() => {
                                this.loadSchools();
                            });
                        } else {
                            // No errors, show success message and refresh immediately
                            this.toastService.show(response.message || 'Fayl uğurla yükləndi', 'success');
                            this.loadSchools();
                        }
                    },
                    error: (error) => {
                        console.error(error);
                        this.toastService.show(error.error?.message || 'Fayl yüklənməsində xəta baş verdi', 'error');
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
