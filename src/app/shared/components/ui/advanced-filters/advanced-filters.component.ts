import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Filter, RotateCcw, Search } from 'lucide-angular';
import { SelectComponent, SelectOption } from '../form-controls/select/select.component';
import { InputComponent } from '../form-controls/input/input.component';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'text' | 'number' | 'search';
  options?: SelectOption[];
  placeholder?: string;
  defaultValue?: any;
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
  searchable?: boolean;
  clearable?: boolean;
  dependsOn?: string; // For cascading filters
}

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule, 
    SelectComponent, 
    InputComponent
  ],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <!-- Filter Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <lucide-icon [img]="Filter" class="h-4 w-4 text-gray-600"></lucide-icon>
          <h3 class="text-sm font-medium text-gray-900">Filtrlər</h3>
          <span *ngIf="activeFilterCount > 0" 
                class="inline-flex items-center rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800">
            {{ activeFilterCount }}
          </span>
        </div>

        <!-- Reset Filters -->
        <button
          *ngIf="activeFilterCount > 0"
          type="button"
          (click)="resetFilters()"
          class="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <lucide-icon [img]="RotateCcw" class="h-3 w-3"></lucide-icon>
          <span>Təmizlə</span>
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 gap-4" [class]="gridClasses">
        <div *ngFor="let filter of filters; trackBy: trackByKey" [class]="getFilterWidth(filter)">
          
          <!-- Select Filter -->
          <app-select
            *ngIf="filter.type === 'select'"
            [label]="filter.label"
            [placeholder]="filter.placeholder || ''"
            [options]="getFilterOptions(filter)"
            [searchable]="filter.searchable || false"
            [clearable]="filter.clearable !== false"
            [ngModel]="filterValues[filter.key]"
            (selectionChange)="onFilterChange(filter.key, $event)"
          ></app-select>

          <!-- Multi-Select Filter -->
          <app-select
            *ngIf="filter.type === 'multi-select'"
            [label]="filter.label"
            [placeholder]="filter.placeholder || ''"
            [options]="getFilterOptions(filter)"
            [multiple]="true"
            [searchable]="filter.searchable !== false"
            [clearable]="filter.clearable !== false"
            [ngModel]="filterValues[filter.key] || []"
            (selectionChange)="onFilterChange(filter.key, $event)"
          ></app-select>

          <!-- Text/Search Filter -->
          <app-input
            *ngIf="filter.type === 'text' || filter.type === 'search'"
            [label]="filter.label"
            [placeholder]="filter.placeholder || 'Axtarış...'"
            [type]="filter.type === 'search' ? 'search' : 'text'"
            [leftIcon]="filter.type === 'search' ? Search : null"
            [clearable]="filter.clearable !== false"
            [ngModel]="filterValues[filter.key]"
            (valueChange)="onFilterChange(filter.key, $event)"
            (enterPressed)="onSearchEnter(filter.key)"
          ></app-input>

          <!-- Number Filter -->
          <app-input
            *ngIf="filter.type === 'number'"
            [label]="filter.label"
            [placeholder]="filter.placeholder || ''"
            type="number"
            [clearable]="filter.clearable !== false"
            [ngModel]="filterValues[filter.key]"
            (valueChange)="onFilterChange(filter.key, $event)"
          ></app-input>

        </div>
      </div>

      <!-- Active Filters Summary -->
      <div *ngIf="activeFilterCount > 0" class="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <span class="text-xs font-medium text-gray-500">Aktiv filtrlər:</span>
        <div *ngFor="let activeFilter of getActiveFilters()" 
             class="inline-flex items-center rounded-full bg-primary-50 border border-primary-200 px-2 py-1 text-xs">
          <span class="text-primary-700">
            <span class="font-medium">{{ activeFilter.label }}:</span>
            <span class="ml-1">{{ activeFilter.displayValue }}</span>
          </span>
          <button
            type="button"
            class="ml-2 inline-flex h-3 w-3 items-center justify-center rounded-full text-primary-400 hover:text-primary-600 hover:bg-primary-100"
            (click)="clearFilter(activeFilter.key)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdvancedFiltersComponent implements OnInit, OnChanges {
  @Input() filters: FilterField[] = [];
  @Input() initialValues: Record<string, any> = {};
  @Input() columns: number = 4; // Default grid columns
  @Input() responsive: boolean = true;

  @Output() filtersChange = new EventEmitter<Record<string, any>>();
  @Output() filterChange = new EventEmitter<{key: string, value: any, allValues: Record<string, any>}>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() searchEnter = new EventEmitter<{key: string, value: any}>();

  // Icons
  readonly Filter = Filter;
  readonly RotateCcw = RotateCcw;
  readonly Search = Search;

  // State
  filterValues: Record<string, any> = {};
  private initialFilterValues: Record<string, any> = {};

  ngOnInit(): void {
    this.initializeFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValues'] || changes['filters']) {
      this.initializeFilters();
    }
  }

  get activeFilterCount(): number {
    return Object.keys(this.filterValues).filter(key => {
      const value = this.filterValues[key];
      return this.hasValue(value);
    }).length;
  }

  get gridClasses(): string {
    if (!this.responsive) {
      return `grid-cols-${Math.min(this.columns, this.filters.length)}`;
    }

    // Responsive grid classes
    return `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(this.columns, 4)}`;
  }

  private initializeFilters(): void {
    this.filterValues = { ...this.initialValues };
    this.initialFilterValues = { ...this.initialValues };

    // Set default values for filters
    this.filters.forEach(filter => {
      if (filter.defaultValue !== undefined && this.filterValues[filter.key] === undefined) {
        this.filterValues[filter.key] = filter.defaultValue;
      }
    });
  }

  onFilterChange(key: string, value: any): void {
    this.filterValues[key] = value;

    // Handle dependent filters
    this.handleDependentFilters(key);

    // Emit events
    this.filterChange.emit({
      key,
      value,
      allValues: { ...this.filterValues }
    });

    this.filtersChange.emit({ ...this.filterValues });
  }

  onSearchEnter(key: string): void {
    const value = this.filterValues[key];
    this.searchEnter.emit({ key, value });
  }

  clearFilter(key: string): void {
    const filter = this.filters.find(f => f.key === key);
    if (filter) {
      if (filter.type === 'multi-select') {
        this.filterValues[key] = [];
      } else {
        delete this.filterValues[key];
      }

      // Handle dependent filters
      this.handleDependentFilters(key);

      this.filtersChange.emit({ ...this.filterValues });
    }
  }

  resetFilters(): void {
    this.filterValues = { ...this.initialFilterValues };

    // Reset to default values
    this.filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        this.filterValues[filter.key] = filter.defaultValue;
      }
    });

    this.filtersChange.emit({ ...this.filterValues });
    this.filtersReset.emit();
  }

  getFilterOptions(filter: FilterField): SelectOption[] {
    // Handle dependent filters
    if (filter.dependsOn) {
      const parentValue = this.filterValues[filter.dependsOn];
      if (!this.hasValue(parentValue)) {
        return [];
      }
    }

    return filter.options || [];
  }

  getFilterWidth(filter: FilterField): string {
    switch (filter.width) {
      case 'sm': return 'col-span-1 max-w-48';
      case 'md': return 'col-span-1 max-w-64';
      case 'lg': return 'col-span-2';
      case 'full': return 'col-span-full';
      default: return 'col-span-1';
    }
  }

  getActiveFilters(): Array<{key: string, label: string, displayValue: string}> {
    return Object.keys(this.filterValues)
      .filter(key => this.hasValue(this.filterValues[key]))
      .map(key => {
        const filter = this.filters.find(f => f.key === key);
        const value = this.filterValues[key];
        
        return {
          key,
          label: filter?.label || key,
          displayValue: this.getDisplayValue(filter!, value)
        };
      });
  }

  private getDisplayValue(filter: FilterField, value: any): string {
    if (!this.hasValue(value)) return '';

    if (filter.type === 'multi-select' && Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) {
        const option = filter.options?.find(opt => opt.value === value[0]);
        return option?.label || value[0];
      }
      return `${value.length} seçildi`;
    }

    if (filter.type === 'select') {
      const option = filter.options?.find(opt => opt.value === value);
      return option?.label || value;
    }

    return value.toString();
  }

  private handleDependentFilters(changedKey: string): void {
    // Clear dependent filters when parent changes
    const dependentFilters = this.filters.filter(f => f.dependsOn === changedKey);
    dependentFilters.forEach(filter => {
      if (filter.type === 'multi-select') {
        this.filterValues[filter.key] = [];
      } else {
        delete this.filterValues[filter.key];
      }
    });
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  trackByKey(index: number, filter: FilterField): string {
    return filter.key;
  }
}