import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight } from 'lucide-angular';
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
import { ProfileHeroComponent, ProfileHeroFact, ProfileHeroSubtitlePart, ProfileHeroMetric, ProfileHeroPlace } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { DistrictEditingDialogComponent } from '../district-editing-dialog/district-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';
import { canViewAncestorCrumb } from '../../../../core/utils/entity-hierarchy.util';
import { getCurrentAcademicYear, academicYearLabel } from '../../../../core/utils/academic-year.util';

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
        ProfileHeroComponent,
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
    heroFacts: ProfileHeroFact[] = [];
    heroMetric: ProfileHeroMetric | null = null;
    heroPlaces: ProfileHeroPlace[] = [];
    schoolCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;

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
        private dialog: Dialog
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

    /** Правку данных сущности отдали только админ-ролям (PROFILES_V2_TASK.md §1): владелец
     *  больше не редактирует себя, ему остаётся только фото. Идём через RBAC-хелпер, а не через
     *  список ролей руками — moderator тоже должен попадать сюда, и матрица прав одна на всё
     *  приложение (core/config/rbac.config.ts). */
    get canEdit(): boolean {
        return this.authService.canEditDistricts();
    }

    /** Фото — единственное, что владелец меняет сам. */
    get canUploadPhoto(): boolean {
        return this.canEdit || this.isOwnHome;
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
            this.heroFacts = [];
            this.heroMetric = null;
            this.heroPlaces = [];
            return;
        }

        const user = this.authService.getCurrentUserValue();
        const crumbs: { text: string; link?: any[] }[] = [];
        if (!this.isOwnHome) crumbs.push({ text: 'Kabinetim', link: ['/panel'] });
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

        this.heroMetric = {
            label: 'Reytinq xalı',
            value: district.score != null ? String(Math.round(district.score)) : '—',
            caption: academicYearLabel(getCurrentAcademicYear()),
        };

        this.heroPlaces = district.place != null ? [{ label: 'Respublika', value: String(district.place) }] : [];
    }

    private recomputeSchoolCards(): void {
        this.schoolCards = this.schools.map((s) => ({
            id: s.id,
            name: s.name,
            // score (reytinq xalı), не averageScore — та же путаница, что в
            // teacher-profile.component.ts::recomputeStudentCards (см. комментарий там).
            meta: `Kod ${s.code}${s.score != null ? ' · ' + Math.round(s.score) + ' xal' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(s.avatarUrl ?? null),
            place: s.place ?? null,
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
                        this.snackBarService.show(response.message || 'Rayon / şəhər uğurla yeniləndi', 'success');
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
            data: { title: 'Silinməyə razılıq', text: 'Rayonu / şəhəri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean) => {
            if (!result) return;
            this.districtService.deleteDistrict(this.districtId).subscribe({
                next: () => {
                    this.snackBarService.show('Rayon / şəhər uğurla silindi', 'success');
                    this.router.navigate(['/districts']);
                },
                error: (error: any) => {
                    this.snackBarService.show(error.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
        });
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
