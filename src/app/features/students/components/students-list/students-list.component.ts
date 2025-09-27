import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, model, ModelSignal, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RepairingResults, Student, StudentResponse } from '../../../../core/models/student.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentService } from '../../services/student.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, NavigationExtras, Params, Router, RouterModule } from '@angular/router';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ExamService } from '../../../exams/services/exam.service';
import { Exam } from '../../../../core/models/exam.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { StudentEditingDialogComponent } from '../student-editing/student-editing-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [
        CommonModule,
        MatSnackBarModule,
        MatIconModule,
        MatButtonModule,
        MatPaginator,
        MatFormFieldModule,
        MatCardModule,
        MatSortModule,
        FormsModule,
        MatOption,
        RouterModule,
        MatTableModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        MatCheckboxModule,
        ReactiveFormsModule
    ],
    templateUrl: './students-list.component.html',
    styleUrl: './students-list.component.scss'
})
export class StudentsListComponent implements OnInit, AfterViewInit {
    file: File | null = null;
    students: Student[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];
    totalCount: number = 0;
    pageSize: number = 100;
    pageIndex: number = 0;
    readonly checkedDeffective: ModelSignal<boolean> = model(false);
    isLoading: boolean = false;
    isLoadingMore: boolean = false;
    hasError: boolean = false;
    errorMessage: string = '';
    matSnackConfig: MatSnackBarConfig = {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
    }
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedExamIds: string[] = [];
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    searchString: string = '';
    private searchTerms = new Subject<string>();
    displayedColumns: string[] = ['code', 'lastName', 'firstName', 'middleName', 'grade', 'teacher', 'school', 'district', 'actions'];
    repairingResults: RepairingResults = {};

    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private authService: AuthService,
        private studentService: StudentService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private examService: ExamService,
        private router: Router,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.route.queryParams.subscribe({
            next: (params: Params) => {
                this.pageSize = params['pageSize'] ? +params['pageSize'] : this.pageSize;
                this.pageIndex = params['pageIndex'] ? +params['pageIndex'] : this.pageIndex;
                this.selectedDistrictIds = params['districtIds'] ? params['districtIds'].split(',') : [];
                this.selectedSchoolIds = params['schoolIds'] ? params['schoolIds'].split(',') : [];
                this.selectedTeacherIds = params['teacherIds'] ? params['teacherIds'].split(',') : [];
                this.selectedGrades = params['grades'] ? params['grades'].split(',').map(Number) : [];
                this.selectedExamIds = params['examIds'] ? params['examIds'].split(',') : [];
                this.checkedDeffective.set(params['defective'] === 'true');
                this.loadStudents();
            },
            error: (error) => { console.error(error); }
        });
        this.loadDistricts();
        this.loadExams();
        this.setupSearch();
    }

    ngAfterViewInit(): void {}

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    loadStudents(sortActive?: string, sortDirection?: 'asc' | 'desc'): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            defective: this.checkedDeffective(),
            grades: this.selectedGrades.join(","),
            examIds: this.selectedExamIds.join(","),
            sortColumn: sortActive || 'code',
            sortDirection: sortDirection || 'asc'
        };

        this.studentService.getStudents(params).subscribe({
            next: (response) => {
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                this.students = paginatedData.data;
                this.totalCount = paginatedData.totalCount;
                this.isLoading = false;
            },
            error: (error) => {
                this.hasError = true;
                this.errorMessage = error.message;
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        });
    }

    loadTeachers(): void {
        const params: FilterParams = {
            schoolIds: this.selectedSchoolIds.join(",")
        }

        this.teacherService.getTeachersForFilter(params)
            .subscribe({
                next: (response: TeacherResponse) => {
                    this.teachers = ResponseHandlerUtil.extractData<Teacher[]>(response);
                },
                error: (error: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Müəllimlərin alınmasında xəta: ${error.message}`;
                }
            })

    }

    loadSchools(): void {
        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(",")
        }

        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (response: SchoolResponse) => {
                    this.schools = ResponseHandlerUtil.extractData<School[]>(response);
                },
                error: (error: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Məktəblərin alınmasında xəta: ${error.message}`;
                }
            });
    }

    loadDistricts(): void {
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'name',
            sortDirection: 'asc'
        }

        this.districtService.getDistricts(params)
            .subscribe({
                next: (response: DistrictResponse) => {
                    this.districts = ResponseHandlerUtil.extractData<District[]>(response);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching districts: ${err.message}`;
                }
            });
    }

    loadExams(): void {
        this.examService.getExamsForFilter()
            .subscribe({
                next: (response) => {
                    this.exams = ResponseHandlerUtil.extractData<Exam[]>(response);
                },
                error: (err: any) => {
                    this.errorMessage = ``;
                }
            });
    }

    onDistrictSelectChanged(): void {
        this.pageIndex = 0; // Сбрасываем страницу
        this.students = []; // Очищаем список студентов
        this.loadSchools();
        this.loadTeachers();
        this.loadStudents();
    }

    onSchoolSelectChanged(): void {
        this.pageIndex = 0; // Сбрасываем страницу
        this.students = []; // Очищаем список студентов
        this.loadTeachers();
        this.loadStudents();
    }

    onTeacherSelectChanged(): void {
        this.pageIndex = 0; // Сбрасываем страницу
        this.students = []; // Очищаем список студентов
        this.loadStudents();
    }

    onGrageSelectChanged(): void {
        this.pageIndex = 0;
        this.students = [];
        this.loadStudents();
    }

    onExamSelectChanged(): void {
        this.pageIndex = 0;
        this.students = [];
        this.loadStudents();
    }

    onSortChange(sortState: Sort): void {
        this.pageIndex = 0; // Сбрасываем страницу
        this.students = []; // Очищаем список студентов
        if (sortState.direction) {
            // Sıralama tətbiq olunub
            console.log('Sıralama sütunu:', sortState.active);
            console.log('Sıralama istiqaməti:', sortState.direction);
    
            // Sıralanmış məlumatları backend-dən almaq üçün loadStudents metodunu çağırın
            this.loadStudents(sortState.active, sortState.direction);
        } else {
            // Sıralama təmizlənib (başlanğıc vəziyyətə qayıdılıb)
            this.loadStudents();
        }
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;

        const queryParams = {
            pageIndex: this.pageIndex,
            pageSize: this.pageSize
        };

        const navigationExtras: NavigationExtras = {
            queryParams,
            replaceUrl: true
        }

        this.router.navigate([], navigationExtras).then(() => {
            this.loadStudents();
        });
    }

    onScroll(event: any): void {
        const element = event.target;
        if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) { // 10px - порог для загрузки
            if (!this.isLoading && !this.isLoadingMore && this.students.length < this.totalCount) {
                this.isLoadingMore = true;
                this.pageIndex++;
                this.loadStudents();
            }
        }
    }

    openStudentDetails(studentId: string): void {
        const queryParams = {
            pageIndex: this.pageIndex,
            pageSize: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            examIds: this.selectedExamIds.join(","),
            defective: this.checkedDeffective(),
            source: 'students'
        };

        const navigationExtras: NavigationExtras = {
            queryParams,
            replaceUrl: true
        }

        this.router.navigate(['/students', studentId], navigationExtras);
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0]
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        if (this.file) {
            this.studentService.uploadFile(this.file).subscribe({
                next: () => this.snackBar.open('Fayl uğurla yükləndi', 'OK', this.matSnackConfig),
                error: (err) => this.snackBar.open(`Fayl yüklənməsində xəta!\n${err.message}`, 'Bağla', this.matSnackConfig)
            });
        }
        else {
            this.snackBar.open('Fayl seçilməyib', 'Bağla', this.matSnackConfig);
        }
    }

    onStudentCreate(): void {
        const dialogRef = this.dialog.open(StudentEditingDialogComponent, {
            width: '1000px',
            data: { student: {}, isEditing: false }
        });

        dialogRef.afterClosed().subscribe((result: Student) => {
            if (result) {
                this.studentService.createStudent(result).subscribe({
                    next: () => {
                        this.loadStudents();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onStudentUpdate(student: Student): void {
        const dialogRef = this.dialog.open(StudentEditingDialogComponent, {
            width: '1000px',
            data: { student }
        });

        dialogRef.afterClosed().subscribe((result: Student) => {
            if (result) {
                this.studentService.updateStudent(result).subscribe({
                    next: () => {
                        this.loadStudents();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onStudentDelete(studentId: string): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Şagirdi silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.studentService.deleteStudent(studentId).subscribe({
                    next: (data) => {
                        this.loadStudents();
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onAllStudentsDelete(): void {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Bütün şagirdləri silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                const studentIds = this.students.map(s => s._id).join(",");
                this.studentService.deleteStudents(studentIds).subscribe({
                    next: (response) => {
                        this.loadStudents();
                        this.snackBar.open(response.message, 'OK', this.matSnackConfig);
                    },
                    error: (error) => {
                        console.error(error);
                        this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onStudentsRepair(): void {
        this.isLoading = true;
        this.studentService.repairStudents().subscribe({
            next: (response) => {
                this.repairingResults = response;
                this.snackBar.open(response.message || '', 'OK', this.matSnackConfig);
                this.isLoading = false;
            },
            error: (error) => {
                console.error(error);
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                this.isLoading = false;
            }
        });
    }

    onCheckDefective(): void {
        this.loadStudents();
    }

    onSearchChange(): void {
        this.searchTerms.next(this.searchString);
    }

    setupSearch(): void {
        this.searchTerms.pipe(
            debounceTime(300), // Задержка 300 мс
            distinctUntilChanged(), // Игнорировать повторяющиеся значения
            switchMap((term: string) => {
                if (term.length >= 3) {
                    // Если введено 3 и более символов, выполняем поиск
                    return this.studentService.searchStudents(term);
                } else {
                    // Если меньше 3 символов, возвращаем всех студентов
                    return this.studentService.getStudents({
                        page: this.pageIndex + 1,
                        size: this.pageSize,
                        districtIds: this.selectedDistrictIds.join(","),
                        schoolIds: this.selectedSchoolIds.join(","),
                        teacherIds: this.selectedTeacherIds.join(","),
                        defective: this.checkedDeffective(),
                        grades: this.selectedGrades.join(","),
                        examIds: this.selectedExamIds.join(",")
                    });
                }
            })
        ).subscribe({
            next: (response) => {
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                this.students = paginatedData.data;
                this.totalCount = paginatedData.totalCount;
            },
            error: (error) => {
                this.errorMessage = error.message;
            }
        });
    }
}
