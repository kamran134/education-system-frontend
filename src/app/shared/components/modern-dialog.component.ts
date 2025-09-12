import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modern-dialog-overlay" (click)="onClose()">
      <div class="modern-dialog-container" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modern-dialog-header">
          <div class="header-content">
            <span class="dialog-icon">{{ icon }}</span>
            <h2 class="dialog-title">{{ title }}</h2>
          </div>
          <button class="close-button" (click)="onClose()">
            <span>&times;</span>
          </button>
        </div>

        <!-- Content -->
        <div class="modern-dialog-content">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="modern-dialog-footer">
          <button class="cancel-button" (click)="onClose()">{{ cancelText }}</button>
          <button class="save-button" (click)="onSave()" [disabled]="saveDisabled">
            {{ saveText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modern-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.3s ease-out;
    }

    .modern-dialog-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .modern-dialog-header {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dialog-icon {
      font-size: 28px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .dialog-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .close-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 24px;
      color: white;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .modern-dialog-content {
      padding: 32px;
      overflow-y: auto;
      max-height: calc(90vh - 160px);
    }

    .modern-dialog-footer {
      padding: 24px 32px;
      background: #f8f9fa;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      border-top: 1px solid #e9ecef;
    }

    .cancel-button {
      background: transparent;
      border: 2px solid #6c757d;
      color: #6c757d;
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      background: #6c757d;
      color: white;
      transform: translateY(-2px);
    }

    .save-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(20, 184, 166, 0.4);
    }

    .save-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.6);
    }

    .save-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }

    /* Dark mode */
    body.dark-mode .modern-dialog-container {
      background: #1f2937;
      color: white;
    }

    body.dark-mode .modern-dialog-footer {
      background: #374151;
      border-color: #4b5563;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class ModernDialogComponent {
  @Input() title = '';
  @Input() icon = '🏢';
  @Input() cancelText = 'Ləğv et';
  @Input() saveText = 'Yadda saxla';
  @Input() saveDisabled = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onSave() {
    this.save.emit();
  }
}
