import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

import { ExamType, ExamTypeInput, ExamTypeInputSection, ExamTypeInputSectionSubject } from '../../../../core/models/examType.model';
import { LevelScale } from '../../../../core/models/levelScale.model';
import { Subject as SubjectModel } from '../../../../core/models/subject.model';
import { ExamTypeService } from '../../services/exam-type.service';
import { LevelScaleService } from '../../services/level-scale.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';

/** Локальная (редактируемая на форме) модель секции — без FormArray, простой массив,
 *  мутируемый напрямую (ngModel/*ngFor), как заведено во всём остальном репозитории. */
interface EditableSection extends ExamTypeInputSection {
    subjects: ExamTypeInputSectionSubject[];
}

@Component({
    selector: 'app-exam-type-editor',
    imports: [
        FormsModule,
        RouterModule,
        LucideAngularModule,
        InputComponent,
        SelectComponent,
        ListLayoutComponent
    ],
    templateUrl: './exam-type-editor.component.html',
    styleUrls: ['./exam-type-editor.component.scss']
})
export class ExamTypeEditorComponent implements OnInit {
    isEditing = false;
    examTypeId: number | null = null;

    isLoading = false;
    hasError = false;
    errorMessage = '';
    isSaving = false;

    levelScaleOptions: SelectOption[] = [];
    subjectOptions: SelectOption[] = [];
    private subjectsByCode = new Map<string, SubjectModel>();

    backButton: BackButton = { show: true, action: () => this.onCancel() };

    model: {
        code: string;
        nameAz: string;
        levelScaleId: number | null;
        hasQuestionCounts: boolean;
        monthAwardMinRank: number | null;
        isBase: boolean;
        active: boolean;
        sortOrder: number;
        sections: EditableSection[];
    } = {
        code: '',
        nameAz: '',
        levelScaleId: null,
        hasQuestionCounts: false,
        monthAwardMinRank: null,
        isBase: false,
        active: true,
        sortOrder: 0,
        sections: []
    };

    readonly Plus = Plus;
    readonly Trash2 = Trash2;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private examTypeService: ExamTypeService,
        private levelScaleService: LevelScaleService,
        private subjectService: SubjectService,
        private toastService: ToastService
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.examTypeId = idParam ? Number(idParam) : null;
        this.isEditing = this.examTypeId !== null;

        this.levelScaleService.getLevelScales().subscribe({
            next: (scales: LevelScale[]) => {
                this.levelScaleOptions = (scales || []).map(s => ({ value: s.id, label: s.nameAz }));
            },
            error: () => { this.levelScaleOptions = []; }
        });

        this.subjectService.getSubjects().subscribe({
            next: (subjects: SubjectModel[]) => {
                this.subjectOptions = (subjects || []).map(s => ({ value: s.code, label: s.nameAz }));
                this.subjectsByCode = new Map((subjects || []).map(s => [s.code, s]));
            },
            error: () => { this.subjectOptions = []; }
        });

        if (this.isEditing && this.examTypeId !== null) {
            this.loadExamType(this.examTypeId);
        }
    }

    /** GET /api/exam-types по id отдельно не существует (только список) — берём весь
     *  список и находим нужный элемент на клиенте. */
    private loadExamType(id: number): void {
        this.isLoading = true;
        this.examTypeService.getExamTypes().subscribe({
            next: (types: ExamType[]) => {
                const found = (types || []).find(t => t.id === id);
                this.isLoading = false;
                if (!found) {
                    this.hasError = true;
                    this.errorMessage = 'İmtahan növü tapılmadı';
                    return;
                }
                this.model = {
                    code: found.code,
                    nameAz: found.nameAz,
                    levelScaleId: found.levelScaleId,
                    hasQuestionCounts: found.hasQuestionCounts,
                    monthAwardMinRank: found.monthAwardMinRank,
                    isBase: found.isBase,
                    active: found.active,
                    sortOrder: found.sortOrder,
                    sections: (found.sections || []).map(section => ({
                        id: section.id,
                        nameAz: section.nameAz,
                        gradeFrom: section.gradeFrom,
                        gradeTo: section.gradeTo,
                        subjects: (section.subjects || []).map(subject => ({ ...subject }))
                    }))
                };
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `İmtahan növü yüklənərkən xəta baş verdi: ${err.message || ''}`;
            }
        });
    }

    get pageTitle(): string {
        return this.isEditing ? 'İmtahan növünün redaktə edilməsi' : 'Yeni imtahan növü';
    }

    get isValid(): boolean {
        return !!(
            this.model.code?.trim() &&
            this.model.nameAz?.trim() &&
            !!this.model.levelScaleId
        );
    }

    addSection(): void {
        this.model.sections.push({
            nameAz: '',
            gradeFrom: 1,
            gradeTo: 1,
            subjects: []
        });
    }

    removeSection(index: number): void {
        this.model.sections.splice(index, 1);
    }

    addSubject(sectionIndex: number): void {
        this.model.sections[sectionIndex].subjects.push({
            subjectCode: '',
            nameAz: '',
            maxQuestions: 0,
            sortOrder: this.model.sections[sectionIndex].subjects.length
        });
    }

    removeSubject(sectionIndex: number, subjectIndex: number): void {
        this.model.sections[sectionIndex].subjects.splice(subjectIndex, 1);
    }

    /** При выборе предмета в секции подтягиваем его отображаемое имя из справочника
     *  предметов — nameAz в теле запроса дублирует Subject.nameAz на момент сохранения
     *  (ТЗ не описывает буквально этот шаг, см. отчёт о принятых решениях). */
    onSubjectCodeChange(sectionIndex: number, subjectIndex: number): void {
        const subjectEntry = this.model.sections[sectionIndex].subjects[subjectIndex];
        const subject = this.subjectsByCode.get(subjectEntry.subjectCode);
        subjectEntry.nameAz = subject ? subject.nameAz : '';
    }

    onCancel(): void {
        this.router.navigate(['/admin/exam-types']);
    }

    onSave(): void {
        if (!this.isValid || this.isSaving) return;

        const input: ExamTypeInput = {
            code: this.model.code.trim(),
            nameAz: this.model.nameAz.trim(),
            levelScaleId: this.model.levelScaleId as number,
            hasQuestionCounts: this.model.hasQuestionCounts,
            monthAwardMinRank: this.model.monthAwardMinRank,
            isBase: this.model.isBase,
            active: this.model.active,
            sortOrder: this.model.sortOrder,
            sections: this.model.sections.map(section => ({
                ...(section.id ? { id: section.id } : {}),
                nameAz: section.nameAz,
                gradeFrom: section.gradeFrom,
                gradeTo: section.gradeTo,
                subjects: section.subjects.map(subject => ({
                    subjectCode: subject.subjectCode,
                    nameAz: subject.nameAz,
                    maxQuestions: subject.maxQuestions,
                    sortOrder: subject.sortOrder
                }))
            }))
        };

        this.isSaving = true;
        const request$ = this.isEditing && this.examTypeId !== null
            ? this.examTypeService.updateExamType(this.examTypeId, input)
            : this.examTypeService.createExamType(input);

        request$.subscribe({
            next: () => {
                this.isSaving = false;
                this.toastService.show(
                    this.isEditing ? 'İmtahan növü uğurla yeniləndi' : 'İmtahan növü uğurla yaradıldı',
                    'success'
                );
                this.router.navigate(['/admin/exam-types']);
            },
            error: (err: any) => {
                this.isSaving = false;
                this.toastService.show(
                    err?.error?.message || 'İmtahan növü yadda saxlanılarkən xəta baş verdi',
                    'error'
                );
            }
        });
    }
}
