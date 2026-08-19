import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Loader } from 'lucide-angular';
import { RegionService } from '../../services/region.service';
import { DistrictService } from '../../../districts/services/district.service';
import { Region } from '../../../../core/models/region.model';
import { District } from '../../../../core/models/district.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ProfileHeroComponent, ProfileHeroChip, ProfileHeroSubtitlePart, ProfileHeroRank } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileFactsComponent, ProfileFact } from '../../../../shared/components/profile/profile-facts/profile-facts.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent, ProfileRatingScope } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';

const DISTRICTS_PAGE_SIZE = 12;

/**
 * Профиль РТИ (PROFILE_AS_HOME_TASK.md §4) — домашняя страница роли regionRepresenter.
 * Каркас тот же, что у района, drill-down на районы. Блока "Uğurları" нет (как и у района),
 * поля "руководитель РТИ" нет тоже: в ТЗ заказчика региона не было вообще, заводить колонку
 * в проде под непрошенное поле не стали.
 *
 * Все производные значения — обычные поля, а не геттеры: геттер, возвращающий новый объект,
 * триггерит ngOnChanges у app-profile-stats-section на каждом цикле change detection и даёт
 * бесконечный поток HTTP-запросов (случалось, см. PROFILES_TASK.md §10).
 */
@Component({
    selector: 'app-region-profile',
    imports: [
        CommonModule, RouterModule, LucideAngularModule,
        ButtonComponent,
        ProfileHeroComponent, ProfileFactsComponent,
        ProfileStatsSectionComponent, ProfileRatingSectionComponent, EntityCardGridComponent,
    ],
    templateUrl: './region-profile.component.html',
})
export class RegionProfileComponent implements OnInit {
    regionId!: string;
    region: Region | null = null;
    isLoading = true;

    districts: District[] = [];
    districtsTotal = 0;
    districtsLoading = true;
    districtsLoadingMore = false;
    private districtsPage = 1;

    isUploadingAvatar = false;

    heroSubtitleParts: ProfileHeroSubtitlePart[] = [];
    heroChips: ProfileHeroChip[] = [];
    heroRank: ProfileHeroRank | null = null;
    facts: ProfileFact[] = [];
    ratingScopes: ProfileRatingScope[] = [];
    districtCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;

    private destroyRef = inject(DestroyRef);

    constructor(
        private regionService: RegionService,
        private districtService: DistrictService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.regionId = params['id'];
            this.statsFilter = { regionIds: [this.regionId] };
            this.statsDetailsQueryParams = { regionIds: this.regionId };
            this.loadRegion();
            this.resetAndLoadDistricts();
        });
    }

    loadRegion(): void {
        this.isLoading = true;
        this.regionService.getRegionById(this.regionId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (region: Region) => {
                    this.region = region;
                    this.isLoading = false;
                    this.recomputeDerivedFields();
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Regional Təhsil İdarəsi tapılmadı', 'error');
                }
            });
    }

    private resetAndLoadDistricts(): void {
        this.districtsPage = 1;
        this.districts = [];
        this.loadDistricts();
    }

    loadDistricts(): void {
        this.districtsLoading = this.districtsPage === 1;
        this.districtsLoadingMore = this.districtsPage > 1;
        this.districtService.getDistricts({
            regionIds: [this.regionId],
            sortColumn: 'averageScore',
            sortDirection: 'desc',
            page: this.districtsPage,
            size: DISTRICTS_PAGE_SIZE,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.districts = [...this.districts, ...response.data];
                    this.districtsTotal = response.totalCount;
                    this.districtsLoading = false;
                    this.districtsLoadingMore = false;
                    this.recomputeDistrictCards();
                },
                error: () => {
                    this.districtsLoading = false;
                    this.districtsLoadingMore = false;
                }
            });
    }

    onLoadMoreDistricts(): void {
        this.districtsPage++;
        this.loadDistricts();
    }

    get canEdit(): boolean {
        const user = this.authService.getCurrentUserValue();
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        return user.role === 'regionRepresenter' && String(user.profile?.entityId) === String(this.regionId);
    }

    get canUploadPhoto(): boolean {
        return this.canEdit;
    }

    /**
     * Свой профиль как домашняя страница: «Geri» и крошка «Panel» ведут на /panel, который
     * переадресует обратно сюда же — кнопка-пустышка. На чужом профиле (админ смотрит) они нужны.
     */
    get isOwnHome(): boolean {
        const user = this.authService.getCurrentUserValue();
        return user?.role === 'regionRepresenter' && String(user.profile?.entityId) === String(this.regionId);
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.region?.avatarUrl);
    }

    private recomputeDerivedFields(): void {
        const region = this.region;
        if (!region) {
            this.heroSubtitleParts = [];
            this.heroChips = [];
            this.heroRank = null;
            this.facts = [];
            this.ratingScopes = [];
            return;
        }

        this.heroSubtitleParts = [{ text: 'Kod ' + region.code }];

        this.heroChips = [
            { label: 'Rayon sayı', value: String(region.districtCount ?? 0) },
            { label: 'Məktəb sayı', value: String(region.schoolCount ?? 0) },
            { label: 'Şagird sayı', value: String(region.studentCount ?? 0) },
        ];

        this.heroRank = region.place != null ? { place: region.place, label: 'Respublika üzrə' } : null;

        this.facts = [
            { label: 'Rayon / şəhər sayı', value: String(region.districtCount ?? 0) },
            { label: 'Məktəb sayı', value: String(region.schoolCount ?? 0) },
            { label: 'Layihə müəllimləri', value: String(region.teacherCount ?? 0) },
            { label: 'Şagird sayı', value: String(region.studentCount ?? 0) },
        ];

        const scopes: ProfileRatingScope[] = [];
        if (region.place != null) scopes.push({ label: 'Respublika üzrə yeri', value: String(region.place) });
        if (region.score != null) scopes.push({ label: 'Ümumi bal', value: region.score.toFixed(1) });
        if (region.averageScore != null) scopes.push({ label: 'Orta bal', value: region.averageScore.toFixed(1) });
        this.ratingScopes = scopes;
    }

    private recomputeDistrictCards(): void {
        this.districtCards = this.districts.map((d) => ({
            id: d.id,
            name: d.name,
            meta: `Kod ${d.code}${d.averageScore != null ? ' · ' + d.averageScore.toFixed(1) + ' orta bal' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(d.avatarUrl ?? null),
            place: d.place ?? null,
            routerLink: ['/districts', d.id, 'profile'],
        }));
    }

    onAvatarSelected(blob: Blob): void {
        if (!this.region) return;
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
        this.isUploadingAvatar = true;
        this.regionService.uploadAvatar(this.regionId, formData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    if (this.region) this.region = { ...this.region, avatarUrl: response.avatarUrl };
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
