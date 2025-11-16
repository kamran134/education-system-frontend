import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Core models and services
import { Student, StudentResponse } from '../../../../core/models/student.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { Exam } from '../../../../core/models/exam.model';

// Services
import { StudentService } from '../../services/student.service';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ExamService } from '../../../exams/services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

// UI Components
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, Settings, ChevronDown, ChevronUp, ArrowLeft, Trash } from 'lucide-angular';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

// Dialogs
import { StudentEditingDialogComponent } from '../student-editing/student-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent,
        SelectComponent
    ],
    templateUrl: './students-list.component.html',
    styleUrls: ['./students-list.component.scss']
})
export class StudentsListComponent implements OnInit {
    // Data
    students: Student[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];
    
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
    selectedExamIds: string[] = [];
    searchString: string = '';
    checkedDefective: boolean = false;
    teacherId: string | null = null;
    
    // Filter options
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    districtOptions: SelectOption[] = [];
    schoolOptions: SelectOption[] = [];
    teacherOptions: SelectOption[] = [];
    gradeOptions: SelectOption[] = [];
    examOptions: SelectOption[] = [];
    
    // UI State
    filtersExpanded = false;
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'Şagirdin kodu', sortable: true, type: 'text' },
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
    
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }

    constructor(
        private authService: AuthService,
        private studentService: StudentService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private examService: ExamService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.setupGradeOptions();
        
        // Check if we're viewing students for a specific teacher
        this.route.params.subscribe(params => {
            this.teacherId = params['id'];
            if (this.teacherId) {
                this.selectedTeacherIds = [this.teacherId];
            }
            // Setup buttons after we know if teacherId exists
            this.setupActionButtons();
        });
        
        // Restore state from query parameters if coming back
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['studentPage'] !== undefined) {
                this.pageIndex = parseInt(queryParams['studentPage']) || 0;
            }
            if (queryParams['studentPageSize'] !== undefined) {
                this.pageSize = parseInt(queryParams['studentPageSize']) || 1000;
            }
            if (queryParams['selectedDistrictIds'] && !this.teacherId) {
                this.selectedDistrictIds = queryParams['selectedDistrictIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['selectedSchoolIds'] && !this.teacherId) {
                this.selectedSchoolIds = queryParams['selectedSchoolIds'].split(',').filter((id: string) => id.trim() !== '');
            }
            if (queryParams['selectedTeacherIds'] && !this.teacherId) {
                this.selectedTeacherIds = queryParams['selectedTeacherIds'].split(',').filter((id: string) => id.trim() !== '');
            }
        });
        
        this.loadDistricts();
        this.loadExams();
        this.loadStudents();
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
                variant: 'secondary'
            });
        }
    }

    private setupGradeOptions(): void {
        this.gradeOptions = this.gradesOptions.map(grade => ({
            value: grade,
            label: grade.toString()
        }));
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

        if (filterData.exams !== undefined) {
            this.selectedExamIds = filterData.exams || [];
        }

        if (filterData.search !== undefined) {
            this.searchString = filterData.search || '';
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
        // If we came from a teacher, navigate back to teachers with preserved state
        if (this.teacherId) {
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
                
                this.router.navigate(['/teachers'], { queryParams });
            });
        } else {
            // Otherwise, go to home page
            this.router.navigate(['/']);
        }
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
                        this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'OK', this.matSnackConfig);
                        this.loadStudents();
                    },
                    error: (err: any) => {
                        this.snackBar.open(`Fayl yüklənməsində xəta!\n${err.message}`, 'Bağla', this.matSnackConfig);
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
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            examIds: this.selectedExamIds.join(","),
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
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        };

        this.districtService.getDistricts(params).subscribe({
            next: (response: DistrictResponse) => {
                this.districts = ResponseHandlerUtil.extractData<District[]>(response) || [];
                this.districtOptions = this.districts.map(district => ({
                    value: district._id,
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
            return;
        }

        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(",")
        };

        this.schoolService.getSchoolsForFilter(params).subscribe({
            next: (data: SchoolResponse) => {
                this.schools = data.data || [];
                this.schoolOptions = this.schools.map(school => ({
                    value: school._id,
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
            return;
        }

        const params: FilterParams = {
            schoolIds: this.selectedSchoolIds.join(",")
        };

        this.teacherService.getTeachersForFilter(params).subscribe({
            next: (response: any) => {
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Teacher>(response);
                this.teachers = paginatedData.data || [];
                this.teacherOptions = this.teachers.map(teacher => ({
                    value: teacher._id,
                    label: teacher.fullname
                }));
            },
            error: (err: any) => {
                console.error('Error loading teachers:', err);
            }
        });
    }

    loadExams(): void {
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'date',
            sortDirection: 'desc'
        };

        this.examService.getExams(params).subscribe({
            next: (response: any) => {
                this.exams = ResponseHandlerUtil.extractData<Exam[]>(response) || [];
                this.examOptions = this.exams.map(exam => ({
                    value: exam._id,
                    label: `${exam.name} (${new Date(exam.date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })})`
                }));
            },
            error: (err: any) => {
                console.error('Error loading exams:', err);
            }
        });
    }

    onStudentCreate(): void {
        const dialogRef = this.dialog.open(StudentEditingDialogComponent, {
            width: '1000px',
            data: { 
                student: null, 
                isEditing: false,
                canDelete: false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.action === 'save') {
                this.isLoading = true;
                this.studentService.createStudent(result.data).subscribe({
                    next: (response: any) => {
                        const newStudent = ResponseHandlerUtil.extractData<Student>(response);
                        // Добавляем нового ученика в начало массива
                        this.students = [newStudent, ...this.students];
                        this.isLoading = false;
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Şagird uğurla əlavə edildi', 'OK', this.matSnackConfig);
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.snackBar.open('Şagird əlavə edilməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onStudentUpdate(student: Student): void {
        const dialogRef = this.dialog.open(StudentEditingDialogComponent, {
            width: '1000px',
            data: { 
                student, 
                isEditing: true,
                canDelete: this.authService.canDeleteStudents()
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.action === 'delete') {
                // Обработка удаления
                this.handleStudentDelete(student._id);
            } else if (result?.action === 'save') {
                // Обработка сохранения
                this.isLoading = true;
                this.studentService.updateStudent(result.data).subscribe({
                    next: (response: any) => {
                        const updatedStudent = ResponseHandlerUtil.extractData<Student>(response);
                        const index = this.students.findIndex(s => s._id === result.data._id);
                        if (index !== -1) {
                            // Создаем новый массив для триггера change detection
                            this.students = [
                                ...this.students.slice(0, index),
                                updatedStudent,
                                ...this.students.slice(index + 1)
                            ];
                        }
                        this.isLoading = false;
                        this.snackBar.open(ResponseHandlerUtil.extractMessage(response) || 'Şagird uğurla yeniləndi', 'OK', this.matSnackConfig);
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.snackBar.open('Şagird yenilənməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    private handleStudentDelete(studentId: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Şagirdi sil',
                text: 'Bu şagirdi silmək istədiyinizə əminsinizmi?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;
                this.studentService.deleteStudent(studentId).subscribe({
                    next: () => {
                        // Удаляем студента из списка без перезагрузки
                        this.students = this.students.filter(s => s._id !== studentId);
                        this.totalCount--;
                        this.isLoading = false;
                        this.snackBar.open('Şagird uğurla silindi', 'OK', this.matSnackConfig);
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.snackBar.open('Şagird silinməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onAllStudentsDelete(): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { 
                title: 'Silinməyə razılıq', 
                text: 'Ekranda göstərilən bütün şagirdləri silmək istədiyinizdən əminsiniz mi?' 
            }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                const studentIds = this.students.map(s => s._id).join(",");
                this.studentService.deleteStudents(studentIds).subscribe({
                    next: (response) => {
                        this.loadStudents();
                        this.snackBar.open('Şagirdlər uğurla silindi', 'Bağla', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error?.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onStudentView(student: Student): void {
        // Сохраняем текущие параметры фильтров и пагинации для возврата
        const queryParams = {
            pageIndex: this.pageIndex,
            pageSize: this.pageSize,
            districts: this.selectedDistrictIds,
            schools: this.selectedSchoolIds,
            teachers: this.selectedTeacherIds,
            grades: this.selectedGrades,
            exams: this.selectedExamIds,
            search: this.searchString,
            defective: this.checkedDefective
        };

        this.router.navigate(['/students', student._id], { queryParams });
    }

    onStudentsRepair(): void {
        this.isLoading = true;
        this.studentService.repairStudents().subscribe({
            next: (response: any) => {
                this.snackBar.open(response.message || 'Qüsurlar uğurla düzəldildi', 'OK', this.matSnackConfig);
                this.isLoading = false;
                this.loadStudents();
            },
            error: (error: any) => {
                this.snackBar.open(error.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                this.isLoading = false;
            }
        });
    }
}