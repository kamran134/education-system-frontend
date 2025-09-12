import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SaveButtonComponent } from '../save-button/save-button.component';

@Component({
  selector: 'app-modern-dialog-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    SaveButtonComponent
  ],
  template: `
    <mat-divider></mat-divider>
    <div class="modern-dialog-actions" [class.full-width]="fullWidth">
      <div class="secondary-actions" *ngIf="showSecondaryActions">
        <ng-content select="[slot=secondary]"></ng-content>
      </div>
      
      <div class="primary-actions">
        <button 
          mat-stroked-button 
          class="cancel-button"
          [disabled]="loading"
          (click)="onCancel()">
          <mat-icon>close</mat-icon>
          {{ cancelText }}
        </button>
        
        <app-save-button
          [loading]="loading"
          [success]="success"
          [error]="error"
          [disabled]="disabled"
          [text]="saveText"
          [loadingText]="loadingText"
          [successText]="successText"
          [errorText]="errorText"
          [color]="saveColor"
          [size]="buttonSize"
          [icon]="saveIcon"
          [tooltip]="saveTooltip"
          (save)="onSave()">
        </app-save-button>
      </div>
    </div>
  `,
  styleUrls: ['./modern-dialog-actions.component.scss']
})
export class ModernDialogActionsComponent {
  @Input() loading: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() showSecondaryActions: boolean = false;
  
  @Input() cancelText: string = 'Ləğv et';
  @Input() saveText: string = 'Yadda saxla';
  @Input() loadingText: string = 'Saxlanır...';
  @Input() successText: string = 'Saxlanıldı!';
  @Input() errorText: string = 'Xəta baş verdi';
  @Input() saveColor: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() buttonSize: 'small' | 'medium' | 'large' = 'medium';
  @Input() saveIcon: string = 'save';
  @Input() saveTooltip: string = '';

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    this.save.emit();
  }
}
