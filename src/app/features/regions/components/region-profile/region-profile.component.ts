import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight, KeyRound } from 'lucide-angular';
import { RegionService } from '../../services/region.service';
import { DistrictService } from '../../../districts/services/district.service';
import { Region } from '../../../../core/models/region.model';
import { District } from '../../../../core/models/district.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { NavigationHistoryService } from '../../../../core/services/navigation-history.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ProfileHeroComponent, ProfileHeroFact, ProfileHeroSubtitlePart } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { getCurrentAcademicYear, academicYearPeriodLabel } from '../../../../core/utils/academic-year.util';
import { RegionEditingDialogComponent } from '../region-editing-dialog/region-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
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
        ProfileHeroComponent,
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
    heroFacts: ProfileHeroFact[] = [];
    districtCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;
    readonly periodLabel = academicYearPeriodLabel(getCurrentAcademicYear());

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;
    readonly KeyRound = KeyRound;

    private destroyRef = inject(DestroyRef);

    constructor(
        private regionService: RegionService,
        private districtService: DistrictService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService,
        private dialog: Dialog,
        private navigationHistory: NavigationHistoryService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.regionId = params['id'];
            this.statsFilter = { regionIds: [this.regionId] };
            this.loadRegion();
            this.resetAndLoadDistricts();
            this.loadStatsDetailsQueryParams();
        });
    }

    /**
     * /statistics (PROFILES_V2_TASK.md §4.4) не умеет фильтровать по regionIds — только по
     * districtIds/schoolIds/teacherIds. Ссылка «Ətraflı statistika» поэтому получает не
     * regionIds, а полный список districtIds региона (не только загруженная страница карточек
     * districtCards — та режется DISTRICTS_PAGE_SIZE=12 и для крупного региона была бы неполной).
     */
    private loadStatsDetailsQueryParams(): void {
        this.districtService.getDistrictsForFilter({ regionIds: [this.regionId] })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (districts) => {
                    this.statsDetailsQueryParams = { districtIds: districts.map(d => d.id).join(',') };
                },
                error: () => {
                    this.statsDetailsQueryParams = null;
                }
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
            sortColumn: 'score',
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

    /** Правку данных сущности отдали только админ-ролям (PROFILES_V2_TASK.md §1): владелец
     *  больше не редактирует себя, ему остаётся только фото. Идём через RBAC-хелпер, а не через
     *  список ролей руками — moderator тоже должен попадать сюда, и матрица прав одна на всё
     *  приложение (core/config/rbac.config.ts). */
    get canEdit(): boolean {
        return this.authService.canEditRegions();
    }

    /** Фото — единственное, что владелец меняет сам. */
    get canUploadPhoto(): boolean {
        return this.canEdit || this.isOwnHome;
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

    /**
     * Кнопка «Redaktə et» в шапке (PROFILES_V2_TASK.md §3.3) — региону раньше редактирование
     * на профиле не было доступно вообще (`[canEdit]="false"` в шаблоне). Диалог и данные —
     * точная копия regions-list.component.ts::onRegionEdit (код + название, больше полей у
     * региона в ТЗ заказчика нет). После save перезагружаем профиль целиком (loadRegion).
     */
    openEditDialog(): void {
        if (!this.region) return;
        const dialogRef = this.dialog.open<any>(RegionEditingDialogComponent, {
            width: '400px',
            data: {
                region: {
                    id: this.region.id,
                    name: this.region.name,
                    code: this.region.code
                },
                isEditing: true,
                canDelete: this.authService.canDeleteRegions()
            },
        });

        dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
            if (result?.action === 'delete') {
                this.handleRegionDelete();
            } else if (result?.action === 'save') {
                this.regionService.updateRegion(this.regionId, result.data).subscribe({
                    next: (response: any) => {
                        this.snackBarService.show(response.message || 'Regional Təhsil İdarəsi uğurla yeniləndi', 'success');
                        this.loadRegion();
                    },
                    error: (error: any) => {
                        this.snackBarService.show(error.error?.message ?? 'Profil yenilənərkən xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    private handleRegionDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Regional Təhsil İdarəsini silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Bu idarəyə bağlı rayonlar silinmir, sadəcə idarə ilə əlaqələri kəsilir.'
            }
        });

        confirmRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean) => {
            if (!result) return;
            this.regionService.deleteRegion(this.regionId).subscribe({
                next: () => {
                    this.snackBarService.show('Regional Təhsil İdarəsi uğurla silindi', 'success');
                    this.router.navigate(['/regions']);
                },
                error: (error: any) => {
                    this.snackBarService.show(error.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
        });
    }

    private recomputeDerivedFields(): void {
        const region = this.region;
        if (!region) {
            this.heroSubtitleParts = [];
            this.heroFacts = [];
            return;
        }

        this.heroSubtitleParts = [{ text: 'Kod ' + region.code }];

        this.heroFacts = [
            { label: 'Rayon / şəhər sayı', value: String(region.districtCount ?? 0) },
            { label: 'Məktəb sayı', value: String(region.schoolCount ?? 0) },
            { label: 'Layihə müəllimləri', value: String(region.teacherCount ?? 0) },
            { label: 'Şagird sayı', value: String(region.studentCount ?? 0) },
        ];
    }

    private recomputeDistrictCards(): void {
        this.districtCards = this.districts.map((d) => ({
            id: d.id,
            name: d.name,
            meta: `Kod ${d.code}`,
            avatarUrl: this.configService.resolveAssetUrl(d.avatarUrl ?? null),
            place: d.place ?? null,
            // score (reytinq xalı) в бейдже карточки — см. комментарий в
            // teacher-profile.component.ts::recomputeStudentCards.
            metric: d.score != null ? String(Math.round(d.score)) : null,
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

    /** Возврат туда, откуда пришли (BASE_FIXES_TASK.md §1.5); /panel — только фолбэк, когда
     *  истории самого приложения нет (прямая ссылка, F5). */
    goBack(): void {
        if (this.navigationHistory.canGoBack()) this.navigationHistory.back();
        else this.router.navigate(['/panel']);
    }

    /** «Şəxsi məlumatlar» ушёл из шапки для ролей-владельцев (BASE_FIXES_TASK.md §1.2) —
     *  смена пароля теперь доступна отсюда. */
    goToProfile(): void {
        this.router.navigate(['/profile']);
    }
}
