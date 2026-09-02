import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight, KeyRound } from 'lucide-angular';
import { DistrictService } from '../../services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { NavigationHistoryService } from '../../../../core/services/navigation-history.service';
import { ProfileChangeService } from '../../../../core/services/profile-change.service';
import { ProfileChangeRequest } from '../../../../core/models/profile-change.model';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ProfileHeroComponent, ProfileHeroFact, ProfileHeroSubtitlePart } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileChangeBannerComponent } from '../../../../shared/components/profile/profile-change-banner/profile-change-banner.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { DistrictEditingDialogComponent } from '../district-editing-dialog/district-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';
import { canViewAncestorCrumb } from '../../../../core/utils/entity-hierarchy.util';
import { getCurrentAcademicYear, academicYearPeriodLabel, academicYearLabel } from '../../../../core/utils/academic-year.util';
import { RatingYearService } from '../../../../core/services/rating-year.service';

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
        ProfileHeroComponent, ProfileChangeBannerComponent,
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

    pendingChange: ProfileChangeRequest | null = null;
    isProcessingChange = false;
    private correctingPendingId: number | null = null;

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
    heroFacts: ProfileHeroFact[] = [];
    schoolCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;
    /** Подпись над блоком статистики. Не readonly и не «текущий год»: цифры под ней приходят
     *  за год резолвера (REYTINQ_ILI_TASK.md §3), и подпись обязана называть тот же год —
     *  иначе в сентябре заголовок обещает 2026/2027, а под ним данные 2025/2026. */
    periodLabel = academicYearPeriodLabel(getCurrentAcademicYear());
    /** REYTINQ_ILI_TASK.md §6 — «2025/2026 reytinqi» рядом с заголовком карточек, только когда
     *  показанный год рейтинга отличается от текущего учебного. */
    ratingYearLabel: string | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;
    readonly KeyRound = KeyRound;

    private destroyRef = inject(DestroyRef);

    constructor(
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService,
        private dialog: Dialog,
        private navigationHistory: NavigationHistoryService,
        private profileChangeService: ProfileChangeService,
        private ratingYearService: RatingYearService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.districtId = params['id'];
            this.statsFilter = { districtIds: [this.districtId] };
            this.statsDetailsQueryParams = { districtIds: this.districtId };
            this.loadDistrict();
            this.resetAndLoadSchools();
        });
        this.ratingYearService.getState().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (state) => {
                this.periodLabel = academicYearPeriodLabel(state.ratingYear);
                this.ratingYearLabel = state.ratingYear !== state.currentAcademicYear
                    ? academicYearLabel(state.ratingYear) + ' reytinqi'
                    : null;
            },
            error: () => { this.ratingYearLabel = null; }
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
                    this.loadPendingChange();
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Təhsil sektoru tapılmadı', 'error');
                }
            });
    }

    private loadPendingChange(): void {
        if (!this.canEditFacts) return;
        this.profileChangeService.current('district', parseInt(this.districtId, 10))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (pending) => { this.pendingChange = pending; },
                error: () => { this.pendingChange = null; }
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
            // "Məktəb sayı" факт в шапке считает только active=true школы
            // (attachProfileCounts на бэкенде) — тот же фикс, что для school→teachers
            // (см. school-profile.component.ts), чтобы число совпадало со списком ниже.
            active: true,
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

    /** Правку данных сущности отдали только админ-ролям (PROFILES_V2_TASK.md §1): владелец
     *  больше не редактирует себя, ему остаётся только фото. Идём через RBAC-хелпер, а не через
     *  список ролей руками — moderator тоже должен попадать сюда, и матрица прав одна на всё
     *  приложение (core/config/rbac.config.ts). */
    get canEdit(): boolean {
        return this.authService.canEditDistricts();
    }

    /** Факты профиля (BASE_FIXES_TASK.md §2.5/§2.6) — вернули владельцу через модерацию. */
    get canEditFacts(): boolean {
        return this.canEdit || this.isOwnHome;
    }

    /** Фото — единственное, что владелец меняет сам без модерации. */
    get canUploadPhoto(): boolean {
        return this.canEdit || this.isOwnHome;
    }

    readonly changeFieldLabels: Record<string, string> = {
        educationHeadName: 'Təhsil sektorunun müdiri',
    };

    get currentFieldValues(): Record<string, any> {
        return { educationHeadName: this.district?.educationHeadName ?? null };
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

    /**
     * Заголовок шапки профиля — с суффиксом «üzrə təhsil sektoru» для всех ролей (решение
     * заказчика, чисто отображение). Крошки и карточки районов на главной РТИ остаются
     * коротким именем: с суффиксом строка крошек разъезжается.
     */
    get heroTitle(): string {
        return this.district ? `${this.district.name} üzrə təhsil sektoru` : '';
    }

    private recomputeDerivedFields(): void {
        const district = this.district;
        if (!district) {
            this.heroSubtitleParts = [];
            this.heroFacts = [];
            return;
        }

        const user = this.authService.getCurrentUserValue();
        const crumbs: { text: string; link?: any[] }[] = [];
        // Крошку «Kabinetim» убрали (П.3) — домашняя кнопка в шапке и «Geri» на профиле остаются.
        // Регион — ссылкой на его профиль, если привязка есть (districts.region_id заполнен
        // у всех с миграции 006, но regionName приходит только когда джойн отработал) И
        // текущий пользователь вправе его увидеть (см. canViewAncestorCrumb).
        if (district.regionId && district.regionName) {
            const canViewRegion = canViewAncestorCrumb(user, 'region', district.regionId);
            crumbs.push({ text: district.regionName, link: canViewRegion ? ['/regions', district.regionId, 'profile'] : undefined });
        }
        crumbs.push({ text: district.name });
        this.crumbs = crumbs;

        this.heroSubtitleParts = [{ text: 'Kod ' + district.code }];

        this.heroFacts = [
            { label: 'Təhsil sektorunun müdiri', value: district.educationHeadName ?? null },
            { label: 'Məktəb sayı', value: String(district.schoolCount ?? 0) },
            { label: 'Layihə müəllimləri', value: String(district.teacherCount ?? 0) },
            { label: 'Şagird sayı', value: String(district.actualStudentCount ?? 0) },
        ];
    }

    private recomputeSchoolCards(): void {
        this.schoolCards = this.schools.map((s) => ({
            id: s.id,
            name: s.name,
            meta: `Kod ${s.code}`,
            avatarUrl: this.configService.resolveAssetUrl(s.avatarUrl ?? null),
            place: s.place ?? null,
            // score (reytinq xalı) в бейдже карточки — см. комментарий в
            // teacher-profile.component.ts::recomputeStudentCards.
            metric: s.score != null ? String(Math.round(s.score)) : null,
            routerLink: ['/schools', s.id, 'profile'],
        }));
    }

    /**
     * Кнопка «Redaktə et» в шапке (PROFILES_V2_TASK.md §3.2) открывает тот же диалог, что
     * раньше открывался из строки списка districts-list.component.ts::onDistrictEdit — не
     * переписан, только перенесён. После save перезагружаем профиль целиком (loadDistrict).
     */
    openEditDialog(): void {
        if (!this.district) return;
        const dialogRef = this.dialog.open<any>(DistrictEditingDialogComponent, {
            width: '400px',
            data: {
                district: {
                    id: this.district.id,
                    name: this.district.name,
                    code: this.district.code,
                    studentCount: this.district.studentCount,
                    regionId: this.district.regionId ?? null
                },
                isEditing: true,
                canDelete: this.authService.canDeleteDistricts()
            },
        });

        dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
            if (result?.action === 'delete') {
                this.handleDistrictDelete();
            } else if (result?.action === 'save') {
                this.districtService.updateDistrict(this.districtId, result.data).subscribe({
                    next: (response: any) => {
                        this.snackBarService.show(response.message || 'Təhsil sektoru uğurla yeniləndi', 'success');
                        this.loadDistrict();
                    },
                    error: (error: any) => {
                        this.snackBarService.show(error.error?.message ?? 'Profil yenilənərkən xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    private handleDistrictDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Təhsil sektorunu silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean) => {
            if (!result) return;
            this.districtService.deleteDistrict(this.districtId).subscribe({
                next: () => {
                    this.snackBarService.show('Təhsil sektoru uğurla silindi', 'success');
                    this.router.navigate(['/districts']);
                },
                error: (error: any) => {
                    this.snackBarService.show(error.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
        });
    }

    startEditFacts(): void {
        this.correctingPendingId = null;
        this.editedEducationHeadName = this.district?.educationHeadName ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    startCorrectPendingChange(): void {
        if (!this.pendingChange) return;
        this.correctingPendingId = this.pendingChange.id;
        this.editedEducationHeadName = this.pendingChange.payload['educationHeadName'] ?? this.district?.educationHeadName ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    cancelEditFacts(): void {
        this.editingFacts = false;
        this.correctingPendingId = null;
    }

    saveFacts(): void {
        if (!this.district) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;

        if (this.correctingPendingId != null) {
            this.profileChangeService.approve(this.correctingPendingId, { educationHeadName: this.editedEducationHeadName })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.isSavingFacts = false;
                        this.editingFacts = false;
                        this.correctingPendingId = null;
                        this.pendingChange = null;
                        this.loadDistrict();
                        this.snackBarService.show('Məlumatlar düzəlişlə təsdiqləndi', 'success');
                    },
                    error: () => {
                        this.isSavingFacts = false;
                        this.factsSaveFailed = true;
                        this.snackBarService.show('Təsdiqlənərkən xəta baş verdi', 'error');
                    }
                });
            return;
        }

        this.districtService.updateDistrictProfile(this.districtId, { educationHeadName: this.editedEducationHeadName })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.isSavingFacts = false;
                    this.editingFacts = false;
                    if (result.applied) {
                        this.district = { ...this.district, ...result.entity };
                        this.recomputeDerivedFields();
                        this.snackBarService.show('Profil uğurla yeniləndi', 'success');
                    } else {
                        this.pendingChange = result.pendingRequest;
                        this.profileChangeService.refreshPendingCount();
                        this.snackBarService.show('Məlumatlar admin təsdiqinə göndərildi', 'success');
                    }
                },
                error: () => {
                    this.isSavingFacts = false;
                    this.factsSaveFailed = true;
                    this.snackBarService.show('Profil yenilənərkən xəta baş verdi', 'error');
                }
            });
    }

    approvePendingChange(): void {
        if (!this.pendingChange) return;
        this.isProcessingChange = true;
        this.profileChangeService.approve(this.pendingChange.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isProcessingChange = false;
                    this.pendingChange = null;
                    this.loadDistrict();
                    this.snackBarService.show('Məlumatlar təsdiqləndi', 'success');
                },
                error: () => {
                    this.isProcessingChange = false;
                    this.snackBarService.show('Təsdiqlənərkən xəta baş verdi', 'error');
                }
            });
    }

    rejectPendingChange(reviewNote: string | null): void {
        if (!this.pendingChange) return;
        this.isProcessingChange = true;
        this.profileChangeService.reject(this.pendingChange.id, reviewNote)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isProcessingChange = false;
                    this.pendingChange = null;
                    this.snackBarService.show('Məlumatlar rədd edildi', 'success');
                },
                error: () => {
                    this.isProcessingChange = false;
                    this.snackBarService.show('Rədd edilərkən xəta baş verdi', 'error');
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
