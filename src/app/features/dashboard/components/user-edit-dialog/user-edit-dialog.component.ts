import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserEdit } from '../../../../core/models/user.model';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { StudentService } from '../../../students/services/student.service';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { Student } from '../../../../core/models/student.model';
import { connectDebounce } from '../../../../core/utils/debounce.util';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, Eye, EyeOff, KeyRound } from 'lucide-angular';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-user-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent,
        SelectComponent,
        LucideAngularModule
    ],
    templateUrl: './user-edit-dialog.component.html',
    styleUrl: './user-edit-dialog.component.scss'
})
export class UserEditDialogComponent implements OnInit, OnDestroy {
    repeatedPassword: string = '';
    emailPattern: string = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    // Password visibility
    showPassword = false;
    showRepeatedPassword = false;
    showNewPasswordForEdit = false;
    showConfirmNewPasswordForEdit = false;

    // Change password in edit mode
    isChangingPassword = false;
    newPasswordForEdit = '';
    confirmedNewPasswordForEdit = '';
    isPasswordChanging = false;

    // Icons
    readonly Eye = Eye;
    readonly EyeOff = EyeOff;
    readonly KeyRound = KeyRound;

    // Search fields
    districtSearchTerm: string = '';
    schoolSearchTerm: string = '';
    teacherSearchTerm: string = '';
    studentSearchTerm: string = '';

    // Search results
    districtOptions: SelectOption[] = [];
    schoolOptions: SelectOption[] = [];
    teacherOptions: SelectOption[] = [];
    studentOptions: SelectOption[] = [];

    // Search subjects for debounce
    private districtSearch$ = new Subject<string>();
    private schoolSearch$ = new Subject<string>();
    private teacherSearch$ = new Subject<string>();
    private studentSearch$ = new Subject<string>();

    // Destroy subject to unsubscribe all observables
    private destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<UserEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dataSource: UserEdit,
        private authService: AuthService,
        private matSnackBar: MatSnackBar,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private dashboardService: DashboardService
    ) {}

    ngOnInit(): void {
        connectDebounce(this.districtSearch$, term => this.searchDistricts(term), this.destroy$);
        connectDebounce(this.schoolSearch$, term => this.searchSchools(term), this.destroy$);
        connectDebounce(this.teacherSearch$, term => this.searchTeachers(term), this.destroy$);
        connectDebounce(this.studentSearch$, term => this.searchStudents(term), this.destroy$);

        // Load existing entity data for editing
        this.loadExistingEntityData();
    }

    ngOnDestroy(): void {
        // Complete all subscriptions
        this.destroy$.next();
        this.destroy$.complete();

        // Complete search subjects
        this.districtSearch$.complete();
        this.schoolSearch$.complete();
        this.teacherSearch$.complete();
        this.studentSearch$.complete();
    }

    /**
     * Loads the names of existing entities (district, school, teacher, student)
     * when editing a user, so they appear in the search fields.
     * Loads only the entity that matches the user's role.
     */
    private loadExistingEntityData(): void {
        // Load only the entity that corresponds to the user's role
        console.log('Loading entity for role:', this.dataSource.role, 'User data:', {
            districtId: this.dataSource.districtId,
            schoolId: this.dataSource.schoolId,
            teacherId: this.dataSource.teacherId,
            studentId: this.dataSource.studentId
        });

        switch (this.dataSource.role) {
            case 'districtRepresenter':
                if (this.dataSource.districtId) {
                    this.districtService.getDistrictById(this.dataSource.districtId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (district: any) => {
                                if (district) {
                                    this.districtSearchTerm = district.name;
                                }
                            },
                            error: (error) => console.error('Error loading district:', error)
                        });
                }
                break;

            case 'schoolDirector':
                if (this.dataSource.schoolId) {
                    this.schoolService.getSchoolById(this.dataSource.schoolId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (school: any) => {
                                if (school) {
                                    this.schoolSearchTerm = `${school.name} (${school.code})`;
                                }
                            },
                            error: (error) => console.error('Error loading school:', error)
                        });
                }
                break;

            case 'teacher':
                if (this.dataSource.teacherId) {
                    this.teacherService.getTeacherById(this.dataSource.teacherId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (teacher: any) => {
                                if (teacher) {
                                    this.teacherSearchTerm = `${teacher.fullname} (${teacher.code})`;
                                }
                            },
                            error: (error) => console.error('Error loading teacher:', error)
                        });
                }
                break;

            case 'student':
                if (this.dataSource.studentId) {
                    this.studentService.getStudentById(this.dataSource.studentId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (response: any) => {
                                // getStudentById returns student with results, extract student data
                                const student = response.student || response;
                                if (student) {
                                    this.studentSearchTerm = `${student.lastName} ${student.firstName} ${student.middleName} (${student.code})`;
                                }
                            },
                            error: (error) => console.error('Error loading student:', error)
                        });
                }
                break;

            // For superadmin, admin, moderator - no entity to load
            default:
                break;
        }
    }

    get modalTitle(): string {
        if (this.isNewUser()) {
            return 'Yeni istifadəçi əlavə et';
        }

        // Show role-specific title when editing
        const roleTitles: Record<string, string> = {
            'superadmin': 'Super Admin',
            'admin': 'Admin',
            'moderator': 'Moderator',
            'districtRepresenter': 'Rayon nümayəndəsi',
            'schoolDirector': 'Məktəb direktoru',
            'teacher': 'Müəllim',
            'student': 'Şagird'
        };

        const roleTitle = roleTitles[this.dataSource.role] || 'İstifadəçi';
        return `${roleTitle}nin redaktə edilməsi`;
    }

    get modalSubtitle(): string {
        if (this.isNewUser()) {
            return 'İstifadəçinin məlumatlarını daxil edin';
        }

        // Show role-specific subtitle when editing
        const roleSubtitles: Record<string, string> = {
            'superadmin': 'Super Admin məlumatlarını redaktə edin',
            'admin': 'Admin məlumatlarını redaktə edin',
            'moderator': 'Moderator məlumatlarını redaktə edin',
            'districtRepresenter': 'Rayon nümayəndəsinin məlumatlarını redaktə edin',
            'schoolDirector': 'Məktəb direktorunun məlumatlarını redaktə edin',
            'teacher': 'Müəllimin məlumatlarını redaktə edin',
            'student': 'Şagirdin məlumatlarını redaktə edin'
        };

        return roleSubtitles[this.dataSource.role] || 'İstifadəçinin məlumatlarını redaktə edin';
    }

    get roleOptions(): SelectOption[] {
        const isSuperAdmin = this.authService.isSuperAdmin();
        const options: SelectOption[] = [
            { value: 'admin', label: 'Admin' },
            { value: 'moderator', label: 'Moderator' },
            { value: 'districtRepresenter', label: 'Rayon nümayəndəsi' },
            { value: 'schoolDirector', label: 'Məktəb direktoru' },
            { value: 'teacher', label: 'Müəllim' },
            { value: 'student', label: 'Şagird' }
        ];

        // Only superadmin can create superadmin
        if (isSuperAdmin) {
            options.unshift({ value: 'superadmin', label: 'Super Admin' });
        }

        return options;
    }

    get needsDistrictSelection(): boolean {
        return this.dataSource.role === 'districtRepresenter';
    }

    get needsSchoolSelection(): boolean {
        return this.dataSource.role === 'schoolDirector';
    }

    get needsTeacherSelection(): boolean {
        return this.dataSource.role === 'teacher';
    }

    get needsStudentSelection(): boolean {
        return this.dataSource.role === 'student';
    }

    get isFormValid(): boolean {
        const basicValidation = !!(
            this.dataSource.email?.trim() &&
            this.dataSource.role &&
            this.dataSource.isApproved !== undefined
        );

        if (this.isNewUser()) {
            const passwordValid = !!(this.dataSource.password?.trim()) &&
                                  this.dataSource.password.length >= 6 &&
                                  this.dataSource.password === this.repeatedPassword;

            if (!basicValidation || !passwordValid) {
                return false;
            }
        } else {
            if (!basicValidation) {
                return false;
            }
        }

        // Role-specific validation
        if (this.needsDistrictSelection && !this.dataSource.districtId) {
            return false;
        }

        if (this.needsSchoolSelection && !this.dataSource.schoolId) {
            return false;
        }

        if (this.needsTeacherSelection && !this.dataSource.teacherId) {
            return false;
        }

        if (this.needsStudentSelection && !this.dataSource.studentId) {
            return false;
        }

        return true;
    }

    get modalButtons(): ModalButton[] {
        return [
            {
                label: 'Ləğv et',
                variant: 'outline',
                action: () => this.onClose()
            },
            {
                label: 'Yadda saxla',
                variant: 'primary',
                disabled: !this.isFormValid,
                action: () => this.onSave()
            }
        ];
    }

    isSuperAdmin(): boolean {
        return this.authService.isSuperAdmin();
    }

    isNewUser(): boolean {
        return !this.dataSource.id;
    }

    // Search methods
    onDistrictSearchChange(term: string): void {
        this.districtSearch$.next(term);
    }

    onSchoolSearchChange(term: string): void {
        this.schoolSearch$.next(term);
    }

    onTeacherSearchChange(term: string): void {
        this.teacherSearch$.next(term);
    }

    onStudentSearchChange(term: string): void {
        this.studentSearch$.next(term);
    }

    // Select handlers for autocomplete items
    selectDistrict(option: { value: string; label: string }): void {
        this.dataSource.districtId = option.value as any;
        this.districtSearchTerm = option.label;
        this.districtOptions = [];
    }

    selectSchool(option: { value: string; label: string }): void {
        this.dataSource.schoolId = option.value as any;
        this.schoolSearchTerm = option.label;
        this.schoolOptions = [];
    }

    selectTeacher(option: { value: string; label: string }): void {
        this.dataSource.teacherId = option.value as any;
        this.teacherSearchTerm = option.label;
        this.teacherOptions = [];
    }

    selectStudent(option: { value: string; label: string }): void {
        this.dataSource.studentId = option.value as any;
        this.studentSearchTerm = option.label;
        this.studentOptions = [];
    }

    private searchDistricts(term: string): void {
        if (!term || term.length < 2) {
            this.districtOptions = [];
            return;
        }

        // Use `search` param (name) for autocomplete-friendly backend queries
        this.districtService.getDistricts({ search: term, sortColumn: 'name', sortDirection: 'asc' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const districts = response.data || [];
                    this.districtOptions = districts.map((d: District) => ({
                        value: d.id,
                        label: `${d.name}`
                    }));
                },
                error: (error) => {
                    console.error('District search error:', error);
                    this.districtOptions = [];
                }
            });
    }

    private searchSchools(term: string): void {
        if (!term || term.length < 2) {
            this.schoolOptions = [];
            return;
        }

        // Use `search` param to look up schools by name
        this.schoolService.getSchools({ search: term, sortColumn: 'name', sortDirection: 'asc' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const schools = response.data || [];
                    this.schoolOptions = schools.map((s: School) => ({
                        value: s.id,
                        label: `${s.name} (${s.code})`
                    }));
                },
                error: (error) => {
                    console.error('School search error:', error);
                    this.schoolOptions = [];
                }
            });
    }

    private searchTeachers(term: string): void {
        if (!term || term.length < 2) {
            this.teacherOptions = [];
            return;
        }

        // Use `search` param to match teacher fullnames
        this.teacherService.getTeachers({ search: term, sortColumn: 'fullname', sortDirection: 'asc' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const teachers = response.data || [];
                    this.teacherOptions = teachers.map((t: Teacher) => ({
                        value: t.id,
                        label: `${t.fullname} (${t.code})`
                    }));
                },
                error: (error) => {
                    console.error('Teacher search error:', error);
                    this.teacherOptions = [];
                }
            });
    }

    private searchStudents(term: string): void {
        if (!term || term.length < 2) {
            this.studentOptions = [];
            return;
        }

        this.studentService.searchStudents(term)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    // Response is already extracted by ResponseHandlerUtil
                    // It should be an array of students directly
                    const students = Array.isArray(response) ? response : (response.data || []);
                    console.log('Student search response:', students);
                    this.studentOptions = students.map((s: Student) => ({
                        value: s.id,
                        label: `${s.lastName} ${s.firstName} ${s.middleName} (${s.code})`
                    }));
                },
                error: (error) => {
                    console.error('Student search error:', error);
                    this.studentOptions = [];
                }
            });
    }

    get isPasswordChangeFormValid(): boolean {
        return this.newPasswordForEdit.length >= 6 &&
               this.newPasswordForEdit === this.confirmedNewPasswordForEdit;
    }

    onChangePassword(): void {
        if (!this.isPasswordChangeFormValid) {
            if (this.newPasswordForEdit.length < 6) {
                this.matSnackBar.open('Şifrə ən az 6 simvol olmalıdır!', '', this.matSnackConfig);
            } else {
                this.matSnackBar.open('Şifrələr uyğun gəlmir!', '', this.matSnackConfig);
            }
            return;
        }

        this.isPasswordChanging = true;
        this.dashboardService.changeUserPassword(this.dataSource.id!, this.newPasswordForEdit)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.matSnackBar.open('Şifrə uğurla dəyişdirildi', '', this.matSnackConfig);
                    this.isChangingPassword = false;
                    this.newPasswordForEdit = '';
                    this.confirmedNewPasswordForEdit = '';
                    this.isPasswordChanging = false;
                },
                error: (error) => {
                    this.matSnackBar.open(error.message || 'Şifrə dəyişdirilmədi', '', this.matSnackConfig);
                    this.isPasswordChanging = false;
                }
            });
    }

    onSave(): void {
        if (this.isNewUser()) {
            // Create new user logic
            if (!this.dataSource.email || !this.dataSource.password) {
                this.matSnackBar.open('Email və şifrə mütləqdir!', '', this.matSnackConfig);
                return;
            }
            if (this.dataSource.password.length < 6) {
                this.matSnackBar.open('Şifrə ən az 6 simvol olmalıdır!', '', this.matSnackConfig);
                return;
            }
            if (this.dataSource.password !== this.repeatedPassword) {
                this.matSnackBar.open('Şifrələr uyğun gəlmir!', '', this.matSnackConfig);
                return;
            }
            if (!this.dataSource.role) {
                this.matSnackBar.open('Rol seçilməlidir!', '', this.matSnackConfig);
                return;
            }
        }

        if (this.dataSource.email && !new RegExp(this.emailPattern).test(this.dataSource.email)) {
            this.matSnackBar.open('Email formatı düzgün deyil!', '', this.matSnackConfig);
            return;
        }
        if (!this.dataSource.email) {
            this.matSnackBar.open('Email mütləqdir!', '', this.matSnackConfig);
            return;
        }

        // Validate role-specific fields
        if (this.needsDistrictSelection && !this.dataSource.districtId) {
            this.matSnackBar.open('Rayon nümayəndəsi üçün rayon seçilməlidir!', '', this.matSnackConfig);
            return;
        }

        if (this.needsSchoolSelection && !this.dataSource.schoolId) {
            this.matSnackBar.open('Məktəb direktoru üçün məktəb seçilməlidir!', '', this.matSnackConfig);
            return;
        }

        if (this.needsTeacherSelection && !this.dataSource.teacherId) {
            this.matSnackBar.open('Müəllim üçün müəllim profili seçilməlidir!', '', this.matSnackConfig);
            return;
        }

        if (this.needsStudentSelection && !this.dataSource.studentId) {
            this.matSnackBar.open('Şagird üçün şagird profili seçilməlidir!', '', this.matSnackConfig);
            return;
        }

        this.dialogRef.close(this.dataSource);
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
