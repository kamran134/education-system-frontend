import { Component, OnInit } from '@angular/core';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { SchoolService } from '../../services/school.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2 } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { FiltersComponent, FilterConfig } from '../../../../shared/components/ui/filters/filters.component';

@Component({
    selector: 'app-schools-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent,
        FiltersComponent
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
    pageSize = 100;
    pageIndex = 0;
    
    // Filters
    selectedDistrictIds: string[] = [];
    filterConfig: FilterConfig[] = [];
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Məktəb kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'Məktəb adı', sortable: true, type: 'text' },
        { key: 'district.name', label: 'Rayon / şəhər', sortable: true, type: 'text' }
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
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        this.loadDistricts();
        this.loadSchools();
    }
    
    private setupActionButtons(): void {
        this.actionButtons = [];
        
        if (this.isAdminOrSuperAdmin()) {
            this.actionButtons.push(
                {
                    label: 'Məktəb əlavə et',
                    icon: this.Plus,
                    action: () => this.openAddSchoolDialog(),
                    variant: 'primary'
                },
                {
                    label: 'Statistikanı yenilə',
                    icon: this.RefreshCw,
                    action: () => this.onUpdateSchoolsStats(),
                    variant: 'secondary',
                    loading: this.isUpdatingStats,
                    disabled: this.isUpdatingStats
                }
            );
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
                this.districts = ResponseHandlerUtil.extractData<District[]>(response);
                this.setupFilters();
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
                label: 'Rayon / şəhər',
                options: this.districts.map(d => ({ value: d._id, label: d.name }))
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
          data: { school: null, isEditing: false },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.schoolService.createSchool(result).subscribe({
                    next: (response: ResponseFromBackend) => {
                        this.snackBar.open(response.message || 'Məktəb uğurla yaradıldı', 'OK', this.matSnackConfig);
                        this.loadSchools();
                    },
                    error: (error) => {
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
            districtIds: this.selectedDistrictIds.join(",")
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
            case 'delete':
                this.onSchoolDelete(new Event('click'), event.item);
                break;
        }
    }

    onSchoolEdit(school: School): void {
        const dialogRef = this.dialog.open(SchoolEditingDialogComponent, {
            width: '1000px',
            data: { school, isEditing: true }
        });

        dialogRef.afterClosed().subscribe((result: School) => {
            if (result) {
                this.schoolService.updateSchool(result).subscribe({
                    next: (response) => {
                        this.snackBar.open(response.message || 'Məktəb uğurla yeniləndi', 'Bağla', this.matSnackConfig);
                        this.loadSchools();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onSchoolDelete(event: Event, school: School): void {
        event.stopPropagation();
        
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

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadSchools();
    }
}
