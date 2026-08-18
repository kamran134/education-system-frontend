import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Loader } from 'lucide-angular';
import { TeacherService } from '../../services/teacher.service';
import { StudentService } from '../../../students/services/student.service';
import { Teacher } from '../../../../core/models/teacher.model';
import { Student } from '../../../../core/models/student.model';
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
import { StatisticsFilter } from '../../../../core/models/statistics.model';

const STUDENTS_PAGE_SIZE = 12;

@Component({
    selector: 'app-teacher-profile',
    imports: [
        CommonModule, FormsModule, RouterModule, LucideAngularModule,
        ButtonComponent, InputComponent,
        ProfileHeroComponent, ProfileFactsComponent, ProfileAchievementsComponent,
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
    editedPedagogicalStartYear: number | null = null;
    isSavingFacts = false;
    factsSaveFailed = false;

    isSavingAchievements = false;
    achievementsSaveFailed = false;

    isUploadingAvatar = false;

    // Вычисляются явно (не через геттеры) и переприсваиваются только когда реально меняются
    // исходные данные. Геттер, возвращающий новый массив/объект на каждый вызов, здесь опасен:
    // Angular re-evaluates template-выражения на каждом цикле change detection, новая ссылка
    // на @Input triggers ngOnChanges у дочернего компонента — а у app-profile-stats-section
    // ngOnChanges дёргает HTTP-запрос. Геттер в biding [filter] превращался в бесконечный
    // цикл запросов (поймано при ручной QA, см. PROFILES_TASK.md §10) — отсюда это правило
    // для ВСЕХ производных полей на этой странице, не только statsFilter.
    heroSubtitleParts: ProfileHeroSubtitlePart[] = [];
    heroChips: ProfileHeroChip[] = [];
    heroRank: ProfileHeroRank | null = null;
    facts: ProfileFact[] = [];
    ratingScopes: ProfileRatingScope[] = [];
    studentCards: EntityCardItem[] = [];
    statsFilter: StatisticsFilter | null = null;
    statsDetailsQueryParams: Record<string, any> | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Loader = Loader;

    private destroyRef = inject(DestroyRef);

    constructor(
        private teacherService: TeacherService,
        private studentService: StudentService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        public permissions: PermissionsService,
        private configService: ConfigService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.teacherId = params['id'];
            this.statsFilter = { teacherIds: [this.teacherId] };
            this.statsDetailsQueryParams = { teacherIds: this.teacherId };
            this.loadTeacher();
            this.resetAndLoadStudents();
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
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Müəllim tapılmadı', 'error');
                }
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
            sortColumn: 'place',
            sortDirection: 'asc',
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

    get canEdit(): boolean {
        const user = this.authService.getCurrentUserValue();
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        return user.role === 'teacher' && String(user.profile?.entityId) === String(this.teacherId);
    }

    get canUploadPhoto(): boolean {
        return this.canEdit;
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.teacher?.avatarUrl);
    }

    private gradesLabel(teacher: Teacher): string | null {
        const grades = teacher.grades ?? [];
        if (grades.length === 0) return null;
        if (grades.length === 1) return `${grades[0]}-ci sinif`;
        return `${grades.join(', ')}-ci siniflər`;
    }

    private pedagogicalYearsLabel(teacher: Teacher): string | null {
        const startYear = teacher.pedagogicalStartYear;
        if (!startYear) return null;
        const years = new Date().getFullYear() - startYear;
        return `${years} il`;
    }

    private recomputeDerivedFields(): void {
        const teacher = this.teacher;
        if (!teacher) {
            this.heroSubtitleParts = [];
            this.heroChips = [];
            this.heroRank = null;
            this.facts = [];
            this.ratingScopes = [];
            return;
        }

        const grades = this.gradesLabel(teacher);
        const pedStaj = this.pedagogicalYearsLabel(teacher);

        this.heroSubtitleParts = [{ text: 'Kod ' + teacher.code }];

        const chips: ProfileHeroChip[] = [];
        if (grades) chips.push({ label: 'Sinfi', value: grades });
        chips.push({ label: 'Şagird sayı', value: String(teacher.actualStudentCount ?? 0) });
        if (pedStaj) chips.push({ label: 'Pedaqoji stajı', value: pedStaj });
        this.heroChips = chips;

        this.heroRank = teacher.place != null ? { place: teacher.place, label: 'Respublika üzrə' } : null;

        this.facts = [
            { label: 'Sinfi', value: grades },
            { label: 'Şagird sayı', value: String(teacher.actualStudentCount ?? 0) },
            { label: 'Pedaqoji stajı', value: pedStaj },
        ];

        const scopes: ProfileRatingScope[] = [];
        if (teacher.place != null) scopes.push({ label: 'Respublika üzrə yeri', value: String(teacher.place) });
        if (teacher.districtPlace != null) scopes.push({ label: 'Rayon üzrə yeri', value: String(teacher.districtPlace) });
        if (teacher.score != null) scopes.push({ label: 'Ümumi bal', value: teacher.score.toFixed(1) });
        if (teacher.averageScore != null) scopes.push({ label: 'Orta bal', value: teacher.averageScore.toFixed(1) });
        this.ratingScopes = scopes;
    }

    private recomputeStudentCards(): void {
        this.studentCards = this.students.map((s) => ({
            id: s.id,
            name: `${s.lastName ?? ''} ${s.firstName}`.trim(),
            meta: `${s.grade}-ci sinif${s.averageScore != null ? ' · ' + s.averageScore.toFixed(1) + ' bal' : ''}`,
            avatarUrl: this.configService.resolveAssetUrl(s.avatarUrl) ?? null,
            place: s.place ?? null,
            routerLink: ['/students', s.id],
        }));
    }

    startEditFacts(): void {
        this.editedPedagogicalStartYear = this.teacher?.pedagogicalStartYear ?? null;
        this.factsSaveFailed = false;
        this.editingFacts = true;
    }

    cancelEditFacts(): void {
        this.editingFacts = false;
    }

    saveFacts(): void {
        if (!this.teacher) return;
        this.isSavingFacts = true;
        this.factsSaveFailed = false;
        this.teacherService.updateTeacherProfile(this.teacherId, { pedagogicalStartYear: this.editedPedagogicalStartYear })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.teacher = { ...this.teacher, ...updated };
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
        if (!this.teacher) return;
        this.isSavingAchievements = true;
        this.achievementsSaveFailed = false;
        this.teacherService.updateTeacherProfile(this.teacherId, { achievements: text })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.teacher = { ...this.teacher, ...updated };
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

    goBack(): void {
        this.router.navigate(['/panel']);
    }
}
