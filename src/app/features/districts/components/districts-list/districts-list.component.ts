import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { DistrictService } from '../../services/district.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DistrictEditingDialogComponent } from '../district-editing-dialog/district-editing-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2 } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
    selector: 'app-districts-list',
    standalone: true,
    imports: [
        CommonModule, 
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
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Rayon / şəhər kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Adı', sortable: true, type: 'text' },
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
    
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }

    isUpdatingStats = false;
    onUpdateDistrictsStats(): void {
        this.isUpdatingStats = true;
        this.setupActionButtons(); // Обновляем кнопки с loading состоянием
        
        this.districtService.updateDistrictsStats().subscribe({
            next: (response: any) => {
                this.isUpdatingStats = false;
                this.setupActionButtons(); // Обновляем кнопки без loading
                this.snackBar.open('Statistika uğurla yeniləndi', 'OK', this.matSnackConfig);
                this.loadDistricts();
            },
            error: (error) => {
                this.isUpdatingStats = false;
                this.setupActionButtons(); // Обновляем кнопки без loading
                this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }

    constructor(
        private dialog: MatDialog,
        private authService: AuthService,
        private districtService: DistrictService,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        
        // Restore state from query parameters if coming back
        this.route.queryParams.subscribe(params => {
            if (params['districtPage'] !== undefined) {
                this.pageIndex = parseInt(params['districtPage']) || 0;
            }
            if (params['districtPageSize'] !== undefined) {
                this.pageSize = parseInt(params['districtPageSize']) || 100;
            }
        });
        
        this.loadDistricts();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];
        
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
        const dialogRef = this.dialog.open(DistrictEditingDialogComponent, {
          width: '400px',
          data: { 
            district: { name: '', code: '', studentCount: 0 },
            isEditing: false,
            canDelete: false
          },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.districtService.addDistrict(result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const newDistrict = ResponseHandlerUtil.extractData<District>(response);
                        // Добавляем новый район в начало списка
                        this.districts = [newDistrict, ...this.districts];
                        this.totalCount++;
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Rayon / şəhər uğurla yaradıldı', 'OK', this.matSnackConfig);
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
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
            sortColumn: 'name',
            sortDirection: 'asc'
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

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onDistrictEdit(event.item);
                break;
        }
    }

    onDistrictEdit(district: District): void {
        const dialogRef = this.dialog.open(DistrictEditingDialogComponent, {
            width: '400px',
            data: { 
                district: {
                    _id: district._id,
                    name: district.name, 
                    code: district.code, 
                    studentCount: district.studentCount
                },
                isEditing: true,
                canDelete: this.authService.canDeleteDistricts()
            },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleDistrictDelete(district);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.districtService.updateDistrict(district._id, result.data).subscribe({
                    next: (response: ResponseFromBackend) => {
                        const updatedDistrict = ResponseHandlerUtil.extractData<District>(response);
                        const index = this.districts.findIndex(d => d._id === district._id);
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.districts = [
                                ...this.districts.slice(0, index),
                                updatedDistrict,
                                ...this.districts.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.snackBar.open(response.message || 'Rayon / şəhər uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error: any) => {
                        this.isLoading = false;
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    private handleDistrictDelete(district: District): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Rayonu / şəhəri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.isLoading = true;
                this.districtService.deleteDistrict(district._id).subscribe({
                    next: (data) => {
                        // Удаляем район из списка без перезагрузки
                        this.districts = this.districts.filter(d => d._id !== district._id);
                        this.totalCount--;
                        this.isLoading = false;
                        this.snackBar.open('Rayon / şəhər uğurla silindi', 'Bağla', this.matSnackConfig);
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

    onDistrictView(district: District): void {
        // Save current state in query parameters for back navigation
        const queryParams = {
            districtPage: this.pageIndex,
            districtPageSize: this.pageSize
        };
        this.router.navigate(['/districts', district._id, 'schools'], { 
            queryParams 
        });
    }
}
