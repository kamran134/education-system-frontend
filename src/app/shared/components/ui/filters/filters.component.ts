import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Filter } from 'lucide-angular';

export interface FilterOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'text' | 'date-range';
  options?: FilterOption[];
  placeholder?: string;
  multiple?: boolean;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      <!-- Filter Header -->
      <div class="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <lucide-icon [img]="Filter" class="h-4 w-4"></lucide-icon>
        <span>Filtrlər</span>
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div *ngFor="let filter of filters" class="space-y-1">
          <!-- Select -->
          <div *ngIf="filter.type === 'select'" class="space-y-1">
            <label [for]="filter.key" class="block text-sm font-medium text-gray-700">
              {{ filter.label }}
            </label>
            <select
              [id]="filter.key"
              [value]="getFilterValue(filter.key)"
              (change)="onFilterChange(filter.key, $event)"
              class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">{{ filter.placeholder || 'Seçin...' }}</option>
              <option *ngFor="let option of filter.options" [value]="option.value" [disabled]="option.disabled">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Multi-Select -->
          <div *ngIf="filter.type === 'multi-select'" class="space-y-1">
            <label [for]="filter.key" class="block text-sm font-medium text-gray-700">
              {{ filter.label }}
            </label>
            <select
              [id]="filter.key"
              [value]="getFilterValue(filter.key)"
              (change)="onMultiSelectChange(filter.key, $event)"
              multiple
              class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[100px]"
            >
              <option *ngFor="let option of filter.options" [value]="option.value" [disabled]="option.disabled">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Text -->
          <div *ngIf="filter.type === 'text'" class="space-y-1">
            <label [for]="filter.key" class="block text-sm font-medium text-gray-700">
              {{ filter.label }}
            </label>
            <input
              [id]="filter.key"
              type="text"
              [value]="getFilterValue(filter.key)"
              [placeholder]="filter.placeholder || 'Axtarış...'"
              (input)="onFilterChange(filter.key, $event)"
              class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Active Filters Display -->
      <div *ngIf="hasActiveFilters()" class="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
        <span class="text-sm text-gray-500">Aktiv filtrlər:</span>
        <div *ngFor="let filter of getActiveFilters()" 
             class="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
          <span>{{ filter.label }}: {{ filter.displayValue }}</span>
          <button
            type="button"
            class="ml-2 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500"
            (click)="clearFilter(filter.key)"
          >
            <span class="sr-only">Remove filter</span>
            <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m1 1 6 6m0-6L1 7" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="text-xs text-gray-500 hover:text-gray-700 underline"
          (click)="clearAllFilters()"
        >
          Hamısını təmizlə
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent {
  @Input() filters: FilterConfig[] = [];
  @Input() values: Record<string, any> = {};

  @Output() filtersChanged = new EventEmitter<Record<string, any>>();

  readonly Filter = Filter;

  getFilterValue(key: string): any {
    return this.values[key] || '';
  }

  onFilterChange(key: string, event: any): void {
    const value = event.target.value;
    const newValues = { ...this.values };
    
    if (value === '' || value === null || value === undefined) {
      delete newValues[key];
    } else {
      newValues[key] = value;
    }
    
    this.filtersChanged.emit(newValues);
  }

  onMultiSelectChange(key: string, event: any): void {
    const selectedOptions = Array.from(event.target.selectedOptions, (option: any) => option.value);
    const newValues = { ...this.values };
    
    if (selectedOptions.length === 0) {
      delete newValues[key];
    } else {
      newValues[key] = selectedOptions;
    }
    
    this.filtersChanged.emit(newValues);
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.values).length > 0;
  }

  getActiveFilters(): Array<{ key: string; label: string; displayValue: string }> {
    return Object.entries(this.values).map(([key, value]) => {
      const filter = this.filters.find(f => f.key === key);
      const label = filter?.label || key;
      
      let displayValue = '';
      if (Array.isArray(value)) {
        if (filter?.options) {
          displayValue = value.map(v => filter.options?.find(o => o.value === v)?.label || v).join(', ');
        } else {
          displayValue = value.join(', ');
        }
      } else {
        if (filter?.options) {
          displayValue = filter.options.find(o => o.value === value)?.label || value;
        } else {
          displayValue = value?.toString() || '';
        }
      }
      
      return { key, label, displayValue };
    });
  }

  clearFilter(key: string): void {
    const newValues = { ...this.values };
    delete newValues[key];
    this.filtersChanged.emit(newValues);
  }

  clearAllFilters(): void {
    this.filtersChanged.emit({});
  }
}