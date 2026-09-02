import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight, KeyRound } from 'lucide-angular';
import { TeacherService } from '../../services/teacher.service';
import { StudentService } from '../../../students/services/student.service';
import { Teacher } from '../../../../core/models/teacher.model';
import { Student } from '../../../../core/models/student.model';
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
import { TeacherEditingDialogComponent } from '../teacher-editing/teacher-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';
import { canViewAncestorCrumb } from '../../../../core/utils/entity-hierarchy.util';
import { getCurrentAcademicYear, academicYearPeriodLabel, academicYearLabel } from '../../../../core/utils/academic-year.util';
import { RatingYearService } from '../../../../core/services/rating-year.service';
import { resolveTeacherGradeLabel } from '../../../../core/config/teacher-grade.config';

const STUDENTS_PAGE_SIZE = 12;

@Component({
    selector: 'app-teacher-profile',
    imports: [
        CommonModule, FormsModule, RouterModule, LucideAngularModule,
        ButtonComponent, InputComponent,
        ProfileHeroComponent, ProfileChangeBannerComponent, ProfileAchievementsComponent,
        ProfileStatsSectionComponent, ProfileRatingSectionComponent, EntityCardGridComponent,
    ],
    templateUrl: './teacher-profile.component.html',
    styleUrl: './teacher-profile.component.scss'
})
export class TeacherProfileComponent implements OnInit {
    teacherId!: string;
    teacher: Teacher | null = null;
    isLoading = true;

    students: Student[] = [];
    studentsTotal = 0;
    studentsLoading = true;
    studentsLoadingMore = false;
    private studentsPage = 1;

    editingFacts = false;
    editedGradeLabel = '';
    editedPedagogicalExperienceYears: number | null = null;
    // Успехи редактируются в этой же форме, вместе с фактами (26.08.2026, п.4) — отдельной
    // кнопки/формы у app-profile-achievements для этой сущности больше нет.
    editedAchievements: string | null = null;
    isSavingFacts = false;
    factsSaveFailed = false;

    isUploadingAvatar = false;

    pendingChange: ProfileChangeRequest | null = null;
    isProcessingChange = false;
    private correctingPendingId: number | null = null;

    // Вычисляются явно (не через геттеры) и переприсваиваются только когда реально меняются
    // исходные данные. Геттер, возвращающий новый массив/объект на каждый вызов, здесь опасен:
    // Angular re-evaluates template-выражения на каждом цикле change detection, новая ссылка
    // на @Input triggers ngOnChanges у дочернего компонента — а у app-profile-stats-section
    // ngOnChanges дёргает HTTP-запрос. Геттер в biding [filter] превращался в бесконечный
    // цикл запросов (поймано при ручной QA, см. PROFILES_TASK.md §10) — отсюда это правило
    // для ВСЕХ производных полей на этой странице, не только statsFilter.
    /**
     * Крошки собираются массивом, а не условиями в шаблоне: «Panel» скрывается на своём
     * профиле, район и школа у учителя nullable (в проде есть учителя без школы), и разделители
     * при любом сочетании не должны ни удваиваться, ни висеть в начале.
     */
    crumbs: { text: string; link?: any[] }[] = [];
    heroSubtitleParts: ProfileHeroSubtitlePart[] = [];
    heroFacts: ProfileHeroFact[] = [];
    ratingsPlaceLabel = 'Respublika üzrə yeri';
    /** Подпись над блоком статистики. Не readonly и не «текущий год»: цифры под ней приходят
     *  за год резолвера (REYTINQ_ILI_TASK.md §3), и подпись обязана называть тот же год —
     *  иначе в сентябре заголовок обещает 2026/2027, а под ним данные 2025/2026. */
    periodLabel = academicYearPeriodLabel(getCurrentAcademicYear());
    /** REYTINQ_ILI_TASK.md §6 — «2025/2026 reytinqi» рядом с заголовком карточек, только когда
     *  показанный год рейтинга отличается от текущего учебного. */
    ratingYearLabel: string | null = null;
    studentCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;
    readonly KeyRound = KeyRound;

    private destroyRef = inject(DestroyRef);

    constructor(
        private teacherService: TeacherService,
        private studentService: StudentService,
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
            this.teacherId = params['id'];
            this.statsFilter = { teacherIds: [this.teacherId] };
            this.loadTeacher();
            this.resetAndLoadStudents();
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

    loadTeacher(): void {
        this.isLoading = true;
        this.teacherService.getTeacherById(this.teacherId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (teacher) => {
                    this.teacher = teacher;
                    this.isLoading = false;
                    this.recomputeDerivedFields();
                    this.loadPendingChange();
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Müəllim tapılmadı', 'error');
                }
            });
    }

    private loadPendingChange(): void {
        if (!this.canEditFacts) return;
        this.profileChangeService.current('teacher', parseInt(this.teacherId, 10))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (pending) => { this.pendingChange = pending; },
                error: () => { this.pendingChange = null; }
            });
    }

    private resetAndLoadStudents(): void {
        this.studentsPage = 1;
        this.students = [];
        this.loadStudents();
    }

    loadStudents(): void {
        this.studentsLoading = this.studentsPage === 1;
        this.studentsLoadingMore = this.studentsPage > 1;
        this.studentService.getStudents({
            teacherIds: [this.teacherId],
            sortColumn: 'score',
            sortDirection: 'desc',
            page: this.studentsPage,
            size: STUDENTS_PAGE_SIZE,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    // StudentService.getStudents отдаёт уже развёрнутый {data, totalCount}, но его
                    // объявленный тип StudentApiResponse формально остаётся ApiResponse-обёрткой
                    // (student.model.ts) — extractPaginatedData разворачивает оба варианта надёжно,
                    // тот же приём, что в students-list.component.ts.
                    const page = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                    this.students = [...this.students, ...page.data];
                    this.studentsTotal = page.totalCount;
                    this.studentsLoading = false;
                    this.studentsLoadingMore = false;
                    this.recomputeStudentCards();
                },
                error: () => {
                    this.studentsLoading = false;
                    this.studentsLoadingMore = false;
                }
            });
    }

    onLoadMoreStudents(): void {
        this.studentsPage++;
        this.loadStudents();
    }

    /** Правку данных сущности отдали только админ-ролям (PROFILES_V2_TASK.md §1): владелец
     *  больше не редактирует себя, ему остаётся только фото. Идём через RBAC-хелпер, а не через
     *  список ролей руками — moderator тоже должен попадать сюда, и матрица прав одна на всё
     *  приложение (core/config/rbac.config.ts). */
    get canEdit(): boolean {
        return this.authService.canEditTeachers();
    }

    /** Факты профиля (BASE_FIXES_TASK.md §2.5/§2.6) — вернули владельцу через модерацию. */
    get canEditFacts(): boolean {
        return this.canEdit || this.isOwnHome;
    }

    /** Фото — единственное, что владелец меняет сам без модерации. Директор своей школы тоже:
     *  раньше он ставил/убирал фото учителям прямо с карточки на своей главной, теперь эта
     *  возможность переехала сюда, в профиль конкретного учителя (26.08.2026, п.1). */
    get canUploadPhoto(): boolean {
        return this.canEdit || this.isOwnHome
            || (this.permissions.canShowUI('canManageTeacherPhotos') && this.isOwnSchool);
    }

    readonly changeFieldLabels: Record<string, string> = {
        gradeLabel: 'Sinfi',
        pedagogicalExperienceYears: 'Pedaqoji stajı',
        achievements: 'Uğurları',
    };

    // pedagogicalExperienceYears — то же необформатированное число, что в payload заявки
    // (banner сам решает, как показывать), иначе before/after сравнивались бы в разных
    // единицах ("15 il" vs "12").
    get currentFieldValues(): Record<string, any> {
        return {
            gradeLabel: this.teacher?.gradeLabel ?? null,
            pedagogicalExperienceYears: this.teacher?.pedagogicalExperienceYears ?? null,
            achievements: this.teacher?.achievements ?? null,
        };
    }

    /**
     * Свой профиль как домашняя страница (PROFILE_AS_HOME_TASK.md §3): «Geri» и крошка «Panel»
     * ведут на /panel, который переадресует обратно сюда же — кнопка-пустышка. На чужом
     * профиле (админ смотрит) они нужны, поэтому проверяем именно владение, а не canEdit:
     * у админа canEdit=true, но это не его дом.
     */
    get isOwnHome(): boolean {
        const user = this.authService.getCurrentUserValue();
        return user?.role === 'teacher' && String(user.profile?.entityId) === String(this.teacherId);
    }

    /** Директор ЭТОЙ школы, просматривающий профиль своего учителя (не обязательно свой
     *  «дом») — по спеке школьного директора студенческие фото на этой странице тоже его
     *  зона (BASE_FIXES_TASK.md §3.1: «schoolDirector: … ученики своей школы»). */
    get isOwnSchool(): boolean {
        const user = this.authService.getCurrentUserValue();
        return user?.role === 'schoolDirector' && String(user.profile?.entityId) === String(this.teacher?.school?.id ?? '');
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.teacher?.avatarUrl);
    }

    /** Стаж вводится числом лет напрямую (BASE_FIXES_TASK.md §2.3) — раньше здесь считали
     *  «сейчас минус pedagogicalStartYear», но человек мог работать не непрерывно, и это
     *  завышало стаж. pedagogicalStartYear в БД остался, но из профиля больше не читается. */
    private pedagogicalYearsLabel(teacher: Teacher): string | null {
        const years = teacher.pedagogicalExperienceYears;
        return years != null ? `${years} il` : null;
    }

    private recomputeDerivedFields(): void {
        const teacher = this.teacher;
        if (!teacher) {
            this.heroSubtitleParts = [];
            this.heroFacts = [];
            return;
        }

        const grades = resolveTeacherGradeLabel(teacher);
        const pedStaj = this.pedagogicalYearsLabel(teacher);

        const user = this.authService.getCurrentUserValue();
        const crumbs: { text: string; link?: any[] }[] = [];
        // Крошку «Kabinetim» убрали (П.3) — домашняя кнопка в шапке и «Geri» на профиле остаются.
        if (teacher.district) {
            const canViewDistrict = canViewAncestorCrumb(user, 'district', teacher.district.id);
            crumbs.push({ text: teacher.district.name, link: canViewDistrict ? ['/districts', teacher.district.id, 'profile'] : undefined });
        }
        if (teacher.school) {
            const canViewSchool = canViewAncestorCrumb(user, 'school', teacher.school.id);
            crumbs.push({ text: teacher.school.name, link: canViewSchool ? ['/schools', teacher.school.id, 'profile'] : undefined });
        }
        crumbs.push({ text: teacher.fullname });
        this.crumbs = crumbs;

        // /statistics умеет каскадно фильтровать школу только внутри выбранного района
        // (statistics-main.component.ts::loadSchools) и учителя — только внутри выбранной
        // школы (loadTeachers) — без district/schoolIds виджет «Müəllimlər» откроется пустым
        // и задизейбленным, хотя сам фильтр по teacherIds всё равно применится (PROFILES_V2_TASK.md §4.4).
        this.statsDetailsQueryParams = {
            districtIds: teacher.district?.id,
            schoolIds: teacher.school?.id,
            teacherIds: this.teacherId,
        };

        this.heroSubtitleParts = [{ text: 'Kod ' + teacher.code }];

        this.heroFacts = [
            { label: 'Sinfi', value: grades },
            { label: 'Layihə şagirdlərinin sayı', value: String(teacher.actualStudentCount ?? 0) },
            { label: 'Pedaqoji stajı', value: pedStaj },
        ];

        // Заказчик (24.08.2026): в таблице «Reytinqlər» колонка "Yer" должна показывать место
        // в СВОЁМ районе, не по республике — «Gəncə üzrə yeri» (см. комментарий в
        // profile-rating-section.component.ts).
        this.ratingsPlaceLabel = teacher.district?.name ? `${teacher.district.name} üzrə yeri` : 'Respublika üzrə yeri';
    }

    private recomputeStudentCards(): void {
        this.studentCards = this.students.map((s) => ({
            id: s.id,
            name: `${s.lastName ?? ''} ${s.firstName}`.trim(),
            meta: `${s.grade}-ci sinif`,
            avatarUrl: this.configService.resolveAssetUrl(s.avatarUrl) ?? null,
            place: s.place ?? null,
            // score (reytinq xalı) в бейдже карточки, не averageScore и не place: список
            // сортируется сервером по score (loadStudents ниже), а показывать что-то другое
            // рядом со счётом выглядело бы неотсортированным, хотя сортировка честная
            // (заказчик, 24.08.2026, принял за баг сортировки именно это несоответствие).
            metric: s.score != null ? String(Math.round(s.score)) : null,
            routerLink: ['/students', s.id],
        }));
    }

    /**
     * Кнопка «Redaktə et» в шапке (PROFILES_V2_TASK.md §3.2) открывает тот же диалог, что
     * раньше открывался из строки списка teachers-list.component.ts::onTeacherUpdate — не
     * переписан, только перенесён: там же живёт вся логика каскада кодов и префиксов.
     * После save перезагружаем профиль целиком (loadTeacher), а не патчим локально, чтобы
     * пересчитались recomputeDerivedFields() и все производные поля.
     */
    openEditDialog(): void {
        if (!this.teacher) return;
        const dialogRef = this.dialog.open<any>(TeacherEditingDialogComponent, {
            width: '1000px',
            data: {
                teacher: this.teacher,
                isEditing: true,
                canDelete: this.authService.canDeleteTeachers()
            }
        });

        dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
            if (result?.action === 'delete') {
                this.handleTeacherDelete();
            } else if (result?.action === 'save') {
                this.teacherService.updateTeacher(result.data).subscribe({
                    next: (response) => {
                        const updatedTeacher = ResponseHandlerUtil.extractData<Teacher>(response);
                        const baseMessage = ResponseHandlerUtil.extractMessage(response) || 'Müəllim uğurla yeniləndi';
                        const cascadeMessage = updatedTeacher.cascadedStudentsCount
                            ? ` (${updatedTeacher.cascadedStudentsCount} şagirdin kodu avtomatik yeniləndi)`
                            : '';
                        this.snackBarService.show(baseMessage + cascadeMessage, 'success');
                        this.loadTeacher();
                    },
                    error: (error) => {
                        this.snackBarService.show(error.error?.message ?? 'Profil yenilənərkən xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    private handleTeacherDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Müəllimi silmək istədiyinizdən əminsiniz mi?\n\n DİQQƏT!\nMüəllim silinərkən onun BÜTÜN şagirdləri də silinəcək!' }
        });

        confirmRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean) => {
            if (!result) return;
            this.teacherService.deleteTeacher(this.teacherId).subscribe({
                next: (response) => {
                    this.snackBarService.show(response?.message || 'Müəllim uğurla silindi', 'success');
                    this.router.navigate(['/teachers']);
                },
                error: (error) => {
                    this.snackBarService.show(error.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
        });
    }

    startEditFacts(): void {
        this.correctingPendingId = null;
        this.editedGradeLabel = this.teacher?.gradeLabel ?? '';
        this.editedPedagogicalExperienceYears = this.teacher?.pedagogicalExperienceYears ?? null;
        this.editedAchievements = this.teacher?.achievements ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    startCorrectPendingChange(): void {
        if (!this.pendingChange) return;
        this.correctingPendingId = this.pendingChange.id;
        this.editedGradeLabel = this.pendingChange.payload['gradeLabel'] ?? this.teacher?.gradeLabel ?? '';
        this.editedPedagogicalExperienceYears = this.pendingChange.payload['pedagogicalExperienceYears'] ?? this.teacher?.pedagogicalExperienceYears ?? null;
        this.editedAchievements = this.pendingChange.payload['achievements'] ?? this.teacher?.achievements ?? null;
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
        if (!this.teacher) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;

        if (this.correctingPendingId != null) {
            this.profileChangeService.approve(this.correctingPendingId, {
                gradeLabel: this.editedGradeLabel.trim() || null,
                pedagogicalExperienceYears: this.editedPedagogicalExperienceYears,
                achievements: this.editedAchievements,
            })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.isSavingFacts = false;
                        this.editingFacts = false;
                        this.correctingPendingId = null;
                        this.pendingChange = null;
                        this.loadTeacher();
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

        this.teacherService.updateTeacherProfile(this.teacherId, {
            gradeLabel: this.editedGradeLabel.trim() || null,
            pedagogicalExperienceYears: this.editedPedagogicalExperienceYears,
            achievements: this.editedAchievements,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.isSavingFacts = false;
                    this.editingFacts = false;
                    if (result.applied) {
                        this.teacher = { ...this.teacher, ...result.entity };
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
                    this.loadTeacher();
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
        if (!this.teacher) return;
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
        this.isUploadingAvatar = true;
        this.teacherService.uploadAvatar(this.teacherId, formData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    if (this.teacher) this.teacher = { ...this.teacher, avatarUrl: response.avatarUrl };
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

    onAvatarDeleteConfirmed(): void {
        if (!this.teacher) return;
        this.teacherService.deleteAvatar(this.teacherId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    if (this.teacher) this.teacher = { ...this.teacher, avatarUrl: undefined };
                    this.snackBarService.show('Şəkil silindi', 'success');
                },
                error: () => this.snackBarService.show('Şəkil silinərkən xəta baş verdi', 'error')
            });
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
