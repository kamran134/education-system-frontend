
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Region, RegionResponse } from '../../../../core/models/region.model';
import { RegionService } from '../../services/region.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { RegionEditingDialogComponent } from '../region-editing-dialog/region-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';

@Component({
    selector: 'app-regions-list',
    imports: [
    RouterModule,
    LucideAngularModule,
    ListLayoutComponent,
    DataTableComponent,
    FullscreenPanelComponent
],
    templateUrl: './regions-list.component.html',
    styleUrls: ['./regions-list.component.scss']
})
export class RegionsListComponent implements OnInit {
    regions: Region[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';

    totalCount = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    pageIndex = 0;
    tableFullscreen = false;

    sortColumn = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';

    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Regional idarə kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Adı', sortable: true, type: 'text' },
        { key: 'districtCount', label: 'Təhsil sektorlarının sayı', sortable: false, type: 'number', align: 'center' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: false, type: 'number', align: 'center' }
    ];

    // Пусто: клик по строке ведёт на профиль (PROFILES_V2_TASK.md §3.1), всё редактирование
    // и удаление переехало на страницу профиля (RegionProfileComponent::openEditDialog).
    tableActions: TableAction[] = [];

    actionButtons: ActionButton[] = [];

    readonly Plus = Plus;

    private destroyRef = inject(DestroyRef);

    constructor(
        private dialog: Dialog,
        private authService: AuthService,
        private regionService: RegionService,
        private toastService: ToastService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();

        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            if (params['regionPage'] !== undefined) {
                this.pageIndex = parseInt(params['regionPage']) || 0;
            }
            if (params['regionPageSize'] !== undefined) {
                this.pageSize = parseInt(params['regionPageSize']) || TABLE_PAGE_SIZE_DEFAULT;
            }
        });

        this.loadRegions();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];

        if (this.authService.canCreateRegions()) {
            this.actionButtons.push({
                label: 'Yeni Regional Təhsil İdarəsi əlavə et',
                icon: this.Plus,
                action: () => this.openAddRegionDialog(),
                variant: 'primary'
            });
        }
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    openAddRegionDialog(): void {
        const dialogRef = this.dialog.open<any>(RegionEditingDialogComponent, {
          width: '400px',
          data: {
            region: { name: '', code: '' },
            isEditing: false,
            canDelete: false
          },
        });

        dialogRef.closed.subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.regionService.addRegion(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newRegion = ResponseHandlerUtil.extractData<Region>(response);
                        this.regions = [newRegion, ...this.regions];
                        this.totalCount++;
                        this.isLoading = false;
                        this.toastService.show(response.message || 'Regional Təhsil İdarəsi uğurla yaradıldı', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.toastService.show(error.error.message, 'error');
                    }
                });
            }
        });
    }

    loadRegions(): void {
        this.isLoading = true;
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        }
        this.regionService.getRegions(params)
            .subscribe({
                next: (response: RegionResponse) => {
                    const paginatedData = ResponseHandlerUtil.extractPaginatedData<Region>(response);
                    this.regions = paginatedData.data;
                    this.totalCount = paginatedData.totalCount;
                    this.isLoading = false;
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching regions: ${err.message}`;
                }
            });
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadRegions();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.loadRegions();
    }

    /** Единственная навигация со строки (PROFILES_V2_TASK.md §3.1) — редактирование, удаление
     *  и просмотр района/школ/учителей теперь живут на самом профиле. */
    onRegionProfile(region: Region): void {
        this.router.navigate(['/regions', region.id, 'profile']);
    }
}
