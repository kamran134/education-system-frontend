import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { StudentWithResult } from '../../../../core/models/student.model';
import { Error } from '../../../../core/models/error.model';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { LucideAngularModule, ArrowLeft, Download, Loader, Edit2 } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { MatDialog } from '@angular/material/dialog';
import { ResultEditingDialogComponent } from '../result-editing/result-editing-dialog.component';
import { ExamResult } from '../../../../core/models/examResult.model';

@Component({
    selector: 'app-student-details',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        ButtonComponent
    ],
    templateUrl: './student-details.component.html',
    styleUrl: './student-details.component.scss'
})
export class StudentDetailsComponent implements OnInit {
    studentId!: string;
    student!: StudentWithResult | null;
    prevPageSize: number = 10;
    prevPageIndex: number = 0;
    filterParams: any = {};
    source: string = 'students';
    isLoading: boolean = true;

    // Icons
    readonly ArrowLeft = ArrowLeft;
    readonly Download = Download;
    readonly Loader = Loader;
    readonly Edit2 = Edit2;

    constructor(
        private studentService: StudentService,
        private route: ActivatedRoute,
        private router: Router,
        private excelService: ExcelService,
        private dialog: MatDialog
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
            width: '800px',
            data: { result }
        });

        dialogRef.afterClosed().subscribe((editedResult: Partial<ExamResult> | undefined) => {
            if (editedResult) {
                this.updateResult(result._id, editedResult);
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
}
