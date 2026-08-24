import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    ViewChildren,
    ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

export interface TabItem {
    label: string;
    /** Иконка lucide; в мобильном селекте не отображается — там только текст. */
    icon?: any;
}

/**
 * Общая полоска вкладок. На `< sm` подменяется нативным `<select>` (mobileVariant: 'select',
 * по умолчанию) — единственный способ показать 4-8 длинных азербайджанских подписей без
 * переполнения страницы вбок. Для страниц с 2-3 короткими подписями есть mobileVariant: 'scroll' —
 * полоска остаётся полоской и просто прокручивается сама, вместо страницы.
 *
 * Компонент сам рисует обёртку `<div class="border-b border-gray-200">` — на местах вызова эта
 * обёртка убирается, чтобы все полоски выглядели одинаково.
 */
@Component({
    selector: 'app-tabs',
    imports: [FormsModule, LucideAngularModule],
    template: `
    @if (mobileVariant === 'select') {
      <div class="sm:hidden border-b border-gray-200 px-4 py-3">
        <select
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium
                 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Bölmə seçin"
          [ngModel]="selectedIndex"
          (ngModelChange)="select($event)">
          @for (tab of tabs; track tab.label; let i = $index) {
            <option [ngValue]="i">{{ tab.label }}</option>
          }
        </select>
      </div>
    }

    <div [class]="mobileVariant === 'select' ? 'hidden sm:block border-b border-gray-200' : 'border-b border-gray-200'">
      <nav
        #strip
        class="tab-strip -mb-px flex flex-nowrap overflow-x-auto gap-4 sm:gap-8 px-4 sm:px-6"
        role="tablist"
        aria-label="Tabs">
        @for (tab of tabs; track tab.label; let i = $index) {
          <button
            #tabBtn
            type="button"
            role="tab"
            [attr.aria-selected]="i === selectedIndex"
            [class]="tabClasses(i)"
            (click)="select(i)"
            (keydown)="onKeydown($event, i)">
            @if (tab.icon) {
              <lucide-icon [img]="tab.icon" class="w-5 h-5"></lucide-icon>
            }
            <span>{{ tab.label }}</span>
          </button>
        }
      </nav>
    </div>
  `,
    styles: [`
    /* Полоса прокрутки табов тонкая и ненавязчивая, но НЕ скрытая: на десктопе колесо мыши
       по горизонтали не крутит, и без видимого индикатора уехавшие вкладки не найти. */
    .tab-strip { scrollbar-width: thin; }
    .tab-strip::-webkit-scrollbar { height: 6px; }
    .tab-strip::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, .5); border-radius: 3px; }
    .tab-strip::-webkit-scrollbar-track { background: transparent; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements OnChanges {
    @Input() tabs: TabItem[] = [];
    @Input() selectedIndex = 0;
    @Output() selectedIndexChange = new EventEmitter<number>();
    /**
     * Как ведёт себя полоска на экранах < sm:
     *  'select' (по умолчанию) — подменяется нативным <select>: много вкладок и/или длинные подписи;
     *  'scroll'                — остаётся полоской, просто прокручивается: 2-3 коротких подписи.
     */
    @Input() mobileVariant: 'select' | 'scroll' = 'select';

    @ViewChildren('tabBtn') private tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedIndex'] && !changes['selectedIndex'].firstChange) {
            this.scrollActiveIntoView();
        }
    }

    select(index: number): void {
        if (index === this.selectedIndex) return;
        this.selectedIndex = index;
        this.selectedIndexChange.emit(index);
        this.scrollActiveIntoView();
    }

    tabClasses(i: number): string {
        const base = 'inline-flex items-center gap-2 shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none cursor-pointer transition-colors';
        return i === this.selectedIndex
            ? `${base} border-primary-500 text-primary-600`
            : `${base} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
    }

    onKeydown(event: KeyboardEvent, index: number): void {
        let next = -1;
        if (event.key === 'ArrowLeft') {
            next = (index - 1 + this.tabs.length) % this.tabs.length;
        } else if (event.key === 'ArrowRight') {
            next = (index + 1) % this.tabs.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = this.tabs.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        this.select(next);
        setTimeout(() => this.tabButtons?.get(next)?.nativeElement.focus(), 0);
    }

    private scrollActiveIntoView(): void {
        setTimeout(() => {
            this.tabButtons?.get(this.selectedIndex)?.nativeElement.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth'
            });
        }, 0);
    }
}
