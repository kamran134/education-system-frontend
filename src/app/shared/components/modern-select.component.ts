import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-modern-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modern-select-wrapper">
      <label class="modern-label">
        {{ label }}
        <span *ngIf="required" class="required-star">*</span>
      </label>
      
      <div class="select-container">
        <button
          type="button"
          (click)="toggleDropdown()"
          [disabled]="disabled"
          class="modern-select-button"
          [class.error]="error"
          [class.disabled]="disabled">
          
          <span class="select-text" [class.placeholder]="!selectedOption">
            {{ selectedOption?.label || placeholder }}
          </span>
          
          <span class="dropdown-arrow" [class.open]="isOpen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </span>
        </button>

        <div *ngIf="isOpen" class="dropdown-menu">
          <div *ngFor="let option of options; trackBy: trackByValue"
               (click)="selectOption(option)"
               class="dropdown-option"
               [class.selected]="option.value === value"
               [class.disabled]="option.disabled">
            <span>{{ option.label }}</span>
          </div>
          
          <div *ngIf="options.length === 0" class="no-options">
            Seçimlər tapılmadı
          </div>
        </div>
      </div>

      <div *ngIf="error" class="error-message">{{ error }}</div>
    </div>
  `,
  styles: [`
    .modern-select-wrapper {
      margin-bottom: 24px;
    }

    .modern-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .required-star {
      color: #ef4444;
      margin-left: 4px;
    }

    .select-container {
      position: relative;
    }

    .modern-select-button {
      width: 100%;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
    }

    .modern-select-button:hover:not(:disabled) {
      border-color: #9ca3af;
      transform: translateY(-1px);
    }

    .modern-select-button:focus {
      outline: none;
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }

    .modern-select-button.error {
      border-color: #ef4444;
    }

    .modern-select-button.disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .select-text {
      flex: 1;
      color: #374151;
    }

    .select-text.placeholder {
      color: #9ca3af;
    }

    .dropdown-arrow {
      color: #6b7280;
      transition: transform 0.3s ease;
    }

    .dropdown-arrow.open {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      margin-top: 4px;
      max-height: 200px;
      overflow-y: auto;
      animation: dropdownOpen 0.2s ease-out;
    }

    .dropdown-option {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      color: #374151;
    }

    .dropdown-option:hover:not(.disabled) {
      background: #f3f4f6;
    }

    .dropdown-option.selected {
      background: #ecfdf5;
      color: #065f46;
      font-weight: 600;
    }

    .dropdown-option.disabled {
      color: #9ca3af;
      cursor: not-allowed;
    }

    .dropdown-option:first-child {
      border-radius: 12px 12px 0 0;
    }

    .dropdown-option:last-child {
      border-radius: 0 0 12px 12px;
    }

    .no-options {
      padding: 16px;
      text-align: center;
      color: #9ca3af;
      font-style: italic;
    }

    .error-message {
      margin-top: 6px;
      font-size: 14px;
      color: #ef4444;
      animation: slideDown 0.3s ease;
    }

    @keyframes dropdownOpen {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Dark mode */
    body.dark-mode .modern-label {
      color: #d1d5db;
    }

    body.dark-mode .modern-select-button {
      background: #374151;
      border-color: #4b5563;
      color: white;
    }

    body.dark-mode .modern-select-button:focus {
      border-color: #14b8a6;
    }

    body.dark-mode .select-text {
      color: white;
    }

    body.dark-mode .select-text.placeholder {
      color: #9ca3af;
    }

    body.dark-mode .dropdown-menu {
      background: #374151;
      border-color: #4b5563;
    }

    body.dark-mode .dropdown-option {
      color: white;
    }

    body.dark-mode .dropdown-option:hover:not(.disabled) {
      background: #4b5563;
    }

    body.dark-mode .dropdown-option.selected {
      background: #065f46;
      color: #ecfdf5;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModernSelectComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None
})
export class ModernSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Seçin...';
  @Input() required = false;
  @Input() error = '';
  @Input() disabled = false;
  @Input() options: SelectOption[] = [];
  
  @Output() selectionChange = new EventEmitter<any>();

  value: any = null;
  isOpen = false;
  selectedOption: SelectOption | null = null;

  onChange = (value: any) => {};
  onTouched = () => {};

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;
    
    this.value = option.value;
    this.selectedOption = option;
    this.isOpen = false;
    this.onChange(this.value);
    this.onTouched();
    this.selectionChange.emit(this.value);
  }

  trackByValue(index: number, option: SelectOption) {
    return option.value;
  }

  writeValue(value: any): void {
    this.value = value;
    this.selectedOption = this.options.find(opt => opt.value === value) || null;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
