import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LucideAngularModule, Camera } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfigService } from '../../../../core/services/config.service';
import { ProfileSummary } from '../../../../core/models/auth.models';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { SchoolService } from '../../../schools/services/school.service';
import { DistrictService } from '../../../districts/services/district.service';
import { RegionService } from '../../../regions/services/region.service';
import { ImageCropModalComponent } from '../../../../shared/components/modals/image-crop-modal/image-crop-modal.component';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';

/** Роли, у которых фото — широкий баннер школы/района/региона, а не портрет. */
const BANNER_ROLES = ['schoolDirector', 'districtRepresenter', 'regionRepresenter'];
/** Роли с самообслуживанием загрузки фото (студенческий аватар остаётся админским). */
const UPLOADABLE_ROLES = ['teacher', 'schoolDirector', 'districtRepresenter', 'regionRepresenter'];

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, ImageCropModalComponent],
    templateUrl: './profile-header.component.html',
    styleUrl: './profile-header.component.scss'
})
export class ProfileHeaderComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    readonly Camera = Camera;

    role: string | null = null;
    profile: ProfileSummary | null = null;

    isCropModalOpen = false;
    imageChangedEvent: any = null;
    isUploading = false;

    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private teacherService: TeacherService,
        private schoolService: SchoolService,
        private districtService: DistrictService,
        private regionService: RegionService,
        private snackBarService: SnackBarService
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUserValue();
        this.role = user?.role ?? null;
        this.profile = user?.profile ?? null;
    }

    get avatarUrl(): string | null {
        return this.configService.resolveAssetUrl(this.profile?.avatarUrl);
    }

    get isBanner(): boolean {
        return !!this.role && BANNER_ROLES.includes(this.role);
    }

    get canUpload(): boolean {
        return !!this.role && UPLOADABLE_ROLES.includes(this.role);
    }

    get aspectRatio(): number {
        return this.isBanner ? 3 : 3 / 4;
    }

    get resizeToWidth(): number {
        return this.isBanner ? 1600 : 600;
    }

    get gradeLabel(): string {
        return this.profile?.grade != null ? `${this.profile.grade}-ci sinif` : '';
    }

    openFilePicker(): void {
        if (!this.canUpload) return;
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];

        if (file.size > 10 * 1024 * 1024) {
            this.snackBarService.show('Fayl ölçüsü 10MB-dan böyük ola bilməz', 'error');
            return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            this.snackBarService.show('Yalnız JPEG, JPG və PNG formatları qəbul edilir', 'error');
            return;
        }

        this.imageChangedEvent = event;
        this.isCropModalOpen = true;
    }

    closeCropModal(): void {
        this.isCropModalOpen = false;
        this.imageChangedEvent = null;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    onAvatarSave(croppedImage: Blob): void {
        if (!this.profile || !this.role) return;

        const upload$ = this.uploadForRole(this.role, this.profile.entityId, croppedImage);
        if (!upload$) return;

        this.isUploading = true;
        upload$.subscribe({
            next: (response) => {
                if (this.profile) {
                    this.profile.avatarUrl = response.avatarUrl;
                }
                this.snackBarService.show('Şəkil uğurla yükləndi', 'success');
                this.closeCropModal();
                this.isUploading = false;
            },
            error: (error) => {
                console.error('Şəkil yüklənərkən xəta:', error);
                this.snackBarService.show('Şəkil yüklənərkən xəta baş verdi', 'error');
                this.isUploading = false;
            }
        });
    }

    private uploadForRole(role: string, entityId: number, croppedImage: Blob): Observable<{ avatarUrl: string }> | null {
        const formData = new FormData();
        formData.append('avatar', croppedImage, 'avatar.jpg');

        switch (role) {
            case 'teacher': return this.teacherService.uploadAvatar(entityId, formData);
            case 'schoolDirector': return this.schoolService.uploadAvatar(entityId, formData);
            case 'districtRepresenter': return this.districtService.uploadAvatar(entityId, formData);
            case 'regionRepresenter': return this.regionService.uploadAvatar(entityId, formData);
            default: return null;
        }
    }
}
