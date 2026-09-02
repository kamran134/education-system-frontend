import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { StudentWithResult } from '../../../../core/models/student.model';
import { Error } from '../../../../core/models/error.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
import { getCurrentAcademicYear } from '../../../../core/utils/academic-year.util';
import { gradeLabel, gradeResultsTitle } from '../../../../core/utils/grade-label.util';
import { SelectComponent } from '../../../../shared/components/ui/form-controls/select/select.component';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { LucideAngularModule, ArrowLeft, Download, Loader, Edit2, User, Trash2, ChevronDown, ChevronUp } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Dialog } from '@angular/cdk/dialog';
import { ResultEditingDialogComponent } from '../result-editing/result-editing-dialog.component';
import { ExamResult } from '../../../../core/models/examResult.model';
import { ImageCropModalComponent } from '../../../../shared/components/modals/image-crop-modal/image-crop-modal.component';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { NavigationHistoryService } from '../../../../core/services/navigation-history.service';
import { ConfigService } from '../../../../core/services/config.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { CertificateService } from '../../../certificates/services/certificate.service';
import {
    AwardCode,
    CERTIFICATE_AWARDS,
    CertificateAvailabilityMap,
    CertificateAwardMeta,
} from '../../../../core/models/certificate.model';

@Component({
    selector: 'app-student-details',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ButtonComponent,
        ImageCropModalComponent,
        SelectComponent
    ],
    templateUrl: './student-details.component.html',
    styleUrl: './student-details.component.scss'
})
export class StudentDetailsComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    studentId!: string;
    student!: StudentWithResult | null;
    prevPageSize: number = 10;
    prevPageIndex: number = 0;
    filterParams: any = {};
    source: string = 'students';
    isLoading: boolean = true;

    // Avatar functionality
    isAvatarHovered = false;
    isCropModalOpen = false;
    imageChangedEvent: any;
    isUploadingAvatar = false;

    // Фильтр «Əvvəlki siniflərin nəticələrinin göstər» — раскрываемые классы вместо старого
    // тоггла show/hide (П.10b). Можно раскрыть один класс, можно несколько.
    selectedPreviousGrades: number[] = [];

    // Sertifikat yükləmə — CERTIFICATES_TASK.md §9. Giriş = /students/:id-ə giriş,
    // ayrıca RBAC gate yoxdur (baxın certificate.model.ts).
    certificateAvailability: CertificateAvailabilityMap = {};
    // `${resultId}:${awardCode}` — bir nəticəyə bir neçə mükafat sertifikatı ola bilər,
    // hərəsinin öz yükləmə vəziyyəti olmalıdır.
    downloadingKey: string | null = null;
    readonly certificateAwards = CERTIFICATE_AWARDS;

    private get currentAcademicYear(): number {
        return getCurrentAcademicYear();
    }

    /**
     * Результаты текущего учебного года — по result.academicYear (generated-колонка на бэке),
     * а не по result.year.
     *
     * П.10a исходил из того, что result.year — это год НАЧАЛА учебного года. Это неверно: year —
     * календарный год результата, и учебный год из него получается только вместе с месяцем
     * (сентябрь-декабрь → year, январь-июнь → year - 1). Из-за этого весенние результаты уезжали
     * на год вперёд: 1 сентября 2026 «текущим» стал показываться весь январь-июнь 2026, то есть
     * ПРОШЛЫЙ учебный год и прошлый класс ученика (жалоба заказчика 02.09.2026 — «sinfi tədris ili
     * üzrə deyil, illər üzrə verir»).
     */
    get currentResults(): ExamResult[] {
        return (this.student?.results ?? []).filter(r => r.academicYear === this.currentAcademicYear);
    }

    /**
     * Заголовок над блоком текущего года — «3-cü sinif nəticələri», по той же просьбе заказчика
     * («hər başlıq ilə ayrılmalıdır»). null, если в текущем году результаты сразу нескольких
     * классов: такие ученики в базе есть (см. миграцию 009_student_year_scores_single_grade),
     * и общий заголовок для них был бы враньём — лучше без заголовка.
     */
    get currentResultsTitle(): string | null {
        const grades = new Set(this.currentResults.map(r => r.grade).filter((g): g is number => g != null));
        return grades.size === 1 ? gradeResultsTitle([...grades][0]) : null;
    }

    /**
     * Классы для раскрытия: уникальные result.grade по строкам ВНЕ текущего учебного года,
     * по убыванию (П.10b).
     *
     * Критерий именно «год результата не текущий», а не «класс не равен текущему классу
     * ученика»: второгодник сидит в том же классе два года подряд, и при отборе по классу
     * его прошлогодние результаты выпадали разом отовсюду — в currentResults не попадали
     * (другой год), а в список раскрытия не предлагались (класс совпадает с текущим).
     * Здесь тот же предикат, что и в expandedResults, — списки обязаны сходиться.
     */
    get previousGradeOptions(): number[] {
        const grades = new Set<number>();
        for (const r of this.student?.results ?? []) {
            if (r.grade != null && r.academicYear !== this.currentAcademicYear) grades.add(r.grade);
        }
        return [...grades].sort((a, b) => b - a);
    }

    get previousGradeSelectOptions(): { label: string; value: number }[] {
        return this.previousGradeOptions.map(g => ({ label: gradeLabel(g), value: g }));
    }

    /**
     * Раскрытые результаты, разбитые по классам, с заголовком над каждым блоком
     * («2-ci sinif nəticələri») — заказчик, 02.09.2026: сейчас всё идёт одним списком по датам,
     * и где кончается один класс и начинается другой, не видно.
     *
     * Порядок классов — как в списке раскрытия (по убыванию), внутри класса порядок результатов
     * сохраняется тот, что пришёл с бэка: год и месяц по убыванию.
     */
    get expandedResultGroups(): { grade: number; title: string; results: ExamResult[] }[] {
        const byGrade = new Map<number, ExamResult[]>();
        for (const r of this.expandedResults) {
            if (r.grade == null) continue;
            if (!byGrade.has(r.grade)) byGrade.set(r.grade, []);
            byGrade.get(r.grade)!.push(r);
        }
        return [...byGrade.keys()]
            .sort((a, b) => b - a)
            .map(grade => ({ grade, title: gradeResultsTitle(grade), results: byGrade.get(grade)! }));
    }

    /** Строки раскрытых классов (кроме текущего года — он и так показан выше). */
    get expandedResults(): ExamResult[] {
        if (this.selectedPreviousGrades.length === 0) return [];
        const currentYear = this.currentAcademicYear;
        return (this.student?.results ?? []).filter(r =>
            r.grade != null && this.selectedPreviousGrades.includes(r.grade) && r.academicYear !== currentYear
        );
    }

    /** Всё, что сейчас видно на странице: текущий год + раскрытые классы (П.10c). */
    get visibleResults(): ExamResult[] {
        return [...this.currentResults, ...this.expandedResults];
    }

    trackByResultId(_: number, result: ExamResult): number { return result.id; }

    // Icons
    readonly ArrowLeft = ArrowLeft;
    readonly Download = Download;
    readonly Loader = Loader;
    readonly Edit2 = Edit2;
    readonly User = User;
    readonly Trash2 = Trash2;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;

    private destroyRef = inject(DestroyRef);

    constructor(
        private studentService: StudentService,
        private route: ActivatedRoute,
        private router: Router,
        private excelService: ExcelService,
        private dialog: Dialog,
        private authService: AuthService,
        public permissions: PermissionsService,
        private navigationHistory: NavigationHistoryService,
        private snackBarService: SnackBarService,
        private configService: ConfigService,
        private certificateService: CertificateService
    ) { }

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.studentId = params['id']!;
            this.loadStudent();
        });

        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => {
            this.prevPageSize = params['pageSize'] ? +params['pageSize'] : this.prevPageSize;
            this.prevPageIndex = params['pageIndex'] ? +params['pageIndex'] : this.prevPageIndex;
            this.filterParams = params;
            this.source = params['source'] || 'students'
        });

        //console.log('queryParams.filterParams', this.filterParams);
    }

    private loadStudent(): void {
        this.isLoading = true;
        this.studentService.getStudentById(this.studentId).subscribe({
            next: (response) => {
                this.student = ResponseHandlerUtil.extractData<StudentWithResult>(response);
                this.isLoading = false;
                this.autoExpandLastGradeIfCurrentYearEmpty();
                if (this.student) this.loadCertificateAvailability(this.student.id);
            },
            error: (error: Error) => {
                console.error('Şagirdin alınmasında xəta!', error.error);
                this.student = null;
                this.isLoading = false;
            }
        });
    }

    /**
     * Если за текущий учебный год результатов нет вообще (сентябрь, экзамены ещё не проводились),
     * сразу раскрываем последний класс — иначе карточка выглядит пустой, а вся история спрятана
     * за фильтром, и это читается как «данные пропали». Фильтр остаётся управляемым: раскрытый
     * класс видно в селекте, его можно снять или добавить другие.
     */
    private autoExpandLastGradeIfCurrentYearEmpty(): void {
        if (this.currentResults.length > 0 || this.selectedPreviousGrades.length > 0) return;
        const [lastGrade] = this.previousGradeOptions;
        if (lastGrade != null) this.selectedPreviousGrades = [lastGrade];
    }

    private loadCertificateAvailability(studentId: number): void {
        this.certificateService.availabilityForStudent(studentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (availability) => (this.certificateAvailability = availability),
            // Sertifikat mövcudluğu ikinci dərəcəli məlumatdır — xəta olsa da səhifə işləməyə davam edir,
            // sadəcə "Sertifikatı yüklə" düymələri görünmür.
            error: () => (this.certificateAvailability = {}),
        });
    }

    availableAwardsFor(resultId: number): CertificateAwardMeta[] {
        const perAward = this.certificateAvailability[resultId];
        if (!perAward) return [];
        return this.certificateAwards.filter((a) => perAward[a.code]?.available);
    }

    isDownloading(resultId: number, awardCode: AwardCode): boolean {
        return this.downloadingKey === `${resultId}:${awardCode}`;
    }

    downloadCertificate(resultId: number, awardCode: AwardCode): void {
        if (this.downloadingKey) return;
        const key = `${resultId}:${awardCode}`;
        this.downloadingKey = key;
        this.certificateService.downloadForResult(resultId, awardCode).subscribe({
            next: (blob) => {
                this.downloadingKey = null;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sertifikat-${resultId}-${awardCode}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.downloadingKey = null;
                const status = err?.status;
                const message =
                    status === 409
                        ? 'Bu pillə üçün sertifikat şablonu hələ yüklənməyib'
                        : status === 410
                          ? 'Bu sertifikat ləğv edilib'
                          : status === 404
                            ? 'Bu nəticə üçün sertifikat mövcud deyil'
                            : 'Sertifikat yüklənərkən xəta baş verdi';
                this.snackBarService.show(message, 'error');
            },
        });
    }

    /** Возврат туда, откуда пришли (26.08.2026, п.2) — раньше всегда падал на общий список
     *  учеников/статистики, даже если пришли с главной учителя/директора. filterParams/source
     *  остаются фолбэком на случай прямого захода по ссылке или F5, когда истории SPA нет. */
    goBack(): void {
        // Если пришли с фильтрами в query-параметрах — возвращаемся ЯВНО с ними, а не через
        // историю браузера: у /stats в собственном URL фильтров нет (они живут в состоянии
        // компонента и сериализуются только в ссылку на карточку ученика), поэтому location.back()
        // отдавал голый /stats и сбрасывал весь фильтр в дефолт — жалоба заказчика 01.09.2026.
        // location.back() остаётся для случая, когда восстанавливать нечего: пришли с главной
        // учителя/директора, где фильтров в ссылке нет (BASE_FIXES_TASK.md §1.5).
        const hasFilterParams = Object.keys(this.filterParams ?? {}).length > 0;
        if (!hasFilterParams && this.navigationHistory.canGoBack()) {
            this.navigationHistory.back();
            return;
        }
        const backUrl = this.source === 'stats' ? '/stats' : '/students';
        this.router.navigate([backUrl], { queryParams: this.filterParams });
    }

    /** Основная кнопка — только текущий учебный год (П.10a). */
    exportToExcel() {
        this.downloadStudentDetails(this.currentResults, `${this.student?.code}`);
    }

    /** Вторая кнопка (рядом с фильтром классов) — ровно то, что сейчас видно на странице:
     *  текущий год + раскрытые классы (П.10c). Имя файла отличается, чтобы не перетирать первый. */
    exportVisibleToExcel() {
        this.downloadStudentDetails(this.visibleResults, `${this.student?.code}-secilmish-sinifler`);
    }

    private downloadStudentDetails(results: ExamResult[], fileBaseName: string): void {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(this.excelService.formatStudentDetailsData(this.student!, results));
        // OOXML запрещает : \ / ? * [ ] в имени листа и ограничивает его 31 символом —
        // без этого длинная фамилия+имя валит book_append_sheet исключением (26.08.2026, п.5).
        const sheetName = `${this.student?.lastName} ${this.student?.firstName}`.replace(/[:\\/?*[\]]/g, '-').slice(0, 31);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
    }

    /**
     * Форматирует достижения студента на основе числовых полей
     */
    formatStudentAchievements(result: any): string {
        const achievements: string[] = [];

        // Проверяем развивающийся студент
        if (result.developmentScore && result.developmentScore > 0) {
            achievements.push('İnkişaf edən şagird');
        }

        // Проверяем студент месяца по району
        if (result.studentOfTheMonthScore && result.studentOfTheMonthScore > 0) {
            achievements.push('Ayın şagirdi');
        }

        // Проверяем студент месяца по республике
        if (result.republicWideStudentOfTheMonthScore && result.republicWideStudentOfTheMonthScore > 0) {
            achievements.push('Respublika üzrə ayın şagirdi');
        }

        return achievements.join(', ');
    }

    /**
     * Opens the edit dialog for a student result
     */
    onEditResult(result: ExamResult): void {
        const dialogRef = this.dialog.open<any>(ResultEditingDialogComponent, {
            width: '900px',
            disableClose: false,
            data: {
                result,
                canDelete: true
            }
        });

        dialogRef.closed.subscribe((response: { action: string, data?: Partial<ExamResult> } | undefined) => {
            if (response?.action === 'save' && response.data) {
                this.updateResult(result.id, response.data);
            } else if (response?.action === 'delete') {
                this.deleteResult(result.id);
            }
        });
    }

    /**
     * Updates a student result via API
     */
    private updateResult(resultId: string | number, editedResult: Partial<ExamResult>): void {
        this.studentService.updateStudentResult(resultId, editedResult).subscribe({
            next: () => {
                console.log('Nəticə uğurla yeniləndi');
                this.loadStudent(); // Reload to show updated data
            },
            error: (error: Error) => {
                console.error('Nəticənin yenilənməsində xəta!', error);
            }
        });
    }

    /**
     * Deletes a student result via API
     */
    private deleteResult(resultId: string | number): void {
        this.studentService.deleteStudentResult(resultId).subscribe({
            next: () => {
                console.log('Nəticə uğurla silindi');
                this.loadStudent(); // Reload to show updated data
            },
            error: (error: Error) => {
                console.error('Nəticənin silinməsində xəta!', error);
            }
        });
    }

    get canEditResults(): boolean {
        const currentUser = this.authService.getCurrentUserValue();
        return currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    }

    // Avatar methods
    /** Ставить/убирать фото ученику: админ-роли, его учитель, директор его школы. Раньше это
     *  делалось с карточки в сетке на главной учителя/директора — переехало сюда
     *  (26.08.2026, п.1). Права проверяются через RBAC-хелпер, а не списком ролей руками —
     *  матрица прав одна на всё приложение (core/config/rbac.config.ts). */
    get canEditAvatar(): boolean {
        if (this.permissions.isAdmin()) return true;
        if (!this.permissions.canShowUI('canManageStudentPhotos')) return false;

        const user = this.authService.getCurrentUserValue();
        if (user?.role === 'teacher') {
            return String(user.profile?.entityId) === String(this.student?.teacher?.id ?? '');
        }
        if (user?.role === 'schoolDirector') {
            return String(user.profile?.entityId) === String(this.student?.school?.id ?? '');
        }
        return false;
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.student?.avatarUrl);
    }

    onAvatarHover(state: boolean): void {
        this.isAvatarHovered = state;
    }

    openAvatarUpload(): void {
        if (!this.canEditAvatar) return;
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: any): void {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            // Check file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.snackBarService.show('Fayl ölçüsü 10MB-dan böyük ola bilməz', 'error');
                return;
            }

            // Check file type
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                this.snackBarService.show('Yalnız JPEG, JPG və PNG formatları qəbul edilir', 'error');
                return;
            }

            this.imageChangedEvent = event;
            this.isCropModalOpen = true;
        }
    }

    closeCropModal(): void {
        this.isCropModalOpen = false;
        this.imageChangedEvent = null;
        // Reset file input
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    onAvatarSave(croppedImage: Blob): void {
        if (!this.student) return;

        this.isUploadingAvatar = true;
        const formData = new FormData();
        formData.append('avatar', croppedImage, 'avatar.jpg');

        this.studentService.uploadAvatar(this.student.id, formData).subscribe({
            next: (response) => {
                if (this.student) {
                    this.student.avatarUrl = response.avatarUrl;
                }
                this.snackBarService.show('Şəkil uğurla yükləndi', 'success');
                this.closeCropModal();
                this.isUploadingAvatar = false;
            },
            error: (error) => {
                console.error('Şəkil yüklənərkən xəta:', error);
                this.snackBarService.show('Şəkil yüklənərkən xəta baş verdi', 'error');
                this.isUploadingAvatar = false;
            }
        });
    }

    deleteAvatar(): void {
        if (!this.student || !this.canEditAvatar) return;

        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Şəkli silmək istədiyinizə əminsiniz?'
            }
        });

        confirmRef.closed.subscribe((confirmed: boolean) => {
            if (confirmed) {
                this.studentService.deleteAvatar(this.student!.id).subscribe({
                    next: () => {
                        if (this.student) {
                            this.student.avatarUrl = undefined;
                        }
                        this.snackBarService.show('Şəkil uğurla silindi', 'success');
                    },
                    error: (error) => {
                        console.error('Şəkil silinərkən xəta:', error);
                        this.snackBarService.show('Şəkil silinərkən xəta baş verdi', 'error');
                    }
                });
            }
        });
    }
}
