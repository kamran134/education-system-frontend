import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-save-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <button 
      mat-raised-button 
      [color]="color"
      [disabled]="disabled || loading"
      [class]="'save-button ' + size + (loading ? ' loading' : '') + (success ? ' success' : '') + (error ? ' error' : '')"
      [matTooltip]="tooltip"
      (click)="onClick()"
      type="button">
      
      <div class="button-content">
        <mat-spinner 
          *ngIf="loading" 
          [diameter]="size === 'small' ? 16 : size === 'large' ? 24 : 20"
          color="accent">
        </mat-spinner>
        
        <mat-icon 
          *ngIf="!loading && icon" 
          [class.success-icon]="success"
          [class.error-icon]="error">
          {{ getIcon() }}
        </mat-icon>
        
        <span class="button-text" *ngIf="!hideText">{{ getText() }}</span>
      </div>
    </button>
  `,
  styleUrls: ['./save-button.component.scss']
})
export class SaveButtonComponent {
  @Input() loading: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() disabled: boolean = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() text: string = 'Yadda saxla';
  @Input() loadingText: string = 'Saxlanır...';
  @Input() successText: string = 'Saxlanıldı!';
  @Input() errorText: string = 'Xəta baş verdi';
  @Input() icon: string = 'save';
  @Input() hideText: boolean = false;
  @Input() tooltip: string = '';

  @Output() save = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.save.emit();
    }
  }

  getIcon(): string {
    if (this.success) return 'check';
    if (this.error) return 'error';
    return this.icon;
  }

  getText(): string {
    if (this.loading) return this.loadingText;
    if (this.success) return this.successText;
    if (this.error) return this.errorText;
    return this.text;
  }
}
