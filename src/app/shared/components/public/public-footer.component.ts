import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Финальный призыв + подвал публичных страниц — один сплошной тёмный блок.
 * Вынесен из landing.component.html вместе с шапкой (см. PublicHeaderComponent).
 */
@Component({
    selector: 'app-public-footer',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './public-footer.component.html',
    styleUrl: './public-footer.component.scss',
})
export class PublicFooterComponent {
    private authService = inject(AuthService);

    get isAuthorized(): boolean {
        return this.authService.isAuthorized;
    }
}
