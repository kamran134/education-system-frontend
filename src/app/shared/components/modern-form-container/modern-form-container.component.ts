import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modern-form-container',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="modern-form-container" [class.has-error]="hasError">
      <div class="form-header" *ngIf="title || subtitle">
        <div class="header-content">
          <mat-icon *ngIf="icon" class="header-icon">{{ icon }}</mat-icon>
          <div class="header-text">
            <h2 class="form-title" *ngIf="title">{{ title }}</h2>
            <p class="form-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <mat-divider></mat-divider>
      </div>
      
      <div class="form-content">
        <ng-content></ng-content>
      </div>
      
      <div class="form-error" *ngIf="hasError && errorMessage">
        <mat-icon class="error-icon">error</mat-icon>
        <span class="error-text">{{ errorMessage }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./modern-form-container.component.scss']
})
export class ModernFormContainerComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';
}
