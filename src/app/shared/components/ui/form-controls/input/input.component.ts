import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { LucideAngularModule, Search, X, Eye, EyeOff } from 'lucide-angular';

@Component({
    selector: 'app-input',
    imports: [LucideAngularModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true
        }
    ],
    template: `
    <div class="space-y-1">
      <!-- Label -->
      @if (label) {
        <label [for]="id" class="block text-sm font-medium text-gray-700">
          {{ label }}
          @if (required) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }
    
      <!-- Input Container -->
      <div class="relative">
        <!-- Left Icon -->
        @if (leftIcon) {
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <lucide-icon [img]="leftIcon" class="h-4 w-4 text-gray-400"></lucide-icon>
          </div>
        }
    
        <!-- Input Field -->
        @if (multiline) {
          <textarea
            [id]="id"
            [rows]="rows"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [readonly]="readonly"
            [attr.maxlength]="maxLength"
            (input)="onInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
            [class]="inputClasses"
            >{{ value || '' }}</textarea>
        } @else {
          <input
            [id]="id"
            [type]="inputType"
            [value]="value || ''"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [readonly]="readonly"
            [min]="min"
            [max]="max"
            [step]="step"
            [attr.maxlength]="maxLength"
            [autocomplete]="autocomplete"
            (input)="onInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
            (keydown.enter)="onEnterPress()"
            [class]="inputClasses"
            />
        }

          <!-- Right Icon / Actions -->
          <div class="absolute inset-y-0 right-0 flex items-center">
            <!-- Clear Button -->
            @if (clearable && value && !disabled && !readonly) {
              <button
                type="button"
                class="px-2 text-gray-400 hover:text-gray-600"
                (click)="clear()"
                >
                <lucide-icon [img]="X" class="h-4 w-4"></lucide-icon>
              </button>
            }

            <!-- Password Toggle -->
            @if (type === 'password' && showPasswordToggle) {
              <button
                type="button"
                class="px-3 text-gray-400 hover:text-gray-600"
                (click)="togglePasswordVisibility()"
                >
                <lucide-icon [img]="showPassword ? EyeOff : Eye" class="h-4 w-4"></lucide-icon>
              </button>
            }

            <!-- Right Icon -->
            @if (rightIcon && type !== 'password') {
              <div class="px-3 pointer-events-none">
                <lucide-icon [img]="rightIcon" class="h-4 w-4 text-gray-400"></lucide-icon>
              </div>
            }
          </div>
        </div>
    
        <!-- Helper Text / Character Count -->
        <div class="flex items-center justify-between">
          <!-- Error Message -->
          @if (error && errorMessage) {
            <p class="text-sm text-red-600">
              {{ errorMessage }}
            </p>
          }
    
          <!-- Help Text -->
          @if (helpText && !error) {
            <p class="text-sm text-gray-500">
              {{ helpText }}
            </p>
          }
    
          <!-- Character Count -->
          @if (showCharacterCount && maxLength) {
            <div class="text-sm text-gray-500 ml-auto">
              {{ (value || '').length }}/{{ maxLength }}
            </div>
          }
        </div>
      </div>
    `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() id: string = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' = 'text';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() error: boolean = false;
  @Input() errorMessage: string = '';
  @Input() helpText: string = '';
  @Input() leftIcon: any = null;
  @Input() rightIcon: any = null;
  @Input() clearable: boolean = false;
  @Input() showCharacterCount: boolean = false;
  @Input() autocomplete: string = '';
  @Input() showPasswordToggle: boolean = true;

  // Textarea
  @Input() multiline: boolean = false;
  @Input() rows: number = 3;

  // Number/Range specific
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number | null = null;
  @Input() maxLength: number | null = null;

  @Output() valueChange = new EventEmitter<any>();
  @Output() enterPressed = new EventEmitter<void>();
  @Output() focused = new EventEmitter<void>();
  @Output() blurred = new EventEmitter<void>();

  // Icons
  readonly Search = Search;
  readonly X = X;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  // State
  showPassword = false;
  public value: any = '';

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};

  get inputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  get inputClasses(): string {
    const baseClasses = [
      'block w-full rounded-lg border bg-white text-sm placeholder-gray-500',
      'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
      'transition-colors duration-200'
    ];

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5',
      md: 'px-3 py-2',
      lg: 'px-4 py-3'
    };
    baseClasses.push(sizeClasses[this.size]);

    // Icon padding
    if (this.leftIcon) {
      baseClasses.push('pl-10');
    }
    if (this.rightIcon || this.clearable || this.type === 'password') {
      baseClasses.push('pr-10');
    }

    // State classes
    if (this.error) {
      baseClasses.push('border-red-300 focus:border-red-500 focus:ring-red-500');
    } else {
      baseClasses.push('border-gray-300');
    }

    if (this.disabled) {
      baseClasses.push('bg-gray-50 text-gray-500 cursor-not-allowed');
    }

    if (this.readonly) {
      baseClasses.push('bg-gray-50 cursor-default');
    }

    return baseClasses.join(' ');
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let newValue: any = target.value;

    // Handle number type
    if (this.type === 'number') {
      const numValue = target.valueAsNumber;
      newValue = isNaN(numValue) ? null : numValue;
    }

    this.value = newValue;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  onFocus(): void {
    this.focused.emit();
  }

  onEnterPress(): void {
    this.enterPressed.emit();
  }

  clear(): void {
    this.value = '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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