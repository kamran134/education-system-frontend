import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Loader } from 'lucide-angular';
import { DistrictService } from '../../services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ProfileHeroComponent, ProfileHeroChip, ProfileHeroSubtitlePart, ProfileHeroRank } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileFactsComponent, ProfileFact } from '../../../../shared/components/profile/profile-facts/profile-facts.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent, ProfileRatingScope } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';

const SCHOOLS_PAGE_SIZE = 12;

/**
 * Профиль района (PROFILES_TASK.md §7.3) — новая страница, раньше не существовала вообще
 * (ни маршрута, ни компонента, ни эндпоинта сохранения профиля). Без блока "Uğurları" —
 * в ТЗ заказчика для района такого поля нет, в отличие от учителя/школы.
 */
@Component({
    selector: 'app-district-profile',
    imports: [
        CommonModule, FormsModule, RouterModule, LucideAngularModule,
        ButtonComponent, InputComponent,
        ProfileHeroComponent, ProfileFactsComponent,
        ProfileStatsSectionComponent, ProfileRatingSectionComponent, EntityCardGridComponent,
    ],
    templateUrl: './district-profile.component.html',
    styleUrl: './district-profile.component.scss'
})
export class DistrictProfileComponent implements OnInit {
    districtId!: string;
    district: District | null = null;
    isLoading = true;

    schools: School[] = [];
    schoolsTotal = 0;
    schoolsLoading = true;
    schoolsLoadingMore = false;
    private schoolsPage = 1;

    editingFacts = false;
    editedEducationHeadName: string | null = null;
    isSavingFacts = false;
    factsSaveFailed = false;

    isUploadingAvatar = false;

    // Вычисляются явно, не через геттеры — см. подробный комментарий в
    // teacher-profile.component.ts. Геттер, возвращающий новый объект/массив на каждый вызов,
    // триггерит ngOnChanges у app-profile-stats-section на каждом цикле change detection и
    // превращается в бесконечный цикл HTTP-запросов (поймано при ручной QA).
    /**
     * Крошки массивом, а не условиями в шаблоне: «Panel» скрывается на своём профиле, регион
     * у района бывает не заполнен, и разделители при любом сочетании не должны ни удваиваться,
     * ни висеть в начале.
     */
    crumbs: { text: string; link?: any[] }[] = [];
    heroSubtitleParts: ProfileHeroSubtitlePart[] = [];
    heroChips: ProfileHeroChip[] = [];
    heroRank: ProfileHeroRank | null = null;
    facts: ProfileFact[] = [];
    ratingScopes: ProfileRatingScope[] = [];
    schoolCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;

    private destroyRef = inject(DestroyRef);

    constructor(
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.districtId = params['id'];
            this.statsFilter = { districtIds: [this.districtId] };
            this.statsDetailsQueryParams = { districtIds: this.districtId };
            this.loadDistrict();
            this.resetAndLoadSchools();
        });
    }

    loadDistrict(): void {
        this.isLoading = true;
        this.districtService.getDistrictById(this.districtId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (district: District) => {
                    this.district = district;
                    this.isLoading = false;
                    this.recomputeDerivedFields();
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Rayon tapılmadı', 'error');
                }
            });
    }

    private resetAndLoadSchools(): void {
        this.schoolsPage = 1;
        this.schools = [];
        this.loadSchools();
    }

    loadSchools(): void {
        this.schoolsLoading = this.schoolsPage === 1;
        this.schoolsLoadingMore = this.schoolsPage > 1;
        this.schoolService.getSchools({
            districtIds: [this.districtId],
            sortColumn: 'score',
            sortDirection: 'desc',
            page: this.schoolsPage,
            size: SCHOOLS_PAGE_SIZE,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.schools = [...this.schools, ...response.data];
                    this.schoolsTotal = response.totalCount;
                    this.schoolsLoading = false;
                    this.schoolsLoadingMore = false;
                    this.recomputeSchoolCards();
                },
                error: () => {
                    this.schoolsLoading = false;
                    this.schoolsLoadingMore = false;
                }
            });
    }

    onLoadMoreSchools(): void {
        this.schoolsPage++;
        this.loadSchools();
    }

    get canEdit(): boolean {
        const user = this.authService.getCurrentUserValue();
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        return user.role === 'districtRepresenter' && String(user.profile?.entityId) === String(this.districtId);
    }

    get canUploadPhoto(): boolean {
        return this.canEdit;
    }

    /**
     * Свой профиль как домашняя страница (PROFILE_AS_HOME_TASK.md §3): «Geri» и крошка «Panel»
     * ведут на /panel, который переадресует обратно сюда же — кнопка-пустышка. Проверяем именно
     * владение, а не canEdit: у админа canEdit=true, но это не его дом.
     */
    get isOwnHome(): boolean {
        const user = this.authService.getCurrentUserValue();
        return user?.role === 'districtRepresenter' && String(user.profile?.entityId) === String(this.districtId);
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.district?.avatarUrl);
    }

    private recomputeDerivedFields(): void {
        const district = this.district;
        if (!district) {
            this.heroSubtitleParts = [];
            this.heroChips = [];
            this.heroRank = null;
            this.facts = [];
            this.ratingScopes = [];
            return;
        }

        const crumbs: { text: string; link?: any[] }[] = [];
        if (!this.isOwnHome) crumbs.push({ text: 'Panel', link: ['/panel'] });
        // Регион — ссылкой на его профиль, если привязка есть (districts.region_id заполнен
        // у всех с миграции 006, но regionName приходит только когда джойн отработал).
        if (district.regionId && district.regionName) {
            crumbs.push({ text: district.regionName, link: ['/regions', district.regionId, 'profile'] });
        }
        crumbs.push({ text: district.name });
        this.crumbs = crumbs;

        this.heroSubtitleParts = [{ text: 'Kod ' + district.code }];

        const chips: ProfileHeroChip[] = [];
        if (district.educationHeadName) chips.push({ label: 'Sektor müdiri', value: district.educationHeadName });
        chips.push({ label: 'Məktəb sayı', value: String(district.schoolCount ?? 0) });
        chips.push({ label: 'Şagird sayı', value: String(district.actualStudentCount ?? 0) });
        this.heroChips = chips;

        this.heroRank = district.place != null ? { place: district.place, label: 'Respublika üzrə' } : null;

        this.facts = [
            { label: 'Təhsil sektorunun müdiri', value: district.educationHeadName ?? null },
            { label: 'Məktəb sayı', value: String(district.schoolCount ?? 0) },
            { label: 'Layihə müəllimləri', value: String(district.teacherCount ?? 0) },
            { label: 'Şagird sayı', value: String(district.actualStudentCount ?? 0) },
        ];

        const scopes: ProfileRatingScope[] = [];
        if (district.place != null) scopes.push({ label: 'Respublika üzrə yeri', value: String(district.place) });
        if (district.score != null) scopes.push({ label: 'Ümumi bal', value: district.score.toFixed(1) });
        if (district.averageScore != null) scopes.push({ label: 'Orta bal', value: district.averageScore.toFixed(1) });
        this.ratingScopes = scopes;
    }

    private recomputeSchoolCards(): void {
        this.schoolCards = this.schools.map((s) => ({
            id: s.id,
            name: s.name,
            meta: `Kod ${s.code}${s.averageScore != null ? ' · ' + s.averageScore.toFixed(1) + ' orta bal' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(s.avatarUrl ?? null),
            place: s.place ?? null,
            routerLink: ['/schools', s.id, 'profile'],
        }));
    }

    startEditFacts(): void {
        this.editedEducationHeadName = this.district?.educationHeadName ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    cancelEditFacts(): void {
        this.editingFacts = false;
    }

    saveFacts(): void {
        if (!this.district) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;
        this.districtService.updateDistrictProfile(this.districtId, { educationHeadName: this.editedEducationHeadName })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.district = { ...this.district, ...updated };
                    this.isSavingFacts = false;
                    this.editingFacts = false;
                    this.recomputeDerivedFields();
                    this.snackBarService.show('Profil uğurla yeniləndi', 'success');
                },
                error: () => {
                    this.isSavingFacts = false;
                    this.factsSaveFailed = true;
                    this.snackBarService.show('Profil yenilənərkən xəta baş verdi', 'error');
                }
            });
    }

    onAvatarSelected(blob: Blob): void {
        if (!this.district) return;
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
        this.isUploadingAvatar = true;
        this.districtService.uploadAvatar(this.districtId, formData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    if (this.district) this.district = { ...this.district, avatarUrl: response.avatarUrl };
                    this.isUploadingAvatar = false;
                    this.snackBarService.show('Şəkil uğurla yükləndi', 'success');
                },
                error: () => {
                    this.isUploadingAvatar = false;
                    this.snackBarService.show('Şəkil yüklənərkən xəta baş verdi', 'error');
                }
            });
    }

    onAvatarRejected(message: string): void {
        this.snackBarService.show(message, 'error');
    }

    goBack(): void {
        this.router.navigate(['/panel']);
    }
}
