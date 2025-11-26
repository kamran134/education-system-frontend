import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Plus, RefreshCw, ArrowLeft } from 'lucide-angular';
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

export interface BackButton {
  show: boolean;
  action: () => void;
}

@Component({
  selector: 'app-list-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ButtonComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <nav class="mb-6 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            routerLink="/"
          >
            <lucide-icon [img]="Home" class="h-4 w-4"></lucide-icon>
            <span>Baş səhifə</span>
          </button>
          
          <!-- Back Button -->
          <button
            *ngIf="backButton && backButton.show"
            type="button"
            class="inline-flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            (click)="backButton.action()"
          >
            <lucide-icon [img]="ArrowLeft" class="h-4 w-4"></lucide-icon>
            <span>Geri</span>
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
        <div *ngIf="isLoading" class="flex items-center justify-center py-24">
          <div class="relative">
            <!-- Outer Ring -->
            <div class="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <!-- Spinning Ring -->
            <div class="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary-600 border-r-primary-600 animate-spin"></div>
            <!-- Center Dot -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div class="w-3 h-3 rounded-full bg-primary-600 animate-pulse"></div>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-lg font-medium text-gray-900">{{ loadingText || 'Yüklənir...' }}</p>
            <p class="text-sm text-gray-500 mt-1">Zəhmət olmasa gözləyin</p>
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
  @Input() backButton?: BackButton;
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
  readonly ArrowLeft = ArrowLeft;
}