import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Building2, Landmark, GraduationCap, Users, UserCheck, FileText, TrendingUp, ClipboardList, BarChart3, BookOpen, Loader } from 'lucide-angular';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { isOwnerRole } from '../../../../core/config/owner-roles.config';

/**
 * Роли, для которых домашняя страница — их собственный профиль (PROFILE_AS_HOME_TASK.md §2).
 * student сюда намеренно НЕ входит: его страница /students/:id пока в старом дизайне,
 * отправлять туда как домой — шаг назад, решение заказчика.
 */
const HOME_BY_ROLE: Record<string, (entityId: number) => any[]> = {
    teacher: (id) => ['/teachers', id, 'profile'],
    schoolDirector: (id) => ['/schools', id, 'profile'],
    districtRepresenter: (id) => ['/districts', id, 'profile'],
    regionRepresenter: (id) => ['/regions', id, 'profile'],
};

@Component({
    selector: 'app-home',
    imports: [RouterModule, LucideAngularModule, ProfileHeaderComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    readonly Building2 = Building2;
    readonly Landmark = Landmark;
    readonly GraduationCap = GraduationCap;
    readonly Users = Users;
    readonly UserCheck = UserCheck;
    readonly FileText = FileText;
    readonly ClipboardList = ClipboardList;
    readonly TrendingUp = TrendingUp;
    readonly BarChart3 = BarChart3;
    readonly BookOpen = BookOpen;
    readonly Loader = Loader;

    /** Пока true — рисуем спиннер, а не сетку: иначе карточки мелькнут перед переадресацией. */
    isResolving = true;

    private destroyRef = inject(DestroyRef);

    constructor(
        public permissions: PermissionsService,
        private authService: AuthService,
        private router: Router
    ) {}

    get hasProfileHeader(): boolean {
        return isOwnerRole(this.authService.getRole());
    }

    /**
     * /panel — «моя домашняя» для всех ролей: роли с привязанной сущностью отсюда уезжают на
     * свой профиль, остальные видят сетку разделов.
     *
     * Намеренно НЕ гвард. Гварды из одного canActivate: [...] подписываются одновременно, а не
     * последовательно (prioritizedGuardValue() собирает их через combineLatest — разбор в
     * AUTH_REDIRECT_FIX_TASK.md §B1; комментарий в role.guard.ts про обратное неверен). А
     * profile.entityId приходит ТОЛЬКО в ответе GET /auth/me, в localStorage его нет — гвард
     * на /panel читал бы undefined ровно тогда, когда authGuard ещё не дождался /me, то есть
     * на холодной загрузке и по F5. Здесь мы просто ждём данные, поэтому гонки нет.
     *
     * Своего запроса /me не делаем — подписываемся на уже существующий currentUser$: запросов
     * /me на загрузку и так 2-3 (AUTH_REDIRECT_FIX_TASK.md §B5), добавлять четвёртый незачем.
     */
    ngOnInit(): void {
        this.authService.currentUser$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((user) => {
                if (!user) return; // ещё грузится — authGuard догрузит и эмитнет сюда

                const buildHome = HOME_BY_ROLE[user.role];
                const entityId = user.profile?.entityId;

                if (buildHome && entityId != null) {
                    // replaceUrl: /panel не оседает в истории, «назад» браузера не зацикливается.
                    this.router.navigate(buildHome(entityId), { replaceUrl: true });
                    return;
                }

                // Либо роль без своей сущности (админ/модератор/ученик), либо учётка роли с
                // сущностью, но без привязки (entityId == null — в проде такие есть, например
                // учителя без записи в teachers). И то и другое → обычная сетка разделов,
                // а не вечный спиннер.
                this.isResolving = false;
            });
    }
}
