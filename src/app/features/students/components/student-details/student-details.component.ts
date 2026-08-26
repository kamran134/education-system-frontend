import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { StudentWithResult } from '../../../../core/models/student.model';
import { Error } from '../../../../core/models/error.model';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
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
        RouterModule,
        LucideAngularModule,
        ButtonComponent,
        ImageCropModalComponent
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

    // Previous results toggle
    showPreviousResults = false;

    // Sertifikat yükləmə — CERTIFICATES_TASK.md §9. Giriş = /students/:id-ə giriş,
    // ayrıca RBAC gate yoxdur (baxın certificate.model.ts).
    certificateAvailability: CertificateAvailabilityMap = {};
    // `${resultId}:${awardCode}` — bir nəticəyə bir neçə mükafat sertifikatı ola bilər,
    // hərəsinin öz yükləmə vəziyyəti olmalıdır.
    downloadingKey: string | null = null;
    readonly certificateAwards = CERTIFICATE_AWARDS;

    private get currentAcademicYearStart(): Date {
        const now = new Date();
        // Academic year starts September 1
        // If current month is before September (0-7), we're still in the year that started last Sept
        const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return new Date(startYear, 8, 1); // Sept 1
    }

    get currentResults(): ExamResult[] {
        const cutoff = this.currentAcademicYearStart;
        return (this.student?.results ?? []).filter(r =>
            r.exam && new Date(r.exam.date) >= cutoff
        );
    }

    get previousResults(): ExamResult[] {
        const cutoff = this.currentAcademicYearStart;
        return (this.student?.results ?? []).filter(r =>
            !r.exam || new Date(r.exam.date) < cutoff
        );
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
                if (this.student) this.loadCertificateAvailability(this.student.id);
            },
            error: (error: Error) => {
                console.error('Şagirdin alınmasında xəta!', error.error);
                this.student = null;
                this.isLoading = false;
            }
        });
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
        if (this.navigationHistory.canGoBack()) {
            this.navigationHistory.back();
            return;
        }
        const backUrl = this.source === 'stats' ? '/stats' : '/students';
        this.router.navigate([backUrl], { queryParams: this.filterParams });
    }

    exportToExcel() {
        const workbook = XLSX.utils.book_new();
        let sheetName: string = '';
        let result: XLSX.WorkSheet = {};

        result = XLSX.utils.json_to_sheet(this.excelService.formatStudentDetailsData(this.student!));
        // OOXML запрещает : \ / ? * [ ] в имени листа и ограничивает его 31 символом —
        // без этого длинная фамилия+имя валит book_append_sheet исключением (26.08.2026, п.5).
        sheetName = `${this.student?.lastName} ${this.student?.firstName}`.replace(/[:\\/?*[\]]/g, '-').slice(0, 31);

        if (!result) {
            console.error('Xəta: Excel cədvəli yaradılmadı!');
            return;
        }

        // this.excelService.formatHeaders(result);
        XLSX.utils.book_append_sheet(workbook, result, sheetName);
        XLSX.writeFile(workbook, `${this.student?.code}.xlsx`);
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
