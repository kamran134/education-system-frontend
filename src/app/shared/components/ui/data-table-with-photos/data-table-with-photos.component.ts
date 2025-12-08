import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight, User } from 'lucide-angular';

export interface PhotoTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface PhotoTableAction {
    icon: any;
    label: string;
    onClick: (row: any) => void;
    condition?: (row: any) => boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}

@Component({
    selector: 'app-data-table-with-photos',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './data-table-with-photos.component.html',
    styleUrls: ['./data-table-with-photos.component.scss']
})
export class DataTableWithPhotosComponent {
    @Input() columns: PhotoTableColumn[] = [];
    @Input() data: any[] = [];
    @Input() actions: PhotoTableAction[] = [];
    @Input() showPagination: boolean = true;
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 20;
    @Input() currentPage: number = 1;
    @Input() sortColumn: string = '';
    @Input() sortDirection: 'asc' | 'desc' = 'asc';
    @Input() photoKey: string = 'avatarUrl'; // Ключ для URL фото
    @Input() nameKeys: string[] = ['lastName', 'firstName', 'middleName']; // Ключи для имени

    @Output() pageChanged = new EventEmitter<number>();
    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;
    readonly User = User;

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    get paginationPages(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    onSort(column: PhotoTableColumn): void {
        if (!column.sortable) return;

        const newDirection = this.sortColumn === column.key && this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortChanged.emit({ column: column.key, direction: newDirection });
    }

    onPageChange(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.pageChanged.emit(page);
    }

    getValue(row: any, key: string): any {
        return key.split('.').reduce((obj, k) => obj?.[k], row);
    }

    getName(row: any): string {
        return this.nameKeys.map(key => this.getValue(row, key)).filter(v => v).join(' ');
    }

    getPhotoUrl(row: any): string | null {
        return this.getValue(row, this.photoKey);
    }

    getVisibleActions(row: any): PhotoTableAction[] {
        return this.actions.filter(action => !action.condition || action.condition(row));
    }
}
