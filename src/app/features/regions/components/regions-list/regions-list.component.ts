import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Region, RegionResponse } from '../../../../core/models/region.model';
import { RegionService } from '../../services/region.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RegionEditingDialogComponent } from '../region-editing-dialog/region-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { LucideAngularModule, Plus, Edit } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
    selector: 'app-regions-list',
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent
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
    pageSize = 100;
    pageIndex = 0;

    sortColumn = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';

    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Regional idarə kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Adı', sortable: true, type: 'text' },
        { key: 'districtCount', label: 'Rayon sayı', sortable: false, type: 'number', align: 'center' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: false, type: 'number', align: 'center' }
    ];

    tableActions: TableAction[] = [
        {
            key: 'edit',
            label: 'Düzəliş et',
            icon: Edit,
            variant: 'primary',
            condition: () => this.authService.canEditRegions()
        }
    ];

    actionButtons: ActionButton[] = [];

    readonly Plus = Plus;
    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    private destroyRef = inject(DestroyRef);

    constructor(
        private dialog: MatDialog,
        private authService: AuthService,
        private regionService: RegionService,
        private snackBar: MatSnackBar,
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
                this.pageSize = parseInt(params['regionPageSize']) || 100;
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
        const dialogRef = this.dialog.open(RegionEditingDialogComponent, {
          width: '400px',
          data: {
            region: { name: '', code: '' },
            isEditing: false,
            canDelete: false
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.regionService.addRegion(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newRegion = ResponseHandlerUtil.extractData<Region>(response);
                        this.regions = [newRegion, ...this.regions];
                        this.totalCount++;
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Regional Təhsil İdarəsi uğurla yaradıldı', 'OK', this.matSnackConfig);
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
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

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onRegionEdit(event.item);
                break;
        }
    }

    onRegionEdit(region: Region): void {
        const dialogRef = this.dialog.open(RegionEditingDialogComponent, {
            width: '400px',
            data: {
                region: {
                    id: region.id,
                    name: region.name,
                    code: region.code
                },
                isEditing: true,
                canDelete: this.authService.canDeleteRegions()
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'delete') {
                this.handleRegionDelete(region);
            } else if (result?.action === 'save') {
                this.isLoading = true;
                this.regionService.updateRegion(region.id, result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const updatedRegion = ResponseHandlerUtil.extractData<Region>(response);
                        const index = this.regions.findIndex(r => IdUtil.equals(r.id, region.id));
                        if (index !== -1) {
                            this.regions = [
                                ...this.regions.slice(0, index),
                                updatedRegion,
                                ...this.regions.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Regional Təhsil İdarəsi uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error: any) => {
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    private handleRegionDelete(region: Region): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Regional Təhsil İdarəsini silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Bu idarəyə bağlı rayonlar silinmir, sadəcə idarə ilə əlaqələri kəsilir.'
            }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.isLoading = true;
                this.regionService.deleteRegion(region.id).subscribe({
                    next: () => {
                        this.regions = this.regions.filter(r => r.id !== region.id);
                        this.totalCount--;
                        this.isLoading = false;
                        this.snackBar.open('Regional Təhsil İdarəsi uğurla silindi', 'Bağla', this.matSnackConfig);
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

    onRegionView(region: Region): void {
        const queryParams = {
            regionPage: this.pageIndex,
            regionPageSize: this.pageSize
        };
        this.router.navigate(['/regions', region.id, 'districts'], {
            queryParams
        });
    }
}
