import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { StudentWithResult } from '../../../../core/models/student.model';
import { Error } from '../../../../core/models/error.model';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { LucideAngularModule, ArrowLeft, Download, Loader, Edit2, User, Trash2 } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { MatDialog } from '@angular/material/dialog';
import { ResultEditingDialogComponent } from '../result-editing/result-editing-dialog.component';
import { ExamResult } from '../../../../core/models/examResult.model';
import { ImageCropModalComponent } from '../../../../shared/components/modals/image-crop-modal/image-crop-modal.component';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-student-details',
    standalone: true,
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

    // Icons
    readonly ArrowLeft = ArrowLeft;
    readonly Download = Download;
    readonly Loader = Loader;
    readonly Edit2 = Edit2;
    readonly User = User;
    readonly Trash2 = Trash2;

    constructor(
        private studentService: StudentService,
        private route: ActivatedRoute,
        private router: Router,
        private excelService: ExcelService,
        private dialog: MatDialog,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.studentId = params['id']!;
            this.loadStudent();
        });

        this.route.queryParams.subscribe((params: Params) => {
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
            },
            error: (error: Error) => {
                console.error('Şagirdin alınmasında xəta!', error.error);
                this.student = null;
                this.isLoading = false;
            }
        });
    }

    goBack(): void {
        const backUrl = this.source === 'stats' ? '/stats' : '/students';
        this.router.navigate([backUrl], { queryParams: this.filterParams });
    }

    exportToExcel() {
        const workbook = XLSX.utils.book_new();
        let sheetName: string = '';
        let result: XLSX.WorkSheet = {};

        result = XLSX.utils.json_to_sheet(this.excelService.formatStudentDetailsData(this.student!));
        sheetName = `${this.student?.lastName} ${this.student?.firstName}`;

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
        const dialogRef = this.dialog.open(ResultEditingDialogComponent, {
            width: '900px',
            disableClose: false,
            data: { 
                result,
                canDelete: true
            }
        });

        dialogRef.afterClosed().subscribe((response: { action: string, data?: Partial<ExamResult> } | undefined) => {
            if (response?.action === 'save' && response.data) {
                this.updateResult(result._id, response.data);
            } else if (response?.action === 'delete') {
                this.deleteResult(result._id);
            }
        });
    }

    /**
     * Updates a student result via API
     */
    private updateResult(resultId: string, editedResult: Partial<ExamResult>): void {
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
    private deleteResult(resultId: string): void {
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

    // Avatar methods
    get canEditAvatar(): boolean {
        const currentUser = this.authService.getCurrentUserValue();
        return currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    }

    get avatarUrl(): string | null {
        if (!this.student?.avatarUrl) return null;
        return `${environment.apiUrl}${this.student.avatarUrl}`;
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
            
            // Check file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Fayl ölçüsü 5MB-dan böyük ola bilməz');
                return;
            }

            // Check file type
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                alert('Yalnız JPEG, JPG və PNG formatları qəbul edilir');
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

        this.studentService.uploadAvatar(this.student._id, formData).subscribe({
            next: (response) => {
                if (this.student) {
                    this.student.avatarUrl = response.avatarUrl;
                }
                alert('Avatar uğurla yükləndi');
                this.closeCropModal();
                this.isUploadingAvatar = false;
            },
            error: (error) => {
                console.error('Avatar yüklənərkən xəta:', error);
                alert('Avatar yüklənərkən xəta baş verdi');
                this.isUploadingAvatar = false;
            }
        });
    }

    deleteAvatar(): void {
        if (!this.student || !this.canEditAvatar) return;

        if (!confirm('Avatarı silmək istədiyinizə əminsiniz?')) return;

        this.studentService.deleteAvatar(this.student._id).subscribe({
            next: () => {
                if (this.student) {
                    this.student.avatarUrl = undefined;
                }
                alert('Avatar uğurla silindi');
            },
            error: (error) => {
                console.error('Avatar silinərkən xəta:', error);
                alert('Avatar silinərkən xəta baş verdi');
            }
        });
    }
}
