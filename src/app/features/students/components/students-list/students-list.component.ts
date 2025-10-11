import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Upload, Settings, ChevronDown, ChevronUp } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

// Dialogs
import { StudentEditingDialogComponent } from '../student-editing/student-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent
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
    pageSize = 100;
    pageIndex = 0;
    
    // Filters
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedExamIds: string[] = [];
    searchString: string = '';
    checkedDefective: boolean = false;
    
    // Filter options
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
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
            condition: () => this.isAdminOrSuperAdmin()
        },
        {
            key: 'delete',
            label: 'Sil',
            icon: Trash2,
            variant: 'danger',
            condition: () => this.isAdminOrSuperAdmin()
        }
    ];
    
    actionButtons: ActionButton[] = [];
    
    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Upload = Upload;
    readonly Settings = Settings;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    
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
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        this.loadDistricts();
        this.loadExams();
        this.loadStudents();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];
        
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
            case 'delete':
                this.onStudentDelete(event.item._id);
                break;
        }
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadStudents();
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
            examIds: this.selectedExamIds.join(",")
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
                this.districts = ResponseHandlerUtil.extractData<District[]>(response);
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
                this.schools = data.data;
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
                this.teachers = paginatedData.data;
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
                this.exams = ResponseHandlerUtil.extractData<Exam[]>(response);
            },
            error: (err: any) => {
                console.error('Error loading exams:', err);
            }
        });
    }

    onStudentUpdate(student: Student): void {
        const dialogRef = this.dialog.open(StudentEditingDialogComponent, {
            width: '600px',
            data: student
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadStudents();
            }
        });
    }

    onStudentDelete(studentId: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Şagirdi sil',
                message: 'Bu şagirdi silmək istədiyinizə əminsinizmi?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.studentService.deleteStudent(studentId).subscribe({
                    next: () => {
                        this.snackBar.open('Şagird uğurla silindi', 'OK', this.matSnackConfig);
                        this.loadStudents();
                    },
                    error: (err: any) => {
                        this.snackBar.open('Şagird silinməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
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