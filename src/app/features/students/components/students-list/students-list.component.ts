import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { Dialog } from '@angular/cdk/dialog';
import { Subject, takeUntil } from 'rxjs';

// Core models and services
import { Student } from '../../../../core/models/student.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';

// Services
import { StudentService } from '../../services/student.service';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { IdUtil } from '../../../../core/utils/id.util';
import { connectSearchDebounce } from '../../../../core/utils/debounce.util';

// UI Components
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, Settings, ChevronDown, ChevronUp, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

// Dialogs
import { StudentEditingDialogComponent } from '../student-editing/student-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { BulkAvatarUploadModalComponent } from '../../../../shared/components/modals/bulk-avatar-upload-modal/bulk-avatar-upload-modal.component';

@Component({
    selector: 'app-students-list',
    imports: [
    FormsModule,
    RouterModule,
    LucideAngularModule,
    ListLayoutComponent,
    DataTableComponent,
    SelectComponent,
    BulkAvatarUploadModalComponent
],
    templateUrl: './students-list.component.html',
    styleUrls: ['./students-list.component.scss']
})
export class StudentsListComponent implements OnInit, OnDestroy {
    // Data
    students: Student[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];

    // State
    isLoading = false;
    hasError = false;
    errorMessage = '';

    // Pagination
    totalCount = 0;
    pageSize = 1000;
    pageIndex = 0;

    // Sorting
    sortColumn = 'lastName';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filters
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    searchString: string = '';
    checkedDefective: boolean = false;
    teacherId: string | null = null;

    // Search debounce
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private isSearching = false;

    // Filter options
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    districtOptions: SelectOption[] = [];
    schoolOptions: SelectOption[] = [];
    teacherOptions: SelectOption[] = [];
    gradeOptions: SelectOption[] = [];

    // UI State
    filtersExpanded = false;
    isBulkUploadModalOpen = false;

    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'İş nömrəsi', sortable: true, type: 'text' },
        { key: 'lastName', label: 'Soyadı', sortable: true, type: 'text' },
        { key: 'firstName', label: 'Adı', sortable: true, type: 'text' },
        { key: 'middleName', label: 'Ata adı', sortable: true, type: 'text' },
        { key: 'grade', label: 'Sinif', sortable: true, type: 'number' },
        { key: 'teacher.fullname', label: 'Müəllimi', sortable: false, type: 'text' },
        { key: 'school.name', label: 'Məktəbi', sortable: false, type: 'text' },
        { key: 'district.name', label: 'Rayonu / şəhəri', sortable: false, type: 'text' }
    ];

    tableActions: TableAction[] = [
        {
            key: 'edit',
            label: 'Düzəliş et',
            icon: Edit,
            variant: 'primary',
            condition: () => this.authService.canEditStudents()
        }
    ];

    actionButtons: ActionButton[] = [];
    backButton?: BackButton;

    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly Settings = Settings;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    readonly ArrowLeft = ArrowLeft;
    readonly Trash = Trash;

    constructor(
        private authService: AuthService,
        private studentService: StudentService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private dialog: Dialog,
        private toastService: ToastService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.setupGradeOptions();
        this.setupSearchDebounce();

        // Check if we're viewing students for a specific teacher
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.teacherId = params['id'];
            if (this.teacherId) {
                this.selectedTeacherIds = [this.teacherId];
            }
            // Setup buttons after we know if teacherId exists
            this.setupActionButtons();
        });

        // Restore state from query parameters if coming back
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
            // Restore pagination
            if (queryParams['pageIndex'] !== undefined) {
                this.pageIndex = parseInt(queryParams['pageIndex']) || 0;
            }
            if (queryParams['pageSize'] !== undefined) {
                this.pageSize = parseInt(queryParams['pageSize']) || 1000;
            }

            // Restore filters from query params (for display purposes)
            if (queryParams['districtIds']) {
                this.selectedDistrictIds = queryParams['districtIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['schoolIds']) {
                this.selectedSchoolIds = queryParams['schoolIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['teacherIds'] && !this.teacherId) {
                // Only restore teacherIds filter if not viewing specific teacher's students
                this.selectedTeacherIds = queryParams['teacherIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['grades']) {
                this.selectedGrades = queryParams['grades'].split(',').map((g: string) => parseInt(g)).filter((g: number) => !isNaN(g));
            }
            if (queryParams['search']) {
                this.searchString = queryParams['search'];
            }
            if (queryParams['defective'] !== undefined) {
                this.checkedDefective = queryParams['defective'] === 'true';
            }

            // Load districts first, then cascade load schools and teachers if needed
            this.loadDistricts();

            // After districts loaded, cascade load schools and teachers based on restored filters
            if (this.selectedDistrictIds.length > 0) {
                this.loadSchools();

                // If schools are selected, load teachers too
                if (this.selectedSchoolIds.length > 0) {
                    this.loadTeachers();
                }
            }

            // Trigger initial data load through search subject if search exists, otherwise direct load
            if (this.searchString) {
                this.searchSubject.next(this.searchString);
            } else {
                this.loadStudents();
            }
        });
    }

    private setupActionButtons(): void {
        this.actionButtons = [];

        // Setup back button - always show it
        this.backButton = {
            show: true,
            action: () => this.goBack()
        };

        if (this.authService.canCreateStudents()) {
            this.actionButtons.push({
                label: 'Şagird əlavə et',
                icon: this.Plus,
                action: () => this.onStudentCreate(),
                variant: 'primary'
            });
        }

        if (this.isAdminOrSuperAdmin()) {
            this.actionButtons.push(
                {
                    label: 'Fayldan əlavə et',
                    icon: this.Upload,
                    action: () => this.onFileUpload(),
                    variant: 'secondary'
                },
                {
                    label: 'Şagirdlərin şəkillərini yüklə',
                    icon: this.Upload,
                    action: () => this.openBulkUploadModal(),
                    variant: 'secondary'
                },
                {
                    label: 'Qüsurları düzəlt',
                    icon: this.Settings,
                    action: () => this.onStudentsRepair(),
                    variant: 'secondary'
                }
            );
        }

        if (this.authService.canDeleteStudents() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Ekranda olanları sil',
                icon: this.Trash,
                action: () => this.onAllStudentsDelete(),
                variant: 'secondary',
                showOnHover: true
            });
        }
    }

    private setupGradeOptions(): void {
        this.gradeOptions = this.gradesOptions.map(grade => ({
            value: grade,
            label: grade.toString()
        }));
    }

    private setupSearchDebounce(): void {
        connectSearchDebounce(this.searchSubject, searchTerm => {
            this.searchString = searchTerm;
            this.pageIndex = 0;
            this.loadStudents();
        }, this.destroy$);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    onFilterChange(filterData: any): void {
        // Handle district filter change
        if (filterData.districts !== undefined) {
            this.selectedDistrictIds = filterData.districts || [];
            this.selectedSchoolIds = []; // Clear school selection when districts change
            this.selectedTeacherIds = []; // Clear teacher selection when districts change
            this.loadSchools(); // Reload schools for selected districts
        }

        // Handle school filter change
        if (filterData.schools !== undefined) {
            this.selectedSchoolIds = filterData.schools || [];
            this.selectedTeacherIds = []; // Clear teacher selection when schools change
            this.loadTeachers(); // Reload teachers for selected schools
        }

        // Handle teacher filter change
        if (filterData.teachers !== undefined) {
            this.selectedTeacherIds = filterData.teachers || [];
        }

        // Handle other filters
        if (filterData.grades !== undefined) {
            this.selectedGrades = filterData.grades || [];
        }

        if (filterData.search !== undefined) {
            // Emit to subject instead of directly loading
            this.searchSubject.next(filterData.search || '');
            return; // Don't call loadStudents, let the debounce handle it
        }

        if (filterData.defective !== undefined) {
            this.checkedDefective = filterData.defective || false;
        }

        // Reset pagination and reload data
        this.pageIndex = 0;
        this.loadStudents();
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onStudentUpdate(event.item);
                break;
        }
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadStudents();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0; // Reset to first page
        this.loadStudents();
    }

    goBack(): void {
        this.route.queryParams.subscribe(params => {
            const queryParams: any = {};

            // Preserve all previous states
            if (params['districtPage'] !== undefined) {
                queryParams.districtPage = params['districtPage'];
            }
            if (params['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = params['districtPageSize'];
            }
            if (params['schoolPage'] !== undefined) {
                queryParams.schoolPage = params['schoolPage'];
            }
            if (params['schoolPageSize'] !== undefined) {
                queryParams.schoolPageSize = params['schoolPageSize'];
            }
            if (params['teacherPage'] !== undefined) {
                queryParams.teacherPage = params['teacherPage'];
            }
            if (params['teacherPageSize'] !== undefined) {
                queryParams.teacherPageSize = params['teacherPageSize'];
            }
            if (params['selectedDistrictIds']) {
                queryParams.selectedDistrictIds = params['selectedDistrictIds'];
            }
            if (params['selectedSchoolIds']) {
                queryParams.selectedSchoolIds = params['selectedSchoolIds'];
            }
            if (params['fromSchoolId']) {
                queryParams.fromSchoolId = params['fromSchoolId'];
            }
            if (params['fromDistrictId']) {
                queryParams.fromDistrictId = params['fromDistrictId'];
            }

            // Check if we came from a specific teacher (via route param)
            if (this.teacherId) {
                // Go back to teachers list
                this.router.navigate(['/teachers'], { queryParams });
            } else {
                // Otherwise, go to home page
                this.router.navigate(['/']);
            }
        });
    }

    onFileUpload(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';

        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.studentService.uploadFile(file).subscribe({
                    next: (response: any) => {
                        this.toastService.show(response.message || 'Fayl uğurla yükləndi', 'success');
                        this.loadStudents();
                    },
                    error: (err: any) => {
                        this.toastService.show(`Fayl yüklənməsində xəta!\n${err.message}`, 'error');
                    }
                });
            }
        };

        input.click();
    }

    loadStudents(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds.join(",") : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds.join(",") : undefined,
            teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds.join(",") : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(",") : undefined,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
            search: this.searchString || undefined
        };

        this.isLoading = true;
        this.studentService.getStudents(params).subscribe({
            next: (response: any) => {
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                this.students = paginatedData.data;
                this.totalCount = paginatedData.totalCount;
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Error fetching students: ${err.message}`;
            }
        });
    }

    loadDistricts(): void {
        this.districtService.getDistrictsForFilter().subscribe({
            next: (districts: any) => {
                this.districts = districts || [];
                this.districtOptions = this.districts.map(district => ({
                    value: district.id,
                    label: district.name
                }));
            },
            error: (err: any) => {
                console.error('Error loading districts:', err);
            }
        });
    }

    loadSchools(): void {
        if (this.selectedDistrictIds.length === 0) {
            this.schools = [];
            this.schoolOptions = [];
            return;
        }

        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(",")
        };

        this.schoolService.getSchoolsForFilter(params).subscribe({
            next: (schools: any) => {
                this.schools = schools || [];
                this.schoolOptions = this.schools.map(school => ({
                    value: school.id,
                    label: school.name
                }));
            },
            error: (err: any) => {
                console.error('Error loading schools:', err);
            }
        });
    }

    loadTeachers(): void {
        if (this.selectedSchoolIds.length === 0) {
            this.teachers = [];
            this.teacherOptions = [];
            return;
        }

        const params: FilterParams = {
            schoolIds: this.selectedSchoolIds.join(",")
        };

        this.teacherService.getTeachersForFilter(params).subscribe({
            next: (teachers: any) => {
                this.teachers = teachers || [];
                this.teacherOptions = this.teachers.map(teacher => ({
                    value: teacher.id,
                    label: teacher.fullname
                }));
            },
            error: (err: any) => {
                console.error('Error loading teachers:', err);
            }
        });
    }



    onStudentCreate(): void {
        const dialogRef = this.dialog.open<any>(StudentEditingDialogComponent, {
            width: '1000px',
            data: {
                student: null,
                isEditing: false,
                canDelete: false
            }
        });

        dialogRef.closed.subscribe(result => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.studentService.createStudent(result.data).subscribe({
                    next: (response: any) => {
                        const newStudent = ResponseHandlerUtil.extractData<Student>(response);
                        // Добавляем нового ученика в начало массива
                        this.students = [newStudent, ...this.students];
                        this.isLoading = false;
                        this.toastService.show(ResponseHandlerUtil.extractMessage(response) || 'Şagird uğurla əlavə edildi', 'success');
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.toastService.show('Şagird əlavə edilməsində xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    onStudentUpdate(student: Student): void {
        const dialogRef = this.dialog.open<any>(StudentEditingDialogComponent, {
            width: '1000px',
            data: {
                student,
                isEditing: true,
                canDelete: this.authService.canDeleteStudents()
            }
        });

        dialogRef.closed.subscribe(result => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleStudentDelete(student.id);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.studentService.updateStudent(result.data).subscribe({
                    next: (response: any) => {
                        const updatedStudent = ResponseHandlerUtil.extractData<Student>(response);
                        const index = this.students.findIndex(s => IdUtil.equals(s.id, result.data.id));
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.students = [
                                ...this.students.slice(0, index),
                                updatedStudent,
                                ...this.students.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.toastService.show(ResponseHandlerUtil.extractMessage(response) || 'Şagird uğurla yeniləndi', 'success');
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.toastService.show('Şagird yenilənməsində xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    private handleStudentDelete(studentId: string | number): void {
        const dialogRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Şagirdi sil',
                text: 'Bu şagirdi silmək istədiyinizə əminsinizmi?\n\nDİQQƏT!\nŞagird silinərkən onun bütün nəticələri də silinəcək!'
            }
        });

        dialogRef.closed.subscribe(result => {
            if (result) {
                this.isLoading = true;
                this.studentService.deleteStudent(studentId).subscribe({
                    next: () => {
                        // Удаляем студента из списка без перезагрузки
                        this.students = this.students.filter(s => !IdUtil.equals(s.id, studentId));
                        this.totalCount--;
                        this.isLoading = false;
                        this.toastService.show('Şagird uğurla silindi', 'success');
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.toastService.show('Şagird silinməsində xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    openBulkUploadModal(): void {
        this.isBulkUploadModalOpen = true;
    }

    closeBulkUploadModal(): void {
        this.isBulkUploadModalOpen = false;
    }

    onBulkUploadComplete(): void {
        // Reload students to show updated avatars
        this.loadStudents();
    }

    onAllStudentsDelete(): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Silinməyə razılıq',
                text: 'Ekranda göstərilən bütün şagirdləri silmək istədiyinizdən əminsiniz mi?\n\nDİQQƏT!\nŞagirdlər silinərkən onların bütün nəticələri də silinəcək!'
            }
        });

        confirmRef.closed.subscribe((result: boolean) => {
            if (result) {
                const studentIds = this.students.map(s => s.id).join(",");
                this.studentService.deleteStudents(studentIds).subscribe({
                    next: (response) => {
                        this.loadStudents();
                        this.toastService.show('Şagirdlər uğurla silindi', 'success');
                    },
                    error: (error) => {
                        console.error(error);
                        this.toastService.show(error?.error?.message || 'Xəta baş verdi', 'error');
                    }
                });
            }
        });
    }

    onStudentView(student: Student): void {
        // Сохраняем текущие параметры фильтров и пагинации для возврата
        this.route.queryParams.subscribe(currentParams => {
            const queryParams: any = {
                pageIndex: this.pageIndex,
                pageSize: this.pageSize,
                districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds.join(',') : undefined,
                schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds.join(',') : undefined,
                teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds.join(',') : undefined,
                grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(',') : undefined,
                search: this.searchString || undefined,
                defective: this.checkedDefective ? 'true' : undefined,
                source: 'students'
            };

            // Preserve all previous pagination states
            if (currentParams['districtPage'] !== undefined) {
                queryParams.districtPage = currentParams['districtPage'];
            }
            if (currentParams['districtPageSize'] !== undefined) {
                queryParams.districtPageSize = currentParams['districtPageSize'];
            }
            if (currentParams['schoolPage'] !== undefined) {
                queryParams.schoolPage = currentParams['schoolPage'];
            }
            if (currentParams['schoolPageSize'] !== undefined) {
                queryParams.schoolPageSize = currentParams['schoolPageSize'];
            }
            if (currentParams['teacherPage'] !== undefined) {
                queryParams.teacherPage = currentParams['teacherPage'];
            }
            if (currentParams['teacherPageSize'] !== undefined) {
                queryParams.teacherPageSize = currentParams['teacherPageSize'];
            }
            if (currentParams['selectedDistrictIds']) {
                queryParams.selectedDistrictIds = currentParams['selectedDistrictIds'];
            }
            if (currentParams['selectedSchoolIds']) {
                queryParams.selectedSchoolIds = currentParams['selectedSchoolIds'];
            }
            // Preserve the chain
            if (currentParams['fromSchoolId']) {
                queryParams.fromSchoolId = currentParams['fromSchoolId'];
            }
            if (currentParams['fromDistrictId']) {
                queryParams.fromDistrictId = currentParams['fromDistrictId'];
            }

            this.router.navigate(['/students', student.id], { queryParams });
        });
    }

    onStudentsRepair(): void {
        this.isLoading = true;
        this.studentService.repairStudents().subscribe({
            next: (response: any) => {
                this.toastService.show(response.message || 'Qüsurlar uğurla düzəldildi', 'success');
                this.isLoading = false;
                this.loadStudents();
            },
            error: (error: any) => {
                this.toastService.show(error.error?.message || 'Xəta baş verdi', 'error');
                this.isLoading = false;
            }
        });
    }
}
