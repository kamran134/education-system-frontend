import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dropdown',
    imports: [CommonModule],
    template: `
    <div class="relative inline-block text-left">
      <!-- Trigger Button -->
      <button
        type="button"
        [class]="triggerClasses"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen"
        aria-haspopup="true"
      >
        <ng-content select="[slot=trigger]"></ng-content>
      </button>

      <!-- Dropdown Menu -->
      <div
        *ngIf="isOpen"
        [class]="menuClasses"
        role="menu"
        aria-orientation="vertical"
      >
        <div class="py-1" role="none">
          <ng-content select="[slot=content]"></ng-content>
        </div>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
  @Input() position: 'left' | 'right' = 'right';
  @Output() openChange = new EventEmitter<boolean>();
  
  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get triggerClasses(): string {
    return 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors';
  }

  get menuClasses(): string {
    const baseClasses = 'absolute z-10 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none';
    const positionClass = this.position === 'left' ? 'left-0' : 'right-0';
    return `${baseClasses} ${positionClass}`;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.openChange.emit(this.isOpen);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}

@Component({
    selector: 'app-dropdown-item',
    imports: [CommonModule],
    template: `
    <button
      type="button"
      class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      role="menuitem"
      (click)="handleClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownItemComponent {
  @Output() clicked = new EventEmitter<Event>();

  handleClick(event: Event): void {
    this.clicked.emit(event);
  }
}

@Component({
  selector: 'app-dropdown-divider',
  standalone: true,
  template: `<div class="border-t border-gray-100 my-1"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownDividerComponent {}