import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, X } from 'lucide-angular';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <!-- Label -->
      <label *ngIf="label" [for]="id" class="block text-sm font-medium text-gray-700 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-red-500 ml-1">*</span>
      </label>

      <!-- Select Container -->
      <div class="relative">
        <!-- Single Select -->
        <div *ngIf="!multiple" 
             class="relative cursor-pointer" 
             (click)="toggleDropdown()"
             [class.ring-2]="isOpen"
             [class.ring-primary-500]="isOpen"
             [class.border-primary-500]="isOpen"
             [class.border-gray-300]="!isOpen && !error"
             [class.border-red-300]="error"
             class="block w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none transition-colors"
        >
          <div class="flex items-center justify-between">
            <span class="block truncate" [class.text-gray-500]="!selectedOption">
              {{ selectedOption?.label || placeholder || 'Seçin...' }}
            </span>
            <lucide-icon 
              [img]="ChevronDown" 
              class="h-4 w-4 text-gray-400 transition-transform duration-200"
              [class.rotate-180]="isOpen"
            ></lucide-icon>
          </div>
        </div>

        <!-- Multi Select -->
        <div *ngIf="multiple" 
             class="relative cursor-pointer min-h-[40px]"
             (click)="toggleDropdown()"
             [class.ring-2]="isOpen"
             [class.ring-primary-500]="isOpen"
             [class.border-primary-500]="isOpen"
             [class.border-gray-300]="!isOpen && !error"
             [class.border-red-300]="error"
             class="block w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none transition-colors"
        >
          <div class="flex items-center justify-between min-h-[24px]">
            <!-- Selected Options -->
            <div class="flex flex-wrap gap-1" *ngIf="selectedOptions.length > 0; else emptyState">
              <span *ngFor="let option of selectedOptions; trackBy: trackByValue" 
                    class="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                {{ option.label }}
                <button
                  type="button"
                  class="ml-1 inline-flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500"
                  (click)="removeOption($event, option.value)"
                >
                  <lucide-icon [img]="X" class="h-2 w-2"></lucide-icon>
                </button>
              </span>
            </div>
            <ng-template #emptyState>
              <span class="text-gray-500">{{ placeholder || 'Seçin...' }}</span>
            </ng-template>

            <lucide-icon 
              [img]="ChevronDown" 
              class="h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2"
              [class.rotate-180]="isOpen"
            ></lucide-icon>
          </div>
        </div>

        <!-- Dropdown -->
        <div *ngIf="isOpen" 
             class="absolute z-50 mt-1 w-full rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto">
          <div *ngIf="searchable" class="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Axtarış..."
              class="w-full text-sm border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
              (click)="$event.stopPropagation()"
            />
          </div>
          
          <div *ngIf="filteredOptions.length === 0" class="px-3 py-2 text-sm text-gray-500">
            Nəticə tapılmadı
          </div>
          
          <div *ngFor="let option of filteredOptions; trackBy: trackByValue"
               class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
               [class.bg-primary-50]="isSelected(option.value)"
               [class.text-primary-700]="isSelected(option.value)"
               [class.text-gray-400]="option.disabled"
               [class.cursor-not-allowed]="option.disabled"
               (click)="selectOption(option)"
          >
            <div class="flex items-center justify-between">
              <span>{{ option.label }}</span>
              <div *ngIf="multiple && isSelected(option.value)" class="text-primary-600">
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <p *ngIf="error && errorMessage" class="mt-1 text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <!-- Help Text -->
      <p *ngIf="helpText && !error" class="mt-1 text-sm text-gray-500">
        {{ helpText }}
      </p>
    </div>

    <!-- Overlay to close dropdown -->
    <div *ngIf="isOpen" 
         class="fixed inset-0 z-40" 
         (click)="closeDropdown()">
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() id: string = `select-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() options: SelectOption[] = [];
  @Input() multiple: boolean = false;
  @Input() searchable: boolean = false;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error: boolean = false;
  @Input() errorMessage: string = '';
  @Input() helpText: string = '';
  @Input() clearable: boolean = false;

  @Output() selectionChange = new EventEmitter<any>();

  // Icons
  readonly ChevronDown = ChevronDown;
  readonly X = X;

  // State
  isOpen = false;
  searchTerm = '';
  private value: any = null;
  
  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};

  get selectedOption(): SelectOption | null {
    if (this.multiple) return null;
    return this.options.find(opt => opt.value === this.value) || null;
  }

  get selectedOptions(): SelectOption[] {
    if (!this.multiple || !Array.isArray(this.value)) return [];
    return this.options.filter(opt => this.value.includes(opt.value));
  }

  get filteredOptions(): SelectOption[] {
    if (!this.searchTerm) return this.options;
    
    return this.options.filter(option => 
      option.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  ngOnInit(): void {
    // Initialize value for multiple select
    if (this.multiple && !this.value) {
      this.value = [];
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple) {
      const currentValues = Array.isArray(this.value) ? [...this.value] : [];
      const index = currentValues.indexOf(option.value);
      
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(option.value);
      }
      
      this.value = currentValues;
    } else {
      this.value = option.value;
      this.closeDropdown();
    }

    this.onChange(this.value);
    this.selectionChange.emit(this.value);
  }

  removeOption(event: Event, optionValue: any): void {
    event.stopPropagation();
    
    if (this.multiple && Array.isArray(this.value)) {
      const newValue = this.value.filter(val => val !== optionValue);
      this.value = newValue;
      this.onChange(this.value);
      this.selectionChange.emit(this.value);
    }
  }

  isSelected(optionValue: any): boolean {
    if (this.multiple) {
      return Array.isArray(this.value) && this.value.includes(optionValue);
    }
    return this.value === optionValue;
  }

  trackByValue(index: number, option: SelectOption): any {
    return option.value;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}