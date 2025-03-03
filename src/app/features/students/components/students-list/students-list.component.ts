import { CommonModule } from '@angular/common';
import { Component, model, ModelSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { Student, StudentData } from '../../../../models/student.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarModule, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { StudentService } from '../../services/student.service';
import { FilterParams } from '../../../../models/filterParams.model';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, NavigationExtras, Params, Router, RouterModule } from '@angular/router';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { District, DistrictData } from '../../../../models/district.model';
import { School, SchoolData } from '../../../../models/school.model';
import { Teacher, TeacherData } from '../../../../models/teacher.model';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../layouts/dialogs/confirm-dialog/confirm-dialog.component';
import { ExamService } from '../../../exams/services/exam.service';
import { Exam } from '../../../../models/exam.model';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';

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
export class StudentsListComponent {
    file: File | null = null;
    students: Student[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];
    totalCount: number = 0;
    pageSize: number = 10;
    pageIndex: number = 0;
    readonly checkedDeffective: ModelSignal<boolean> = model(false);
    isLoading: boolean = false;
    isLoadingMore: boolean = false;
    hasError: boolean = false;
    errorMessage: string = '';
    horizontalPosition: MatSnackBarHorizontalPosition = 'center';
    verticalPosition: MatSnackBarVerticalPosition = 'top';
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedExamIds: string[] = [];
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    searchString: string = '';
    private searchTerms = new Subject<string>();
    displayedColumns: string[] = ['code', 'lastName', 'firstName', 'middleName', 'grade', 'teacher', 'school', 'district'];

    constructor(
        private studentService: StudentService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private examService: ExamService,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
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
                this.students = response.data;
                this.totalCount = response.totalCount;
            },
            error: (error) => {
                this.errorMessage = error.message;
            }
        });
    }

    loadStudents(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            defective: this.checkedDeffective(),
            grades: this.selectedGrades.join(","),
            examIds: this.selectedExamIds.join(",")
        };

        this.studentService.getStudents(params).subscribe({
            next: (response: StudentData) => {
                this.students = response.data;
                // if (this.pageIndex === 0) this.students = data.data;
                // else this.students = [...this.students, ...data.data]
                this.totalCount = response.totalCount;
                this.isLoading = false;
                // this.isLoadingMore = false;
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
                next: (response: TeacherData) => {
                    this.teachers = response.data;
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
                next: (response: SchoolData) => {
                    this.schools = response.data;
                },
                error: (error: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Məktəblərin alınmasında xəta: ${error.message}`;
                }
            });
    }

    loadDistricts(): void {
        this.districtService.getDistricts()
            .subscribe({
                next: (response: DistrictData) => {
                    this.districts = response.data;
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching districts: ${err.message}`;
                }
            });
    }

    loadExams(): void {
        this.examService.getExams({ page: 0, size: 1000 })
            .subscribe({
                next: (response) => {
                    this.exams = response.data
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
                next: () => this.snackBar.open('Fayl uğurla yükləndi', 'OK', {
                    horizontalPosition: this.horizontalPosition,
                    verticalPosition: this.verticalPosition,
                    duration: 5000
                }),
                error: (err) => this.snackBar.open(`Fayl yüklənməsində xəta!\n${err.message}`, 'Bağla', {
                    horizontalPosition: this.horizontalPosition,
                    verticalPosition: this.verticalPosition,
                    duration: 5000
                })
            });
        }
        else {
            this.snackBar.open('Fayl seçilməyib', 'Bağla', {
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
                duration: 5000
            });
        }
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
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }

    onCheckDefective(): void {
        this.loadStudents();
    }

    onSearchChange(): void {
        this.searchTerms.next(this.searchString);
    }
}
