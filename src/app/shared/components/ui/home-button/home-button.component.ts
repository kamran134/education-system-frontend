import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';

@Component({
    selector: 'app-home-button',
    imports: [RouterModule, LucideAngularModule],
    template: `
    <button
      type="button"
      class="inline-flex items-center space-x-2 rounded-lg bg-white px-4 py-2 text-sm font-medium
             text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none
             focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
      routerLink="/panel">
      <lucide-icon [img]="Home" class="h-4 w-4"></lucide-icon>
      <span>Kabinetim</span>
    </button>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeButtonComponent { readonly Home = Home; }
