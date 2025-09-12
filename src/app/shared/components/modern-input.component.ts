import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modern-input-wrapper">
      <label class="modern-label">
        {{ label }}
        <span *ngIf="required" class="required-star">*</span>
      </label>
      <div class="input-container">
        <input
          [type]="type"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          class="modern-input"
          [class.error]="error"
          [class.disabled]="disabled">
        
        <div *ngIf="icon" class="input-icon">{{ icon }}</div>
      </div>
      
      <div *ngIf="error" class="error-message">{{ error }}</div>
      <div *ngIf="hint && !error" class="hint-message">{{ hint }}</div>
    </div>
  `,
  styles: [`
    .modern-input-wrapper {
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

    .input-container {
      position: relative;
    }

    .modern-input {
      width: 100%;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: white;
      box-sizing: border-box;
    }

    .modern-input:focus {
      outline: none;
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      transform: translateY(-1px);
    }

    .modern-input:hover:not(:disabled) {
      border-color: #9ca3af;
      transform: translateY(-1px);
    }

    .modern-input.error {
      border-color: #ef4444;
    }

    .modern-input.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .modern-input:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .input-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: #9ca3af;
    }

    .error-message {
      margin-top: 6px;
      font-size: 14px;
      color: #ef4444;
      animation: slideDown 0.3s ease;
    }

    .hint-message {
      margin-top: 6px;
      font-size: 14px;
      color: #6b7280;
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

    body.dark-mode .modern-input {
      background: #374151;
      border-color: #4b5563;
      color: white;
    }

    body.dark-mode .modern-input:focus {
      border-color: #14b8a6;
    }

    body.dark-mode .modern-input:disabled {
      background: #1f2937;
      color: #6b7280;
    }

    body.dark-mode .hint-message {
      color: #9ca3af;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModernInputComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None
})
export class ModernInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() required = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() icon = '';
  @Input() disabled = false;

  value = '';
  
  onChange = (value: string) => {};
  onTouched = () => {};

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
