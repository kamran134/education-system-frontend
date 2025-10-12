import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { CardComponent } from '../card/card.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction {
  key: string;
  label: string;
  icon?: any;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  condition?: (item: any) => boolean;
}

export interface PaginationEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent, CardComponent],
  template: `
    <app-card class="overflow-hidden">
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                *ngFor="let column of columns"
                scope="col"
                [class]="getHeaderClass(column)"
                [style.width]="column.width"
              >
                <button
                  *ngIf="column.sortable"
                  type="button"
                  class="group inline-flex items-center space-x-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
                  (click)="onSort(column.key)"
                >
                  <span>{{ column.label }}</span>
                  <!-- Sort indicators can be added here -->
                </button>
                <span *ngIf="!column.sortable" class="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {{ column.label }}
                </span>
              </th>
              <th *ngIf="actions.length > 0" scope="col" class="relative px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let item of data; let i = index" class="hover:bg-gray-50 transition-colors cursor-pointer" (click)="onRowClick(item)">
              <td
                *ngFor="let column of columns"
                [class]="getCellClass(column)"
              >
                <div [ngSwitch]="column.type || 'text'">
                  <!-- Text -->
                  <span *ngSwitchCase="'text'" class="text-sm text-gray-900">
                    {{ getValue(item, column.key) }}
                  </span>
                  
                  <!-- Number -->
                  <span *ngSwitchCase="'number'" class="text-sm text-gray-900 font-mono">
                    {{ getValue(item, column.key) | number }}
                  </span>
                  
                  <!-- Date -->
                  <span *ngSwitchCase="'date'" class="text-sm text-gray-500">
                    {{ getValue(item, column.key) | date:'dd.MM.yyyy' }}
                  </span>
                  
                  <!-- Boolean -->
                  <span *ngSwitchCase="'boolean'" class="inline-flex items-center">
                    <span [class]="getValue(item, column.key) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                          class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                      {{ getValue(item, column.key) ? 'Bəli' : 'Xeyr' }}
                    </span>
                  </span>
                  
                  <!-- Custom -->
                  <ng-container *ngSwitchCase="'custom'">
                    <ng-content [select]="'[slot=column-' + column.key + ']'"></ng-content>
                  </ng-container>
                  
                  <!-- Default -->
                  <span *ngSwitchDefault class="text-sm text-gray-900">
                    {{ getValue(item, column.key) }}
                  </span>
                </div>
              </td>
              
              <!-- Actions -->
              <td *ngIf="actions.length > 0" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2" (click)="$event.stopPropagation()">
                  <app-button
                    *ngFor="let action of actions"
                    [variant]="action.variant || 'outline'"
                    size="sm"
                    [style.display]="shouldShowAction(action, item) ? 'inline-flex' : 'none'"
                    (clicked)="onAction(action.key, item)"
                  >
                    <div class="flex items-center space-x-1">
                      <lucide-icon *ngIf="action.icon" [img]="action.icon" class="h-3 w-3"></lucide-icon>
                      <span class="hidden sm:inline">{{ action.label }}</span>
                    </div>
                  </app-button>
                </div>
              </td>
            </tr>
            
            <!-- Empty State -->
            <tr *ngIf="!data || data.length === 0">
              <td [attr.colspan]="columns.length + (actions.length > 0 ? 1 : 0)" class="px-6 py-12 text-center">
                <div class="text-gray-500">
                  <p class="text-sm">Məlumat tapılmadı</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div *ngIf="totalCount > pageSize" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <p class="text-sm text-gray-700">
              <span class="font-medium">{{ getDisplayStart() }}</span>
              -
              <span class="font-medium">{{ getDisplayEnd() }}</span>
              arası,
              <span class="font-medium">{{ totalCount }}</span>
              nəticədən
            </p>
          </div>
          
          <div class="flex items-center space-x-2">
            <!-- First page -->
            <app-button
              variant="outline"
              size="sm"
              [disabled]="pageIndex === 0"
              (clicked)="goToPage(0)"
            >
              <lucide-icon [img]="ChevronsLeft" class="h-4 w-4"></lucide-icon>
            </app-button>
            
            <!-- Previous page -->
            <app-button
              variant="outline"
              size="sm"
              [disabled]="pageIndex === 0"
              (clicked)="goToPage(pageIndex - 1)"
            >
              <lucide-icon [img]="ChevronLeft" class="h-4 w-4"></lucide-icon>
            </app-button>
            
            <!-- Page numbers -->
            <span class="text-sm text-gray-700 px-2">
              {{ pageIndex + 1 }} / {{ getTotalPages() }}
            </span>
            
            <!-- Next page -->
            <app-button
              variant="outline"
              size="sm"
              [disabled]="pageIndex >= getTotalPages() - 1"
              (clicked)="goToPage(pageIndex + 1)"
            >
              <lucide-icon [img]="ChevronRight" class="h-4 w-4"></lucide-icon>
            </app-button>
            
            <!-- Last page -->
            <app-button
              variant="outline"
              size="sm"
              [disabled]="pageIndex >= getTotalPages() - 1"
              (clicked)="goToPage(getTotalPages() - 1)"
            >
              <lucide-icon [img]="ChevronsRight" class="h-4 w-4"></lucide-icon>
            </app-button>
          </div>
        </div>
      </div>
    </app-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() sortBy = '';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  @Output() actionClicked = new EventEmitter<{ action: string; item: any }>();
  @Output() pageChanged = new EventEmitter<PaginationEvent>();
  @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() rowClicked = new EventEmitter<any>();

  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ChevronsLeft = ChevronsLeft;
  readonly ChevronsRight = ChevronsRight;

  getHeaderClass(column: TableColumn): string {
    const baseClasses = 'px-6 py-3';
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return `${baseClasses} ${alignClasses[column.align || 'left']}`;
  }

  getCellClass(column: TableColumn): string {
    const baseClasses = 'px-6 py-4 whitespace-nowrap';
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return `${baseClasses} ${alignClasses[column.align || 'left']}`;
  }

  getValue(item: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], item);
  }

  shouldShowAction(action: TableAction, item: any): boolean {
    return action.condition ? action.condition(item) : true;
  }

  onAction(actionKey: string, item: any): void {
    this.actionClicked.emit({ action: actionKey, item });
  }

  onSort(column: string): void {
    const direction = this.sortBy === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortChanged.emit({ column, direction });
  }

  goToPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.getTotalPages()) {
      this.pageChanged.emit({
        pageIndex,
        pageSize: this.pageSize,
        length: this.totalCount
      });
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getDisplayStart(): number {
    return this.pageIndex * this.pageSize + 1;
  }

  getDisplayEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalCount);
  }

  onRowClick(item: any): void {
    this.rowClicked.emit(item);
  }
}