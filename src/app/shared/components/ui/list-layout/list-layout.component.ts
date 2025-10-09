import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Plus, RefreshCw } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { CardComponent } from '../card/card.component';

export interface ActionButton {
  label: string;
  icon?: any;
  action: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

@Component({
  selector: 'app-list-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ButtonComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <nav class="mb-6">
          <button
            type="button"
            class="inline-flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            routerLink="/"
          >
            <lucide-icon [img]="Home" class="h-4 w-4"></lucide-icon>
            <span>Baş səhifə</span>
          </button>
        </nav>

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
          <p *ngIf="description" class="mt-2 text-lg text-gray-600">{{ description }}</p>
        </div>

        <!-- Filters Section -->
        <app-card *ngIf="hasFilters" class="mb-6" padding="md">
          <ng-content select="[slot=filters]"></ng-content>
        </app-card>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="text-lg text-gray-600">{{ loadingText || 'Yüklənir...' }}</span>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="hasError && !isLoading" class="rounded-lg bg-red-50 p-4 mb-6">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Xəta</h3>
              <div class="mt-2 text-sm text-red-700">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div *ngIf="!isLoading && !hasError">
          <ng-content select="[slot=content]"></ng-content>
        </div>

        <!-- Actions Panel -->
        <div *ngIf="actionButtons && actionButtons.length > 0" class="mt-8 flex flex-wrap gap-3">
          <app-button
            *ngFor="let action of actionButtons"
            [variant]="action.variant || 'primary'"
            [disabled]="action.disabled || false"
            (clicked)="action.action()"
          >
            <div class="flex items-center space-x-2">
              <div *ngIf="action.loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <lucide-icon *ngIf="action.icon && !action.loading" [img]="action.icon" class="h-4 w-4"></lucide-icon>
              <span>{{ action.label }}</span>
            </div>
          </app-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListLayoutComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() loadingText = '';
  @Input() hasFilters = false;
  @Input() set actionButtons(buttons: ActionButton[]) {
    console.log('ListLayoutComponent received actionButtons:', buttons);
    this._actionButtons = buttons;
  }
  get actionButtons(): ActionButton[] {
    return this._actionButtons;
  }
  private _actionButtons: ActionButton[] = [];

  readonly Home = Home;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
}