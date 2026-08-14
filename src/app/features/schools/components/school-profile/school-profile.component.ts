import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Edit2, Loader, Building2 } from 'lucide-angular';
import { SchoolService } from '../../services/school.service';
import { School } from '../../../../core/models/school.model';
import { AuthService } from '../../../../core/services/auth.service';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';

@Component({
    selector: 'app-school-profile',
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, ButtonComponent, InputComponent],
    templateUrl: './school-profile.component.html',
    styleUrl: './school-profile.component.scss'
})
export class SchoolProfileComponent implements OnInit {
    schoolId!: string;
    school: School | null = null;
    isLoading = true;

    isEditing = false;
    isSaving = false;
    editedDescription: string | null = null;
    editedHistory: string | null = null;

    readonly ArrowLeft = ArrowLeft;
    readonly Edit2 = Edit2;
    readonly Loader = Loader;
    readonly Building2 = Building2;

    private destroyRef = inject(DestroyRef);

    constructor(
        private schoolService: SchoolService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            this.schoolId = params['id'];
            this.loadSchool();
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
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Məktəb tapılmadı', 'error');
                }
            });
    }

    get canEdit(): boolean {
        const user = this.authService.getCurrentUserValue();
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        return user.role === 'schoolDirector' && String(user.profile?.entityId) === String(this.schoolId);
    }

    startEdit(): void {
        this.editedDescription = this.school?.description ?? '';
        this.editedHistory = this.school?.history ?? '';
        this.isEditing = true;
    }

    cancelEdit(): void {
        this.isEditing = false;
        this.editedDescription = null;
        this.editedHistory = null;
    }

    save(): void {
        if (!this.school) return;
        this.isSaving = true;
        this.schoolService.updateSchoolProfile(this.schoolId, {
            description: this.editedDescription || null,
            history: this.editedHistory || null,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    this.school = updated;
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
