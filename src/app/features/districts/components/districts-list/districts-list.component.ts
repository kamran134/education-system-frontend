import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { DistrictService } from '../../services/district.service';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { DistrictAddDialogComponent } from '../district-add-dialog/district-add-dialog.component';
import { ResponseFromBackend } from '../../../../core/models/response.model';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

@Component({
    selector: 'app-districts-list',
    standalone: true,
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatInputModule, MatTableModule, MatSnackBarModule, MatProgressSpinnerModule, MatPaginatorModule],
    templateUrl: './districts-list.component.html',
    styleUrls: ['./districts-list.component.scss']
})
export class DistrictsListComponent implements OnInit {
    districts: District[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';
    data: any;
    
    // Pagination properties
    totalCount = 0;
    pageSize = 100;
    pageIndex = 0;
    pageSizeOptions = [25, 50, 100, 200];
    
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }

    isUpdatingStats = false;
    onUpdateDistrictsStats(): void {
        this.isUpdatingStats = true;
        this.districtService.updateDistrictsStats().subscribe({
            next: (response: any) => {
                this.isUpdatingStats = false;
                this.snackBar.open('Statistika uğurla yeniləndi', 'OK', this.matSnackConfig);
                this.loadDistricts();
            },
            error: (error) => {
                this.isUpdatingStats = false;
                this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }

    constructor(
        private dialog: MatDialog,
        private authService: AuthService,
        private districtService: DistrictService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadDistricts();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    openAddDistrictDialog(): void {
        const dialogRef = this.dialog.open(DistrictAddDialogComponent, {
          width: '400px',
          data: { name: '', code: '' },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.districtService.addDistrict(result).subscribe({
                    next: (response: ResponseFromBackend) => {
                        this.isLoading = false;
                        this.snackBar.open(response.message || '', 'OK', this.matSnackConfig);
                        this.loadDistricts();
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

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadDistricts();
    }

    onDistrictDelete(event: Event, district: District): void {
        event.stopPropagation();
        
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Rayonu / şəhəri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.districtService.deleteDistrict(district._id).subscribe({
                    next: (data) => {
                        this.loadDistricts();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }
}
