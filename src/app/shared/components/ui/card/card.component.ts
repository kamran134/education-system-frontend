import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-card',
    imports: [],
    template: `
    <div [class]="cardClasses">
      <ng-content></ng-content>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  @Input() border = true;

  get cardClasses(): string {
    const baseClasses = 'bg-white';
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6', 
      lg: 'p-8'
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };

    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl'
    };

    const borderClass = this.border ? 'border border-gray-200' : '';

    return `${baseClasses} ${paddingClasses[this.padding]} ${shadowClasses[this.shadow]} ${roundedClasses[this.rounded]} ${borderClass}`.trim();
  }
}

@Component({
    selector: 'app-card-header',
    imports: [],
    template: `
    <div class="flex items-center justify-between mb-4">
      <ng-content></ng-content>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardHeaderComponent {}

@Component({
    selector: 'app-card-title',
    imports: [],
    template: `
    <h3 class="text-lg font-semibold text-gray-900">
      <ng-content></ng-content>
    </h3>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTitleComponent {}

@Component({
    selector: 'app-card-content',
    imports: [],
    template: `
    <div class="text-gray-600">
      <ng-content></ng-content>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardContentComponent {}