import { Component, HostListener, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-angular';

import { ExamType, ExamTypeInput, ExamTypeInputSection, ExamTypeInputSectionSubject } from '../../../../core/models/examType.model';
import { LevelScale } from '../../../../core/models/levelScale.model';
import { Subject as SubjectModel, SubjectInput } from '../../../../core/models/subject.model';
import { ExamTypeService } from '../../services/exam-type.service';
import { LevelScaleService } from '../../services/level-scale.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { SubjectEditingDialogComponent, SubjectEditingDialogData } from '../subject-editing-dialog/subject-editing-dialog.component';
import { ConfirmDialogService } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.service';

/** Grade bounds accepted by the backend (examType.controller.ts::validateExamTypeBody). */
const MIN_GRADE = 1;
const MAX_GRADE = 11;

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
    isCreatingSubject = false;

    levelScaleOptions: SelectOption[] = [];
    /** Варианты «минимальной pillə для ученика месяца»: пункт «без ограничения» (null) +
     *  бэнды выбранной pillə meyarı. value = band.rank — в БД хранится именно ранг
     *  (exam_types.month_award_min_rank), а не код бэнда. */
    monthAwardOptions: SelectOption[] = [];
    subjectOptions: SelectOption[] = [];
    private levelScalesById = new Map<number, LevelScale>();
    private subjectsByCode = new Map<string, SubjectModel>();

    backButton: BackButton = { show: true, action: () => this.onCancel() };

    model: {
        code: string;
        nameAz: string;
        levelScaleId: number | null;
        monthAwardMinRank: number | null;
        isBase: boolean;
        active: boolean;
        sortOrder: number;
        sections: EditableSection[];
    } = {
        code: '',
        nameAz: '',
        levelScaleId: null,
        monthAwardMinRank: null,
        isBase: false,
        active: true,
        sortOrder: 0,
        sections: []
    };

    readonly Plus = Plus;
    readonly Trash2 = Trash2;
    readonly ChevronUp = ChevronUp;
    readonly ChevronDown = ChevronDown;

    /** JSON of the model as last loaded/saved — the unsaved-changes guard compares against it. */
    private savedSnapshot = '';
    private saved = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private examTypeService: ExamTypeService,
        private levelScaleService: LevelScaleService,
        private subjectService: SubjectService,
        private toastService: ToastService,
        private dialog: Dialog,
        private confirmDialog: ConfirmDialogService
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.examTypeId = idParam ? Number(idParam) : null;
        this.isEditing = this.examTypeId !== null;

        this.levelScaleService.getLevelScales().subscribe({
            next: (scales: LevelScale[]) => {
                this.levelScaleOptions = (scales || []).map(s => ({ value: s.id, label: s.nameAz }));
                this.levelScalesById = new Map((scales || []).map(s => [s.id, s]));
                this.rebuildMonthAwardOptions();
            },
            error: () => { this.levelScaleOptions = []; }
        });

        this.subjectService.getSubjects().subscribe({
            next: (subjects: SubjectModel[]) => {
                this.subjectsByCode = new Map((subjects || []).map(s => [s.code, s]));
                this.rebuildSubjectOptions();
            },
            error: () => { this.subjectOptions = []; }
        });

        if (this.isEditing && this.examTypeId !== null) {
            this.loadExamType(this.examTypeId);
        } else {
            this.savedSnapshot = this.snapshot();
        }
    }

    private snapshot(): string {
        return JSON.stringify(this.model);
    }

    get isDirty(): boolean {
        return !this.saved && this.snapshot() !== this.savedSnapshot;
    }

    /** canDeactivate (dashboard.routes.ts): leaving with unsaved edits asks first. */
    confirmLeave(): Promise<boolean> | boolean {
        if (!this.isDirty) return true;
        return this.confirmDialog.confirm({
            title: 'Yadda saxlanılmamış dəyişikliklər',
            message: 'Dəyişikliklər yadda saxlanılmayıb. Səhifədən çıxılsın?',
            confirmText: 'Çıx',
            cancelText: 'Qal',
            variant: 'danger'
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.isDirty) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    /** Only active subjects are offered; an inactive one stays listed only where this type already uses it. */
    private rebuildSubjectOptions(): void {
        const used = new Set(this.model.sections.flatMap(s => s.subjects.map(x => x.subjectCode)));
        this.subjectOptions = [...this.subjectsByCode.values()]
            .filter(s => s.active || used.has(s.code))
            .map(s => ({ value: s.code, label: s.active ? s.nameAz : `${s.nameAz} (deaktiv)` }));
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
                this.rebuildMonthAwardOptions();
                this.rebuildSubjectOptions();
                this.savedSnapshot = this.snapshot();
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

    /** Mirrors examType.controller.ts::validateExamTypeBody, so problems show before saving. */
    get validationErrors(): string[] {
        const errors: string[] = [];
        if (!this.model.code?.trim()) errors.push('Kod göstərilməyib');
        if (!this.model.nameAz?.trim()) errors.push('Ad göstərilməyib');
        if (!this.model.levelScaleId) errors.push('Pillə meyarı seçilməyib');
        if (this.model.sections.length === 0) {
            errors.push('Ən azı bir bölmə əlavə edilməlidir');
            return errors;
        }

        const ranges: Array<{ label: string; from: number; to: number }> = [];
        this.model.sections.forEach((section, i) => {
            const label = section.nameAz?.trim() ? `"${section.nameAz.trim()}"` : `Bölmə №${i + 1}`;
            if (!section.nameAz?.trim()) errors.push(`Bölmə №${i + 1}: ad göstərilməyib`);
            const from = Number(section.gradeFrom);
            const to = Number(section.gradeTo);
            if (!Number.isInteger(from) || !Number.isInteger(to) || from < MIN_GRADE || to > MAX_GRADE || from > to) {
                errors.push(`${label}: sinif aralığı ${MIN_GRADE}-${MAX_GRADE} daxilində və başlanğıc ≤ son olmalıdır`);
            } else {
                ranges.push({ label, from, to });
            }
            const seen = new Set<string>();
            for (const subject of section.subjects) {
                if (!subject.subjectCode) {
                    errors.push(`${label}: fənn seçilməmiş sətir var`);
                } else if (seen.has(subject.subjectCode)) {
                    errors.push(`${label}: "${subject.nameAz || subject.subjectCode}" fənni bir neçə dəfə seçilib`);
                } else {
                    seen.add(subject.subjectCode);
                }
            }
        });
        for (let a = 0; a < ranges.length; a++) {
            for (let b = a + 1; b < ranges.length; b++) {
                if (ranges[a].from <= ranges[b].to && ranges[b].from <= ranges[a].to) {
                    errors.push(`${ranges[a].label} və ${ranges[b].label}: sinif aralıqları üst-üstə düşür`);
                }
            }
        }
        return [...new Set(errors)];
    }

    get isValid(): boolean {
        return this.validationErrors.length === 0;
    }

    onLevelScaleChange(): void {
        this.rebuildMonthAwardOptions();
        // Сохранённый порог относится к бэндам прежней meyarı — сбрасываем, если такого
        // ранга в новой нет.
        if (this.model.monthAwardMinRank !== null &&
            !this.monthAwardOptions.some(o => o.value === this.model.monthAwardMinRank)) {
            this.model.monthAwardMinRank = null;
        }
    }

    private rebuildMonthAwardOptions(): void {
        const scale = this.model.levelScaleId !== null ? this.levelScalesById.get(this.model.levelScaleId) : undefined;
        const bands = [...(scale?.bands || [])].sort((a, b) => a.rank - b.rank);
        this.monthAwardOptions = [
            { value: null, label: 'Məhdudiyyət yoxdur' },
            ...bands.map(b => ({ value: b.rank, label: b.nameAz }))
        ];
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
        this.model.sections[sectionIndex].subjects.push({ subjectCode: '', nameAz: '', sortOrder: 0 });
    }

    removeSubject(sectionIndex: number, subjectIndex: number): void {
        this.model.sections[sectionIndex].subjects.splice(subjectIndex, 1);
    }

    /** Order = position in the list (it is the template's column order); sortOrder is derived on save. */
    moveSubject(sectionIndex: number, subjectIndex: number, delta: -1 | 1): void {
        const subjects = this.model.sections[sectionIndex].subjects;
        const target = subjectIndex + delta;
        if (target < 0 || target >= subjects.length) return;
        [subjects[subjectIndex], subjects[target]] = [subjects[target], subjects[subjectIndex]];
    }

    /** Создание предмета справочника прямо из редактора типа (если забыли завести его в
     *  /admin/subjects). Диалог тот же, что и в списке предметов; после успешного POST новый
     *  предмет попадает в выпадающий список и сразу добавляется строкой в текущую секцию. */
    createSubject(sectionIndex: number): void {
        const dialogRef = this.dialog.open<SubjectInput | undefined>(SubjectEditingDialogComponent, {
            width: '500px',
            data: { isEditing: false } as SubjectEditingDialogData
        });

        dialogRef.closed.subscribe((result) => {
            if (!result) return;

            this.isCreatingSubject = true;
            this.subjectService.createSubject(result).subscribe({
                next: (created: SubjectModel) => {
                    this.isCreatingSubject = false;
                    this.subjectsByCode.set(created.code, created);
                    this.rebuildSubjectOptions();
                    this.model.sections[sectionIndex].subjects.push({
                        subjectCode: created.code,
                        nameAz: created.nameAz,
                        sortOrder: 0
                    });
                    this.toastService.show('Fənn uğurla yaradıldı', 'success');
                },
                error: (err: any) => {
                    this.isCreatingSubject = false;
                    this.toastService.show(err?.error?.message || 'Fənn yaradılarkən xəta baş verdi', 'error');
                }
            });
        });
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
            monthAwardMinRank: this.model.monthAwardMinRank,
            isBase: this.model.isBase,
            active: this.model.active,
            sortOrder: this.model.sortOrder,
            sections: this.model.sections.map(section => ({
                ...(section.id ? { id: section.id } : {}),
                nameAz: section.nameAz.trim(),
                gradeFrom: Number(section.gradeFrom),
                gradeTo: Number(section.gradeTo),
                subjects: section.subjects.map((subject, index) => ({
                    subjectCode: subject.subjectCode,
                    nameAz: subject.nameAz,
                    sortOrder: index + 1
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
                this.saved = true;
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
