import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, RefreshCw, ArrowLeft } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { CardComponent } from '../card/card.component';
import { HomeButtonComponent } from '../home-button/home-button.component';

export interface ActionButton {
  label: string;
  icon?: any;
  action: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  showOnHover?: boolean;
}

export interface BackButton {
  show: boolean;
  action: () => void;
}

@Component({
    selector: 'app-list-layout',
    imports: [CommonModule, RouterModule, LucideAngularModule, ButtonComponent, CardComponent, HomeButtonComponent],
    templateUrl: './list-layout.component.html',
    styleUrls: ['./list-layout.component.scss'],
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
    this._actionButtons = buttons;
  }
  get actionButtons(): ActionButton[] {
    return this._actionButtons;
  }
  private _actionButtons: ActionButton[] = [];

  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly ArrowLeft = ArrowLeft;
}