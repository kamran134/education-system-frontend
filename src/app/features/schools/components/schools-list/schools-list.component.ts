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
import { runStatsUpdate } from '../../../../core/utils/stats-update.util';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { LucideAngularModule, Plus, RefreshCw, Trash2, Upload, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';
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
    FullscreenPanelComponent,
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
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    pageIndex = 0;
    tableFullscreen = false;

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

    // Пусто: клик по строке ведёт на профиль (PROFILES_V2_TASK.md §3.1), редактирование
    // переехало на страницу профиля (SchoolProfileComponent::openEditDialog).
    tableActions: TableAction[] = [];

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
                this.pageSize = parseInt(queryParams['schoolPageSize']) || TABLE_PAGE_SIZE_DEFAULT;
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

    /** Единственная навигация со строки (PROFILES_V2_TASK.md §3.1) — редактирование, удаление
     *  и просмотр учителей школы теперь живут на самом профиле. */
    onSchoolProfile(school: School): void {
        this.router.navigate(['/schools', school.id, 'profile']);
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
