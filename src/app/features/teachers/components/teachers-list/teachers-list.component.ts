import { Component, DestroyRef, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { ProfileChangeService } from '../../../../core/services/profile-change.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { TeacherService } from '../../services/teacher.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Dialog } from '@angular/cdk/dialog';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { runStatsUpdate } from '../../../../core/utils/stats-update.util';
import { AuthService } from '../../../../core/services/auth.service';
import { RepairingResults } from '../../../../core/models/student.model';
import { TeacherEditingDialogComponent } from '../teacher-editing/teacher-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Plus, RefreshCw, Trash2, Upload, Settings, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { FileUploadErrorsDialogComponent, FileUploadErrorsData } from '../../../../shared/components/file-upload-errors-dialog/file-upload-errors-dialog.component';

@Component({
    selector: 'app-teachers-list',
    imports: [
    FormsModule,
    RouterModule,
    LucideAngularModule,
    ListLayoutComponent,
    DataTableComponent,
    FullscreenPanelComponent,
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
    isUpdatingStats = false;
    onUpdateTeachersStats(): void {
        runStatsUpdate(this.teacherService.updateTeachersStats(), {
            setUpdating: v => { this.isUpdatingStats = v; },
            onSuccess: () => this.loadTeachers(),
            toastService: this.toastService
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
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    pageIndex = 0;
    tableFullscreen = false;

    // Sorting
    sortColumn = 'fullname';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Table configuration
    @ViewChild('fullnameCell', { static: true }) fullnameCellTemplate!: TemplateRef<any>;

    get tableColumns(): TableColumn[] {
        return [
            { key: 'code', label: 'Müəllimənin kodu', sortable: true, type: 'text' },
            { key: 'fullname', label: 'Soyadı, adı və ata adı', sortable: true, cellTemplate: this.fullnameCellTemplate },
            { key: 'school.name', label: 'Məktəbi', sortable: true, type: 'text' },
            { key: 'district.name', label: 'Təhsil sektoru', sortable: true, type: 'text' },
            { key: 'studentCount', label: 'Şagird sayı', sortable: true, type: 'number', align: 'center' }
        ];
    }

    /** Точка-маркер «есть неподтверждённые данные» (BASE_FIXES_TASK.md §2.7). */
    pendingTeacherIds = new Set<number>();

    // Пусто: клик по строке ведёт на профиль (PROFILES_V2_TASK.md §3.1), редактирование
    // переехало на страницу профиля (TeacherProfileComponent::openEditDialog).
    tableActions: TableAction[] = [];

    actionButtons: ActionButton[] = [];
    backButton?: BackButton;

    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly Settings = Settings;
    readonly ArrowLeft = ArrowLeft;
    readonly Trash = Trash;

    private destroyRef = inject(DestroyRef);

    constructor(
        private teacherService: TeacherService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private authService: AuthService,
        private toastService: ToastService,
        private dialog: Dialog,
        private route: ActivatedRoute,
        private router: Router,
        private profileChangeService: ProfileChangeService
    ) {}

    private loadPendingMarkers(): void {
        if (!this.authService.isAdminOrSuperAdmin()) return;
        this.profileChangeService.pendingIds('teacher').subscribe({
            next: (ids) => { this.pendingTeacherIds = new Set(ids); },
            error: () => {}
        });
    }

    ngOnInit(): void {
        // Check if we're viewing teachers for a specific school
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.schoolId = params['id'];
            if (this.schoolId) {
                this.selectedSchoolIds = [this.schoolId];
            }
            // Setup buttons after we know if schoolId exists
            this.setupActionButtons();
        });

        // Restore state from query parameters if coming back
        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(queryParams => {
            if (queryParams['teacherPage'] !== undefined) {
                this.pageIndex = parseInt(queryParams['teacherPage']) || 0;
            }
            if (queryParams['teacherPageSize'] !== undefined) {
                this.pageSize = parseInt(queryParams['teacherPageSize']) || TABLE_PAGE_SIZE_DEFAULT;
            }

            // Restore district selection (for display purposes)
            if (queryParams['selectedDistrictIds']) {
                this.selectedDistrictIds = queryParams['selectedDistrictIds'].split(',').filter((id: string) => id.trim() !== '');
            }

            // Restore school selection only if not in filtered view
            if (queryParams['selectedSchoolIds'] && !this.schoolId) {
                this.selectedSchoolIds = queryParams['selectedSchoolIds'].split(',').filter((id: string) => id.trim() !== '');
            }

            // Load districts first, then cascade load schools if needed
            this.loadDistricts();

            // After districts loaded, cascade load schools based on restored filters
            if (this.selectedDistrictIds.length > 0) {
                this.loadSchools();
            }

            this.loadTeachers();
            this.loadPendingMarkers();
        });
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
                // {
                //     label: 'Reytinqləri yenilə',
                //     icon: this.RefreshCw,
                //     action: () => this.onUpdateTeachersStats(),
                //     variant: 'secondary'
                // }
            );
        }

        if (this.authService.canDeleteTeachers() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Ekranda olanları sil',
                icon: this.Trash,
                action: () => this.onAllTeachersDelete(),
                variant: 'secondary',
                showOnHover: true
            });
        }
    }

    onDistrictChange(selectedDistricts: string[]): void {
        this.selectedDistrictIds = selectedDistricts || [];
        this.selectedSchoolIds = []; // Clear school selection when districts change
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

    /** Единственная навигация со строки (PROFILES_V2_TASK.md §3.1) — редактирование, удаление
     *  и просмотр учеников учителя теперь живут на самом профиле. */
    onTeacherProfile(teacher: Teacher): void {
        this.router.navigate(['/teachers', teacher.id, 'profile']);
    }

    goBack(): void {
        this.route.queryParams.subscribe(params => {
            const queryParams: any = {};

            // Preserve all pagination states
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
            if (params['fromDistrictId']) {
                queryParams.fromDistrictId = params['fromDistrictId'];
            }

            // Check if we came from schools (either via route param or query param)
            const fromSchoolId = this.schoolId || params['fromSchoolId'];

            if (fromSchoolId) {
                // Go back to schools LIST, not to specific school's teachers
                this.router.navigate(['/schools'], { queryParams });
            } else {
                // Otherwise, go to home page
                this.router.navigate(['/panel']);
            }
        });
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
        if (this.selectedDistrictIds.length === 0) {
            this.schools = [];
            this.schoolOptions = [];
            return;
        }

        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(",")
        };

        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (schools: any) => {
                    this.schools = schools || [];
                    this.schoolOptions = this.schools.map(school => {
                        return {
                            value: school.id,
                            label: school.name
                        };
                    });
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
                        value: district.id,
                        label: district.name
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
                this.toastService.show(response.message || '', 'success');
                this.isLoading = false;
            },
            error: (error) => {
                console.error(error);
                this.toastService.show(error.error.message, 'error');
                this.isLoading = false;
            }
        });
    }

    onAllTeachersDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Bütün müəllimləri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.closed.subscribe((result: boolean) => {
            if (result) {
                const teacherIds = this.teachers.map(s => s.id).join(",");
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
        const dialogRef = this.dialog.open<any>(TeacherEditingDialogComponent, {
            width: '1000px',
            data: {
                teacher: null,
                isEditing: false,
                canDelete: false
            }
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.teacherService.createTeacher(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newTeacher = ResponseHandlerUtil.extractData<Teacher>(response);
                        // Добавляем нового учителя в начало списка
                        this.teachers = [newTeacher, ...this.teachers];
                        this.totalCount++;
                        this.isLoading = false;
                        this.toastService.show(ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yaradıldı', 'success');
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
                        const validationErrors = response.validationErrors || {};

                        // Check if there are any validation errors
                        const hasErrors =
                            (validationErrors.incorrectTeacherCodes && validationErrors.incorrectTeacherCodes.length > 0) ||
                            (validationErrors.missingSchoolCodes && validationErrors.missingSchoolCodes.length > 0) ||
                            (validationErrors.teacherCodesWithoutSchoolCodes && validationErrors.teacherCodesWithoutSchoolCodes.length > 0) ||
                            (validationErrors.existingTeacherCodes && validationErrors.existingTeacherCodes.length > 0);

                        if (hasErrors) {
                            // Show error dialog
                            const dialogData: FileUploadErrorsData = {
                                type: 'teachers',
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
                                this.loadTeachers();
                            });
                        } else {
                            // No errors, show success message and refresh immediately
                            this.toastService.show(response.message || 'Fayl uğurla yükləndi', 'success');
                            this.loadTeachers();
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
}
