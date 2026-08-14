import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Edit2, Loader, User } from 'lucide-angular';
import { TeacherService } from '../../services/teacher.service';
import { Teacher } from '../../../../core/models/teacher.model';
import { AuthService } from '../../../../core/services/auth.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';

@Component({
    selector: 'app-teacher-profile',
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, ButtonComponent, InputComponent],
    templateUrl: './teacher-profile.component.html',
    styleUrl: './teacher-profile.component.scss'
})
export class TeacherProfileComponent implements OnInit {
    teacherId!: string;
    teacher: Teacher | null = null;
    isLoading = true;

    isEditing = false;
    isSaving = false;
    editedBiography: string | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Edit2 = Edit2;
    readonly Loader = Loader;
    readonly User = User;

    private destroyRef = inject(DestroyRef);

    constructor(
        private teacherService: TeacherService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.teacherId = params['id'];
            this.loadTeacher();
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
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Müəllim tapılmadı', 'error');
                }
            });
    }

    get canEdit(): boolean {
        const user = this.authService.getCurrentUserValue();
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        return user.role === 'teacher' && String(user.profile?.entityId) === String(this.teacherId);
    }

    startEdit(): void {
        this.editedBiography = this.teacher?.biography ?? '';
        this.isEditing = true;
    }

    cancelEdit(): void {
        this.isEditing = false;
        this.editedBiography = null;
    }

    save(): void {
        if (!this.teacher) return;
        this.isSaving = true;
        this.teacherService.updateTeacherProfile(this.teacherId, { biography: this.editedBiography || null })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.teacher = updated;
                    this.isSaving = false;
                    this.isEditing = false;
                    this.snackBarService.show('Profil uğurla yeniləndi', 'success');
                },
                error: () => {
                    this.isSaving = false;
                    this.snackBarService.show('Profil yenilənərkən xəta baş verdi', 'error');
                }
            });
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
