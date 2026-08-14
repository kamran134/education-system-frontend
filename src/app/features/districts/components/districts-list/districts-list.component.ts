
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { DistrictService } from '../../services/district.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { DistrictEditingDialogComponent } from '../district-editing-dialog/district-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { runStatsUpdate } from '../../../../core/utils/stats-update.util';
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2 } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
    selector: 'app-districts-list',
    imports: [
    RouterModule,
    LucideAngularModule,
    ListLayoutComponent,
    DataTableComponent
],
    templateUrl: './districts-list.component.html',
    styleUrls: ['./districts-list.component.scss']
})
export class DistrictsListComponent implements OnInit {
    districts: District[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';

    // Pagination properties
    totalCount = 0;
    pageSize = 100;
    pageIndex = 0;

    // Sorting properties
    sortColumn = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Navigation: ID региона из маршрута /regions/:id/districts, по образцу districtId в schools-list
    regionId?: string;
    selectedRegionIds: string[] = [];
    backButton?: BackButton;

    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Rayon / şəhər kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Adı', sortable: true, type: 'text' },
        { key: 'regionName', label: 'Regional idarə', sortable: false, type: 'text' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: true, type: 'number', align: 'center' }
    ];

    tableActions: TableAction[] = [
        {
            key: 'edit',
            label: 'Düzəliş et',
            icon: Edit,
            variant: 'primary',
            condition: () => this.authService.canEditDistricts()
        }
    ];

    actionButtons: ActionButton[] = [];

    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;

    isUpdatingStats = false;
    onUpdateDistrictsStats(): void {
        runStatsUpdate(this.districtService.updateDistrictsStats(), {
            setUpdating: v => { this.isUpdatingStats = v; },
            onSuccess: () => this.loadDistricts(),
            toastService: this.toastService,
            onToggle: () => this.setupActionButtons()
        });
    }

    private destroyRef = inject(DestroyRef);

    constructor(
        private dialog: Dialog,
        private authService: AuthService,
        private districtService: DistrictService,
        private toastService: ToastService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // Проверяем, не смотрим ли мы районы конкретного региона (/regions/:id/districts)
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.regionId = params['id'];
            if (this.regionId) {
                this.selectedRegionIds = [this.regionId];
            }
            this.setupActionButtons();
            this.loadDistricts();
        });

        // Restore state from query parameters if coming back
        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            if (params['districtPage'] !== undefined) {
                this.pageIndex = parseInt(params['districtPage']) || 0;
            }
            if (params['districtPageSize'] !== undefined) {
                this.pageSize = parseInt(params['districtPageSize']) || 100;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/regions']);
    }

    private setupActionButtons(): void {
        this.actionButtons = [];

        if (this.regionId) {
            this.backButton = { show: true, action: () => this.goBack() };
        }

        if (this.authService.canCreateDistricts()) {
            this.actionButtons.push({
                label: 'Yeni rayon / şəhər əlavə et',
                icon: this.Plus,
                action: () => this.openAddDistrictDialog(),
                variant: 'primary'
            });
        }

        // if (this.isAdminOrSuperAdmin()) {
        //     this.actionButtons.push({
        //         label: 'Reytinqləri yenilə',
        //         icon: this.RefreshCw,
        //         action: () => this.onUpdateDistrictsStats(),
        //         variant: 'secondary',
        //         loading: this.isUpdatingStats,
        //         disabled: this.isUpdatingStats
        //     });
        // }
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    openAddDistrictDialog(): void {
        const dialogRef = this.dialog.open<any>(DistrictEditingDialogComponent, {
          width: '400px',
          data: {
            district: { name: '', code: '', studentCount: 0, regionId: this.regionId ? parseInt(this.regionId, 10) : null },
            isEditing: false,
            canDelete: false
          },
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.districtService.addDistrict(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newDistrict = ResponseHandlerUtil.extractData<District>(response);
                        // Добавляем новый район в начало списка
                        this.districts = [newDistrict, ...this.districts];
                        this.totalCount++;
                        this.isLoading = false;
                        this.toastService.show(response.message || 'Rayon / şəhər uğurla yaradıldı', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.toastService.show(error.error.message, 'error');
                    }
                });
            }
        });
    }

    loadDistricts(): void {
        this.isLoading = true;
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        }
        this.districtService.getDistricts(params)
            .subscribe({
                next: (response: DistrictResponse) => {
                    const paginatedData = ResponseHandlerUtil.extractPaginatedData<District>(response);
                    this.districts = paginatedData.data;
                    this.totalCount = paginatedData.totalCount;
                    this.isLoading = false;
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching districts:  ${err.message}`;
                }
            });
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadDistricts();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0; // Reset to first page when sorting
        this.loadDistricts();
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onDistrictEdit(event.item);
                break;
        }
    }

    onDistrictEdit(district: District): void {
        const dialogRef = this.dialog.open<any>(DistrictEditingDialogComponent, {
            width: '400px',
            data: {
                district: {
                    id: district.id,
                    name: district.name,
                    code: district.code,
                    studentCount: district.studentCount,
                    regionId: district.regionId ?? null
                },
                isEditing: true,
                canDelete: this.authService.canDeleteDistricts()
            },
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleDistrictDelete(district);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.districtService.updateDistrict(district.id, result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const updatedDistrict = ResponseHandlerUtil.extractData<District>(response);
                        const index = this.districts.findIndex(d => IdUtil.equals(d.id, district.id));
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.districts = [
                                ...this.districts.slice(0, index),
                                updatedDistrict,
                                ...this.districts.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.toastService.show(response.message || 'Rayon / şəhər uğurla yeniləndi', 'success');
                    },
                    error: (error: any) => {
                        this.isLoading = false;
                        this.toastService.show(error.error.message, 'error');
                    }
                });
            }
        });
    }

    private handleDistrictDelete(district: District): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Rayonu / şəhəri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.closed.subscribe((result: boolean) => {
            if (result) {
                this.isLoading = true;
                this.districtService.deleteDistrict(district.id).subscribe({
                    next: (data) => {
                        // Удаляем район из списка без перезагрузки
                        this.districts = this.districts.filter(d => d.id !== district.id);
                        this.totalCount--;
                        this.isLoading = false;
                        this.toastService.show('Rayon / şəhər uğurla silindi', 'success');
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

    onDistrictView(district: District): void {
        // Save current state in query parameters for back navigation
        const queryParams = {
            districtPage: this.pageIndex,
            districtPageSize: this.pageSize
        };
        this.router.navigate(['/districts', district.id, 'schools'], {
            queryParams
        });
    }
}
