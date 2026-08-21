import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, Maximize2, Minimize2 } from 'lucide-angular';

/**
 * CSS-overlay fullscreen, not the native Fullscreen API — stays predictable alongside
 * existing modals/dropdowns and the app's own z-index convention (backdrop z-50,
 * dropdown overlay z-[90], dropdown panel z-[100]).
 */
@Component({
    selector: 'app-fullscreen-panel',
    imports: [LucideAngularModule],
    template: `
    <div [class]="expanded ? 'fixed inset-0 z-50 bg-white overflow-auto' : 'relative'">
      <div [class]="expanded ? 'p-4 sm:p-6 min-h-full' : ''">
        @if (showToggle || (expanded && title)) {
          <div class="flex items-center gap-3 mb-3" [class.justify-between]="expanded && title" [class.justify-end]="!(expanded && title)">
            @if (expanded && title) {
              <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
            }
            @if (showToggle) {
              <button
                type="button"
                (click)="toggle()"
                [attr.aria-label]="expanded ? 'Tam ekrandan çıx' : 'Tam ekran'"
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <lucide-icon [img]="expanded ? Minimize2 : Maximize2" class="h-4 w-4"></lucide-icon>
              </button>
            }
          </div>
        }
        <ng-content></ng-content>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenPanelComponent implements OnChanges, OnDestroy {
  @Input() expanded = false;
  @Input() title = '';
  /** Set false on panels nested inside another fullscreen-panel, so only one toggle button shows. */
  @Input() showToggle = true;
  @Output() expandedChange = new EventEmitter<boolean>();

  readonly Maximize2 = Maximize2;
  readonly Minimize2 = Minimize2;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.expanded) {
      this.setExpanded(false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expanded']) {
      this.syncBodyScrollLock(changes['expanded'].currentValue as boolean);
    }
  }

  ngOnDestroy(): void {
    this.syncBodyScrollLock(false);
  }

  toggle(): void {
    this.setExpanded(!this.expanded);
  }

  private setExpanded(value: boolean): void {
    this.expanded = value;
    this.expandedChange.emit(value);
  }

  private syncBodyScrollLock(isExpanded: boolean): void {
    document.body.classList.toggle('overflow-hidden', isExpanded);
  }
}
