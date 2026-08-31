import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight, KeyRound } from 'lucide-angular';
import { SchoolService } from '../../services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { NavigationHistoryService } from '../../../../core/services/navigation-history.service';
import { ProfileChangeService } from '../../../../core/services/profile-change.service';
import { ProfileChangeRequest } from '../../../../core/models/profile-change.model';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ProfileHeroComponent, ProfileHeroFact, ProfileHeroSubtitlePart } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileChangeBannerComponent } from '../../../../shared/components/profile/profile-change-banner/profile-change-banner.component';
import { ProfileAchievementsComponent } from '../../../../shared/components/profile/profile-achievements/profile-achievements.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';
import { canViewAncestorCrumb } from '../../../../core/utils/entity-hierarchy.util';
import { getCurrentAcademicYear, academicYearPeriodLabel } from '../../../../core/utils/academic-year.util';

const TEACHERS_PAGE_SIZE = 12;

@Component({
    selector: 'app-school-profile',
    imports: [
        CommonModule, FormsModule, RouterModule, LucideAngularModule,
        ButtonComponent, InputComponent,
        ProfileHeroComponent, ProfileChangeBannerComponent, ProfileAchievementsComponent,
        ProfileStatsSectionComponent, ProfileRatingSectionComponent, EntityCardGridComponent,
    ],
    templateUrl: './school-profile.component.html',
    styleUrl: './school-profile.component.scss'
})
export class SchoolProfileComponent implements OnInit {
    schoolId!: string;
    school: School | null = null;
    isLoading = true;

    teachers: Teacher[] = [];
    teachersTotal = 0;
    teachersLoading = true;
    teachersLoadingMore = false;
    private teachersPage = 1;

    editingFacts = false;
    editedDirectorName: string | null = null;
    editedFoundedYear: number | null = null;
    // Успехи редактируются в этой же форме, вместе с фактами (26.08.2026, п.4) — отдельной
    // кнопки/формы у app-profile-achievements для этой сущности больше нет.
    editedAchievements: string | null = null;
    isSavingFacts = false;
    factsSaveFailed = false;

    isUploadingAvatar = false;

    /** Модерация самостоятельно введённых полей (BASE_FIXES_TASK.md §2.4/§2.6) — не видно
     *  никому, кроме владельца и админа, сервер сам следит за этим через /profile-changes/current. */
    pendingChange: ProfileChangeRequest | null = null;
    isProcessingChange = false;
    /** id заявки, которую админ сейчас правит через «Düzəliş et» — форма редактирования та же
     *  самая, что и обычная, но saveFacts() при этом подтверждает заявку, а не пишет напрямую. */
    private correctingPendingId: number | null = null;

    // Вычисляются явно, не через геттеры — см. подробный комментарий в
    // teacher-profile.component.ts. Геттер, возвращающий новый объект/массив на каждый вызов,
    // триггерит ngOnChanges у app-profile-stats-section на каждом цикле change detection и
    // превращается в бесконечный цикл HTTP-запросов (поймано при ручной QA).
    /**
     * Крошки массивом, а не условиями в шаблоне: «Panel» скрывается на своём профиле, и
     * разделители при любом сочетании не должны ни удваиваться, ни висеть в начале.
     */
    crumbs: { text: string; link?: any[] }[] = [];
    heroSubtitleParts: ProfileHeroSubtitlePart[] = [];
    heroFacts: ProfileHeroFact[] = [];
    ratingsPlaceLabel = 'Respublika üzrə yeri';
    /** «2025/2026-cı tədris ili» вместо статичного «cari tədris ili» (BASE_FIXES_TASK.md §4.3). */
    readonly periodLabel = academicYearPeriodLabel(getCurrentAcademicYear());
    teacherCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;
    readonly KeyRound = KeyRound;

    private destroyRef = inject(DestroyRef);

    constructor(
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService,
        private dialog: Dialog,
        private navigationHistory: NavigationHistoryService,
        private profileChangeService: ProfileChangeService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.schoolId = params['id'];
            this.statsFilter = { schoolIds: [this.schoolId] };
            this.loadSchool();
            this.resetAndLoadTeachers();
        });
    }

    loadSchool(): void {
        this.isLoading = true;
        this.schoolService.getSchoolById(this.schoolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (school) => {
                    this.school = school;
                    this.isLoading = false;
                    this.recomputeDerivedFields();
                    this.loadPendingChange();
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Məktəb tapılmadı', 'error');
                }
            });
    }

    /** admin-like ИЛИ владелец — тот же круг, кому «/current» вообще ответит непустым телом
     *  (см. profileChange.controller.ts::current), поэтому дёргаем без лишних условий тут. */
    private loadPendingChange(): void {
        if (!this.canEditFacts) return;
        this.profileChangeService.current('school', parseInt(this.schoolId, 10))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (pending) => { this.pendingChange = pending; },
                error: () => { this.pendingChange = null; }
            });
    }

    private resetAndLoadTeachers(): void {
        this.teachersPage = 1;
        this.teachers = [];
        this.loadTeachers();
    }

    loadTeachers(): void {
        this.teachersLoading = this.teachersPage === 1;
        this.teachersLoadingMore = this.teachersPage > 1;
        this.teacherService.getTeachers({
            schoolIds: [this.schoolId],
            // "Layihə müəllimləri" факт в шапке (heroFacts) считает только active=true
            // учителей (attachProfileCounts на бэкенде) — без этого фильтра список ниже
            // включал бы и неактивных (снятых с рейтингов) учителей, и число совпадать
            // не будет (заказчик заметил расхождение 13 vs 16, 24.08.2026).
            active: true,
            sortColumn: 'score',
            sortDirection: 'desc',
            page: this.teachersPage,
            size: TEACHERS_PAGE_SIZE,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.teachers = [...this.teachers, ...response.data];
                    this.teachersTotal = response.totalCount;
                    this.teachersLoading = false;
                    this.teachersLoadingMore = false;
                    this.recomputeTeacherCards();
                },
                error: () => {
                    this.teachersLoading = false;
                    this.teachersLoadingMore = false;
                }
            });
    }

    onLoadMoreTeachers(): void {
        this.teachersPage++;
        this.loadTeachers();
    }

    /** Правку данных сущности отдали только админ-ролям (PROFILES_V2_TASK.md §1): владелец
     *  больше не редактирует себя, ему остаётся только фото. Идём через RBAC-хелпер, а не через
     *  список ролей руками — moderator тоже должен попадать сюда, и матрица прав одна на всё
     *  приложение (core/config/rbac.config.ts). */
    get canEdit(): boolean {
        return this.authService.canEditSchools();
    }

    /** Факты профиля (BASE_FIXES_TASK.md §2.5/§2.6) — вернули владельцу, но через модерацию,
     *  не напрямую в таблицу (см. saveFacts()). */
    get canEditFacts(): boolean {
        return this.canEdit || this.isOwnHome;
    }

    /** Фото — единственное, что владелец меняет сам без модерации. */
    get canUploadPhoto(): boolean {
        return this.canEdit || this.isOwnHome;
    }

    /** Полям, которые показывает баннер, соответствуют подписи из heroFacts — держим отдельно
     *  от heroFacts (та зависит от school и пересчитывается только при загрузке сущности). */
    readonly changeFieldLabels: Record<string, string> = {
        directorName: 'Məktəbin direktoru',
        foundedYear: 'Məktəbin yaranma ili',
        achievements: 'Məktəbin uğurları',
    };

    get currentFieldValues(): Record<string, any> {
        return {
            directorName: this.school?.directorName ?? null,
            foundedYear: this.school?.foundedYear ?? null,
            achievements: this.school?.achievements ?? null,
        };
    }

    /**
     * Свой профиль как домашняя страница (PROFILE_AS_HOME_TASK.md §3): «Geri» и крошка «Panel»
     * ведут на /panel, который переадресует обратно сюда же — кнопка-пустышка. Проверяем именно
     * владение, а не canEdit: у админа canEdit=true, но это не его дом.
     */
    get isOwnHome(): boolean {
        const user = this.authService.getCurrentUserValue();
        return user?.role === 'schoolDirector' && String(user.profile?.entityId) === String(this.schoolId);
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.school?.avatarUrl);
    }

    private recomputeDerivedFields(): void {
        const school = this.school;
        if (!school) {
            this.heroSubtitleParts = [];
            this.heroFacts = [];
            return;
        }

        const user = this.authService.getCurrentUserValue();
        const crumbs: { text: string; link?: any[] }[] = [];
        // Крошку «Kabinetim» убрали (П.3) — домашняя кнопка в шапке и «Geri» на профиле остаются.
        if (school.district) {
            const canViewDistrict = canViewAncestorCrumb(user, 'district', school.district.id);
            crumbs.push({ text: school.district.name, link: canViewDistrict ? ['/districts', school.district.id, 'profile'] : undefined });
        }
        crumbs.push({ text: school.name });
        this.crumbs = crumbs;

        // districtIds нужен, иначе виджет «Məktəblər» на /statistics откроется пустым и
        // задизейбленным (он каскадный от района) — сам фильтр schoolIds при этом всё равно
        // применится (PROFILES_V2_TASK.md §4.4).
        this.statsDetailsQueryParams = {
            districtIds: school.district?.id,
            schoolIds: this.schoolId,
        };

        this.heroSubtitleParts = [{ text: 'Kod ' + school.code }];

        // «Ünvan» убран по требованию заказчика (26.08.2026, п.3) — поле address в модели/БД
        // осталось нетронутым, просто больше не выводится в профиле.
        this.heroFacts = [
            { label: 'Direktor', value: school.directorName ?? null },
            { label: 'Yaranma tarixi', value: school.foundedYear ? String(school.foundedYear) : null },
            { label: 'Layihə şagirdlərinin sayı', value: String(school.actualStudentCount ?? 0) },
            { label: 'Layihə müəllimlərinin sayı', value: String(school.teacherCount ?? 0) },
        ];

        // Заказчик (24.08.2026): в таблице «Reytinqlər» колонка "Yer" должна показывать место
        // в СВОЁМ районе, не по республике — «Gəncə üzrə yeri» (см. комментарий в
        // profile-rating-section.component.ts).
        this.ratingsPlaceLabel = school.district?.name ? `${school.district.name} üzrə yeri` : 'Respublika üzrə yeri';
    }

    private recomputeTeacherCards(): void {
        this.teacherCards = this.teachers.map((t) => ({
            id: t.id,
            name: t.fullname,
            meta: `Kod ${t.code}${t.studentCount != null ? ' · ' + t.studentCount + ' şagird' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(t.avatarUrl ?? null),
            place: t.place ?? null,
            // score (reytinq xalı) в бейдже карточки — раньше там не было числа, отражающего
            // реальный порядок сортировки, только национальное место (заказчик принял это
            // за случайную сортировку, 24.08.2026).
            metric: t.score != null ? String(Math.round(t.score)) : null,
            routerLink: ['/teachers', t.id, 'profile'],
        }));
    }

    /**
     * Кнопка «Redaktə et» в шапке (PROFILES_V2_TASK.md §3.2) открывает тот же диалог, что
     * раньше открывался из строки списка schools-list.component.ts::onSchoolEdit — не
     * переписан, только перенесён. После save перезагружаем профиль целиком (loadSchool),
     * чтобы пересчитались recomputeDerivedFields() и все производные поля.
     */
    openEditDialog(): void {
        if (!this.school) return;
        const dialogRef = this.dialog.open<any>(SchoolEditingDialogComponent, {
            width: '1000px',
            data: {
                school: this.school,
                isEditing: true,
                canDelete: this.authService.canDeleteSchools()
            }
        });

        dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
            if (result?.action === 'delete') {
                this.handleSchoolDelete();
            } else if (result?.action === 'save') {
                this.schoolService.updateSchool(result.data).subscribe({
                    next: (response) => {
                        const updatedSchool = ResponseHandlerUtil.extractData<School>(response);
                        const baseMessage = ResponseHandlerUtil.extractMessage(response) || 'Məktəb uğurla yeniləndi';
                        const cascadeParts: string[] = [];
                        if (updatedSchool.cascadedTeachersCount) cascadeParts.push(`${updatedSchool.cascadedTeachersCount} müəllimin`);
                        if (updatedSchool.cascadedStudentsCount) cascadeParts.push(`${updatedSchool.cascadedStudentsCount} şagirdin`);
                        const cascadeMessage = cascadeParts.length ? ` (${cascadeParts.join(' və ')} kodu avtomatik yeniləndi)` : '';
                        this.snackBarService.show(baseMessage + cascadeMessage, 'success');
                        this.loadSchool();
                    },
                    error: (error) => {
                        this.snackBarService.show(error.error?.message ?? 'Profil yenilənərkən xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    private handleSchoolDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Məktəbi silmək istədiyinizdən əminsiniz mi?\nDİQQƏT! Məktəb silinərkən ona bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!'
            }
        });

        confirmRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean) => {
            if (!result) return;
            this.schoolService.deleteSchool(this.schoolId).subscribe({
                next: () => {
                    this.snackBarService.show('Məktəb uğurla silindi', 'success');
                    this.router.navigate(['/schools']);
                },
                error: (error) => {
                    this.snackBarService.show(error.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
        });
    }

    startEditFacts(): void {
        this.correctingPendingId = null;
        this.editedDirectorName = this.school?.directorName ?? null;
        this.editedFoundedYear = this.school?.foundedYear ?? null;
        this.editedAchievements = this.school?.achievements ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    /** «Düzəliş et» на плашке модерации (BASE_FIXES_TASK.md §2.6) — та же форма, но
     *  предзаполненная присланными значениями, не текущими подтверждёнными. */
    startCorrectPendingChange(): void {
        if (!this.pendingChange) return;
        this.correctingPendingId = this.pendingChange.id;
        this.editedDirectorName = this.pendingChange.payload['directorName'] ?? this.school?.directorName ?? null;
        this.editedFoundedYear = this.pendingChange.payload['foundedYear'] ?? this.school?.foundedYear ?? null;
        this.editedAchievements = this.pendingChange.payload['achievements'] ?? this.school?.achievements ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    cancelEditFacts(): void {
        this.editingFacts = false;
        this.correctingPendingId = null;
    }

    /** Данные и успехи сохраняются одной заявкой/запросом (26.08.2026, п.4) — раньше успехи
     *  редактировались отдельно через app-profile-achievements, что для владельца означало
     *  две заявки на модерацию вместо одной. */
    saveFacts(): void {
        if (!this.school) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;

        if (this.correctingPendingId != null) {
            this.profileChangeService.approve(this.correctingPendingId, {
                directorName: this.editedDirectorName,
                foundedYear: this.editedFoundedYear,
                achievements: this.editedAchievements,
            })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.isSavingFacts = false;
                        this.editingFacts = false;
                        this.correctingPendingId = null;
                        this.pendingChange = null;
                        this.loadSchool();
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

        this.schoolService.updateSchoolProfile(this.schoolId, {
            directorName: this.editedDirectorName,
            foundedYear: this.editedFoundedYear,
            achievements: this.editedAchievements,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.isSavingFacts = false;
                    this.editingFacts = false;
                    if (result.applied) {
                        this.school = { ...this.school, ...result.entity };
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

    /** Плашка модерации (BASE_FIXES_TASK.md §2.6) — «Təsdiqlə» подтверждает ровно то, что
     *  прислал владелец, без изменений. */
    approvePendingChange(): void {
        if (!this.pendingChange) return;
        this.isProcessingChange = true;
        this.profileChangeService.approve(this.pendingChange.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isProcessingChange = false;
                    this.pendingChange = null;
                    this.loadSchool();
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
        if (!this.school) return;
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
        this.isUploadingAvatar = true;
        this.schoolService.uploadAvatar(this.schoolId, formData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    if (this.school) this.school = { ...this.school, avatarUrl: response.avatarUrl };
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
