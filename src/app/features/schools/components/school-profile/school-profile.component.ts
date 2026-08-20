import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ArrowLeft, Loader, ChevronRight } from 'lucide-angular';
import { SchoolService } from '../../services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ConfigService } from '../../../../core/services/config.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ProfileHeroComponent, ProfileHeroChip, ProfileHeroSubtitlePart, ProfileHeroRank } from '../../../../shared/components/profile/profile-hero/profile-hero.component';
import { ProfileFactsComponent, ProfileFact } from '../../../../shared/components/profile/profile-facts/profile-facts.component';
import { ProfileAchievementsComponent } from '../../../../shared/components/profile/profile-achievements/profile-achievements.component';
import { ProfileStatsSectionComponent } from '../../../../shared/components/profile/profile-stats-section/profile-stats-section.component';
import { ProfileRatingSectionComponent, ProfileRatingScope } from '../../../../shared/components/profile/profile-rating-section/profile-rating-section.component';
import { EntityCardGridComponent, EntityCardItem } from '../../../../shared/components/profile/entity-card-grid/entity-card-grid.component';
import { SchoolEditingDialogComponent } from '../school-editing/school-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { StatisticsFilter } from '../../../../core/models/statistics.model';
import { canViewAncestorCrumb } from '../../../../core/utils/entity-hierarchy.util';

const TEACHERS_PAGE_SIZE = 12;

@Component({
    selector: 'app-school-profile',
    imports: [
        CommonModule, FormsModule, RouterModule, LucideAngularModule,
        ButtonComponent, InputComponent,
        ProfileHeroComponent, ProfileFactsComponent, ProfileAchievementsComponent,
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
    isSavingFacts = false;
    factsSaveFailed = false;

    isSavingAchievements = false;
    achievementsSaveFailed = false;

    isUploadingAvatar = false;

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
    heroChips: ProfileHeroChip[] = [];
    heroRank: ProfileHeroRank | null = null;
    facts: ProfileFact[] = [];
    ratingScopes: ProfileRatingScope[] = [];
    teacherCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;
    readonly ChevronRight = ChevronRight;

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
        private dialog: Dialog
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
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Məktəb tapılmadı', 'error');
                }
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
        return user?.role === 'schoolDirector' && String(user.profile?.entityId) === String(this.schoolId);
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.school?.avatarUrl);
    }

    private recomputeDerivedFields(): void {
        const school = this.school;
        if (!school) {
            this.heroSubtitleParts = [];
            this.heroChips = [];
            this.heroRank = null;
            this.facts = [];
            this.ratingScopes = [];
            return;
        }

        const user = this.authService.getCurrentUserValue();
        const crumbs: { text: string; link?: any[] }[] = [];
        if (!this.isOwnHome) crumbs.push({ text: 'Panel', link: ['/panel'] });
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

        const chips: ProfileHeroChip[] = [];
        if (school.directorName) chips.push({ label: 'Direktor', value: school.directorName });
        if (school.foundedYear) chips.push({ label: 'Yaranma tarixi', value: String(school.foundedYear) });
        chips.push({ label: 'Şagird sayı', value: String(school.actualStudentCount ?? 0) });
        this.heroChips = chips;

        this.heroRank = school.place != null ? { place: school.place, label: 'Respublika üzrə' } : null;

        this.facts = [
            { label: 'Məktəb direktoru', value: school.directorName ?? null },
            { label: 'Yaranma tarixi', value: school.foundedYear ? String(school.foundedYear) : null },
            { label: 'Şagird sayı', value: String(school.actualStudentCount ?? 0) },
            { label: 'Layihə müəllimləri', value: String(school.teacherCount ?? 0) },
            { label: 'Rayon üzrə yeri', value: school.districtPlace != null ? String(school.districtPlace) : null },
            { label: 'Ünvan', value: school.address || null },
        ];

        const scopes: ProfileRatingScope[] = [];
        if (school.place != null) scopes.push({ label: 'Respublika üzrə yeri', value: String(school.place) });
        if (school.districtPlace != null) scopes.push({ label: 'Rayon üzrə yeri', value: String(school.districtPlace) });
        if (school.score != null) scopes.push({ label: 'Ümumi bal', value: school.score.toFixed(1) });
        if (school.averageScore != null) scopes.push({ label: 'Orta bal', value: school.averageScore.toFixed(1) });
        this.ratingScopes = scopes;
    }

    private recomputeTeacherCards(): void {
        this.teacherCards = this.teachers.map((t) => ({
            id: t.id,
            name: t.fullname,
            meta: `Kod ${t.code}${t.studentCount != null ? ' · ' + t.studentCount + ' şagird' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(t.avatarUrl ?? null),
            place: t.place ?? null,
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
        this.editedDirectorName = this.school?.directorName ?? null;
        this.editedFoundedYear = this.school?.foundedYear ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    cancelEditFacts(): void {
        this.editingFacts = false;
    }

    saveFacts(): void {
        if (!this.school) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;
        this.schoolService.updateSchoolProfile(this.schoolId, {
            directorName: this.editedDirectorName,
            foundedYear: this.editedFoundedYear,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.school = { ...this.school, ...updated };
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

    saveAchievements(text: string | null): void {
        if (!this.school) return;
        this.isSavingAchievements = true;
        this.achievementsSaveFailed = false;
        this.schoolService.updateSchoolProfile(this.schoolId, { achievements: text })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.school = { ...this.school, ...updated };
                    this.isSavingAchievements = false;
                    this.snackBarService.show('Profil uğurla yeniləndi', 'success');
                },
                error: () => {
                    this.isSavingAchievements = false;
                    this.achievementsSaveFailed = true;
                    this.snackBarService.show('Profil yenilənərkən xəta baş verdi', 'error');
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

    goBack(): void {
        this.router.navigate(['/panel']);
    }
}
