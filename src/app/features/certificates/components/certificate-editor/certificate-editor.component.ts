import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewInit,
    HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    LucideAngularModule,
    ArrowLeft,
    Plus,
    Save,
    Eye,
    Image as ImageIcon,
    Trash2,
    RotateCcw,
} from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ConfigService } from '../../../../core/services/config.service';
import { CertificateService } from '../../services/certificate.service';
import {
    CertificateField,
    CertificateFieldType,
    CertificateTemplate,
} from '../../../../core/models/certificate.model';

// Обязательные поля — без них конструктор только предупреждает при сохранении, не блокирует
// (CERTIFICATES_TASK.md §8.2).
const REQUIRED_TYPES: CertificateFieldType[] = [
    'month',
    'grade',
    'studentFullName',
    'schoolName',
    'teacherFullName',
    'examDate',
];

const FIELD_TYPE_LABELS: Record<CertificateFieldType, string> = {
    month: 'Ay',
    grade: 'Sinif',
    studentFullName: 'Şagirdin adı',
    schoolName: 'Məktəb',
    districtName: 'Rayon/şəhər',
    teacherFullName: 'Müəllim',
    examDate: 'Tarix',
    level: 'Pillə',
    previousLevel: 'Əvvəlki pillə',
    serial: 'Sertifikat nömrəsi',
    qr: 'QR kod',
    static: 'Sabit mətn',
};

function newField(type: CertificateFieldType, x: number, y: number): CertificateField {
    return {
        id: `f_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type,
        x,
        y,
        w: type === 'qr' ? 200 : 400,
        h: type === 'qr' ? 200 : 80,
        align: 'center',
        fontFamily: type === 'studentFullName' ? 'notoSerif' : 'montserrat',
        fontWeight: type === 'studentFullName' ? 'bold' : 'regular',
        italic: type === 'studentFullName',
        fontSize: 48,
        color: '#33333d',
        prefix: '',
        suffix: '',
        transform: 'none',
        autoShrink: type === 'studentFullName' || type === 'schoolName' || type === 'teacherFullName',
        minFontSize: 24,
        mask: null,
        text: type === 'static' ? 'Mətn' : undefined,
        multiline: false,
        lineHeight: 1.25,
    };
}

// Готовые фразы для двух вшитых-в-макет предложений, которые заказчик убрал с картинок
// (CERTIFICATES_V2_TASK.md, «Тексты фраз»). {placeholder}/{grade}/**жирный** — та же
// разметка, что admin может набрать руками; кнопки — просто быстрый старт.
const DEVELOPING_PHRASE =
    'İSİM layihəsi çərçivəsində {month} ayında {grade} siniflər arasında **{level} pilləsinə** yüksəldiyinə görə';
const CENTRALIZED_EXAM_PHRASE =
    'İSİM layihəsi çərçivəsində {month} ayında keçirilən Mərkəzləşmiş İmtahanlarda {grade} siniflər arasında göstərdiyi nəticələrə əsasən';

function phraseField(text: string, x: number, y: number, w: number, h: number): CertificateField {
    return {
        id: `f_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'static',
        x, y, w, h,
        align: 'center',
        fontFamily: 'montserrat',
        fontWeight: 'regular',
        italic: false,
        fontSize: 48,
        color: '#33333d',
        prefix: '',
        suffix: '',
        transform: 'none',
        autoShrink: true,
        minFontSize: 22,
        mask: null,
        text,
        multiline: true,
        lineHeight: 1.25,
        // Жирный кусок (**{level} pilləsinə** и т.п.) — тёмно-синий, как «Karyera və
        // Psixologiya» на самом шаблоне (та же краска, что и у ФИО ученика).
        boldColor: '#1b2a6b',
    };
}

// Плейсхолдеры, доступные в static-тексте — та же линейка типов, что резолвит
// certificate-render.service.ts (SimpleFieldType). Список и демо-значения для холста
// (previewRuns) должны совпадать 1:1 с backend'ом, иначе превью на холсте соврёт.
const PLACEHOLDER_CHIPS: { token: string; label: string }[] = [
    { token: 'month', label: 'Ay' },
    { token: 'grade', label: 'Sinif' },
    { token: 'studentFullName', label: 'Şagirdin adı' },
    { token: 'schoolName', label: 'Məktəb' },
    { token: 'districtName', label: 'Rayon/şəhər' },
    { token: 'teacherFullName', label: 'Müəllim' },
    { token: 'examDate', label: 'Tarix' },
    { token: 'level', label: 'Pillə' },
    { token: 'previousLevel', label: 'Əvvəlki pillə' },
    { token: 'serial', label: 'Nömrə' },
];

interface PreviewRun {
    text: string;
    bold: boolean;
}

interface DragState {
    kind: 'move' | 'resize';
    fieldId: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
}

@Component({
    selector: 'app-certificate-editor',
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, ButtonComponent, SelectComponent, InputComponent],
    templateUrl: './certificate-editor.component.html',
    styleUrl: './certificate-editor.component.scss',
})
export class CertificateEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvasWrapper') canvasWrapper!: ElementRef<HTMLDivElement>;
    @ViewChild('canvasImage') canvasImage!: ElementRef<HTMLImageElement>;
    @ViewChild('replaceImageInput') replaceImageInput!: ElementRef<HTMLInputElement>;

    readonly ArrowLeft = ArrowLeft;
    readonly Plus = Plus;
    readonly Save = Save;
    readonly Eye = Eye;
    readonly ImageIcon = ImageIcon;
    readonly Trash2 = Trash2;
    readonly RotateCcw = RotateCcw;

    readonly fieldTypeOptions: SelectOption[] = (Object.keys(FIELD_TYPE_LABELS) as CertificateFieldType[]).map((t) => ({
        value: t,
        label: FIELD_TYPE_LABELS[t],
    }));
    readonly fontFamilyOptions: SelectOption[] = [
        { value: 'montserrat', label: 'Montserrat' },
        { value: 'notoSerif', label: 'Noto Serif' },
    ];
    readonly fontWeightOptions: SelectOption[] = [
        { value: 'regular', label: 'Adi' },
        { value: 'semibold', label: 'Yarımqalın' },
        { value: 'bold', label: 'Qalın' },
    ];
    readonly alignOptions: SelectOption[] = [
        { value: 'left', label: 'Sola' },
        { value: 'center', label: 'Mərkəzə' },
        { value: 'right', label: 'Sağa' },
    ];
    readonly transformOptions: SelectOption[] = [
        { value: 'none', label: 'Yoxdur' },
        { value: 'upper', label: 'BÖYÜK HƏRFLƏR' },
        { value: 'lower', label: 'kiçik hərflər' },
        { value: 'capitalize', label: 'Hər Sözün Baş Hərfi' },
    ];

    template: CertificateTemplate | null = null;
    fields: CertificateField[] = [];
    selectedFieldId: string | null = null;
    newFieldType: CertificateFieldType = 'static';

    isLoading = true;
    isSaving = false;
    isPreviewing = false;
    testStudentResultId: number | null = null;

    scale = 1;
    private resizeObserver: ResizeObserver | null = null;
    private drag: DragState | null = null;

    // Копирование раскладки с другого шаблона той же награды (CERTIFICATE_LAYOUT_REUSE_TASK.md).
    // Новые шаблоны наследуют раскладку автоматически при создании — это для случая
    // "докрутил один шаблон, раскатать на остальные" / "испортил, верни как у другого".
    copySources: CertificateTemplate[] = [];
    copySourceId: number | null = null;
    isCopyingLayout = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private certificateService: CertificateService,
        private configService: ConfigService,
        private toast: ToastService
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.certificateService.getTemplate(id).subscribe({
            next: (template) => {
                this.template = template;
                this.fields = template.fields.map((f) => ({ ...f }));
                this.isLoading = false;
                this.loadCopySources(template);
            },
            error: () => {
                this.toast.show('Şablon tapılmadı', 'error');
                this.router.navigate(['/admin/certificates']);
            },
        });
    }

    private loadCopySources(current: CertificateTemplate): void {
        this.certificateService.listTemplates().subscribe({
            next: (templates) => {
                // Только та же награда (другая вёрстка/картинка у других наград не подходит)
                // и только уже настроенные шаблоны — копировать пустоту незачем.
                this.copySources = templates.filter(
                    (t) => t.id !== current.id && t.awardCode === current.awardCode && t.fields.length > 0
                );
            },
            error: () => (this.copySources = []),
        });
    }

    ngAfterViewInit(): void {
        this.resizeObserver = new ResizeObserver(() => this.recomputeScale());
        if (this.canvasWrapper) this.resizeObserver.observe(this.canvasWrapper.nativeElement);
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    onImageLoad(): void {
        this.recomputeScale();
    }

    private recomputeScale(): void {
        if (!this.canvasImage || !this.template) return;
        const width = this.canvasImage.nativeElement.clientWidth;
        if (width > 0) this.scale = width / this.template.imageWidth;
    }

    imageUrl(): string | null {
        return this.template ? this.configService.resolveAssetUrl(this.template.imagePath) : null;
    }

    get selectedField(): CertificateField | null {
        return this.fields.find((f) => f.id === this.selectedFieldId) ?? null;
    }

    selectField(id: string, event?: Event): void {
        event?.stopPropagation();
        this.selectedFieldId = id;
    }

    deselect(): void {
        this.selectedFieldId = null;
    }

    fieldLabel(field: CertificateField): string {
        return FIELD_TYPE_LABELS[field.type];
    }

    // Список добавленных полей (слоёв) в панели — на холсте несколько static-полей
    // визуально неотличимы друг от друга ("Sabit mətn" у всех), поэтому для static
    // показываем сам текст, обрезанный, вместо повторяющегося названия типа.
    fieldListLabel(field: CertificateField): string {
        if (field.type === 'static' && field.text) {
            const plain = field.text.replace(/\*\*/g, '');
            return plain.length > 32 ? `${plain.slice(0, 32)}…` : plain;
        }
        return this.fieldLabel(field);
    }

    removeField(id: string, event: Event): void {
        event.stopPropagation();
        this.fields = this.fields.filter((f) => f.id !== id);
        if (this.selectedFieldId === id) this.selectedFieldId = null;
    }

    fieldStyle(field: CertificateField): Record<string, string> {
        return {
            left: `${field.x * this.scale}px`,
            top: `${field.y * this.scale}px`,
            width: `${field.w * this.scale}px`,
            height: `${field.h * this.scale}px`,
            fontSize: `${field.fontSize * this.scale}px`,
            color: field.color,
            fontFamily: field.fontFamily === 'notoSerif' ? "'Noto Serif', serif" : "'Montserrat', sans-serif",
            fontWeight: field.fontWeight === 'bold' ? '700' : field.fontWeight === 'semibold' ? '600' : '400',
            fontStyle: field.italic ? 'italic' : 'normal',
            textAlign: field.align,
        };
    }

    private static readonly SAMPLE: Record<Exclude<CertificateFieldType, 'static' | 'qr'>, string> = {
        month: 'may',
        grade: '2-ci',
        studentFullName: 'Ələkbərov Rüstəm Rauf oğlu',
        schoolName: 'Sumqayıt şəhər 5 nömrəli məktəb',
        districtName: 'Sumqayıt şəhəri',
        teacherFullName: 'Hacıyeva Sevinc Sahib qızı',
        examDate: '30.05.2026',
        level: 'A',
        previousLevel: 'B',
        serial: 'ISIM-2026-000123',
    };

    // Демо-текст плейсхолдера — та же таблица, что бэкенд использует для {type} внутри
    // static (см. certificate-render.service.ts PLACEHOLDER_TYPES). Неизвестный токен
    // остаётся как есть, ровно как на сервере.
    private substitutePlaceholders(text: string): string {
        return text.replace(/\{(\w+)\}/g, (match, name) => {
            const value = (CertificateEditorComponent.SAMPLE as Record<string, string>)[name];
            return value !== undefined ? value : match;
        });
    }

    private previewRawText(field: CertificateField): string {
        if (field.type === 'qr') return '';
        const raw =
            field.type === 'static'
                ? this.substitutePlaceholders(field.text ?? '')
                : CertificateEditorComponent.SAMPLE[field.type];
        return `${field.prefix}${raw}${field.suffix}`;
    }

    // Приблизительное превью на холсте: **жирный** реально жирным, перенос строк —
    // силами браузера (white-space:normal в шаблоне), а не повторной реализацией
    // word-wrap из рендерера. Точная геометрия — только «Önizləmə (PDF)».
    previewRuns(field: CertificateField): PreviewRun[] {
        const text = this.previewRawText(field);
        const runs: PreviewRun[] = [];
        const re = /\*\*(.+?)\*\*/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
            if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false });
            runs.push({ text: m[1], bold: true });
            last = re.lastIndex;
        }
        if (last < text.length) runs.push({ text: text.slice(last), bold: false });
        return runs.length ? runs : [{ text: '', bold: false }];
    }

    // ---- Плейсхолдеры и готовые фразы (панель свойств) ----

    readonly placeholderChips = PLACEHOLDER_CHIPS;

    insertPlaceholder(token: string): void {
        const field = this.selectedField;
        if (!field || field.type !== 'static') return;
        field.text = `${field.text ?? ''}${field.text ? ' ' : ''}{${token}}`;
    }

    onMultilineToggle(enabled: boolean): void {
        const field = this.selectedField;
        if (!field) return;
        field.multiline = enabled;
        if (enabled && field.lineHeight === undefined) field.lineHeight = 1.25;
    }

    addDevelopingPhrase(): void {
        this.addPhraseField(DEVELOPING_PHRASE);
    }

    addCentralizedExamPhrase(): void {
        this.addPhraseField(CENTRALIZED_EXAM_PHRASE);
    }

    private addPhraseField(text: string): void {
        if (!this.template) return;
        const w = Math.min(1900, this.template.imageWidth - 200);
        const x = Math.round((this.template.imageWidth - w) / 2);
        const y = Math.round(this.template.imageHeight * 0.55);
        const field = phraseField(text, Math.max(0, x), Math.max(0, y), w, 220);
        this.fields.push(field);
        this.selectedFieldId = field.id;
    }

    // ---- Добавление / удаление ----

    addField(): void {
        if (!this.template) return;
        const cx = Math.round(this.template.imageWidth / 2 - 200);
        const cy = Math.round(this.template.imageHeight / 2 - 40);
        const field = newField(this.newFieldType, Math.max(0, cx), Math.max(0, cy));
        this.fields.push(field);
        this.selectedFieldId = field.id;
    }

    get copySourceOptions(): SelectOption[] {
        return this.copySources.map((t) => ({ value: t.id, label: t.name }));
    }

    copyLayoutFromSource(): void {
        if (!this.template || this.copySourceId === null) return;
        const source = this.copySources.find((t) => t.id === this.copySourceId);
        if (!source) return;

        const proceed = confirm(`Bütün sahələr "${source.name}" şablonundan köçürüləcək. Davam edilsin?`);
        if (!proceed) return;

        this.isCopyingLayout = true;
        this.certificateService.layoutFromTemplate(this.template.id, source.id).subscribe({
            next: (fields) => {
                this.isCopyingLayout = false;
                this.fields = fields;
                this.selectedFieldId = null;
                const sizeMismatch =
                    source.imageWidth !== this.template!.imageWidth || source.imageHeight !== this.template!.imageHeight;
                this.toast.show(
                    sizeMismatch
                        ? 'Sahələr köçürüldü — şablonların ölçüləri fərqlidir, yerləşdirmə miqyaslandı, yoxlayın'
                        : 'Sahələr seçilmiş şablondan köçürüldü',
                    sizeMismatch ? 'warning' : 'success'
                );
            },
            error: () => {
                this.isCopyingLayout = false;
                this.toast.show('Sahələr köçürülmədi', 'error');
            },
        });
    }

    resetToDefaultLayout(): void {
        const proceed = confirm('Bütün sahələr standart yerləşdirmə ilə əvəz olunacaq. Davam edilsin?');
        if (!proceed) return;
        this.certificateService.defaultLayout().subscribe({
            next: (fields) => {
                this.fields = fields;
                this.selectedFieldId = null;
                this.toast.show('Standart yerləşdirmə tətbiq edildi', 'success');
            },
            error: () => this.toast.show('Standart yerləşdirmə alınmadı', 'error'),
        });
    }

    toggleMask(enabled: boolean): void {
        const field = this.selectedField;
        if (!field) return;
        field.mask = enabled ? { color: '#ffffff', padding: 6 } : null;
    }

    toggleBoldColor(enabled: boolean): void {
        const field = this.selectedField;
        if (!field) return;
        field.boldColor = enabled ? (field.boldColor ?? '#1b2a6b') : undefined;
    }

    removeSelected(): void {
        if (!this.selectedFieldId) return;
        this.fields = this.fields.filter((f) => f.id !== this.selectedFieldId);
        this.selectedFieldId = null;
    }

    // ---- Drag / resize (px картинки, округление до целых, без выхода за границы) ----

    startMove(field: CertificateField, event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.selectedFieldId = field.id;
        this.drag = {
            kind: 'move',
            fieldId: field.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: field.x,
            startY: field.y,
            startW: field.w,
            startH: field.h,
        };
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
    }

    startResize(field: CertificateField, event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.selectedFieldId = field.id;
        this.drag = {
            kind: 'resize',
            fieldId: field.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: field.x,
            startY: field.y,
            startW: field.w,
            startH: field.h,
        };
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
    }

    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent): void {
        if (!this.drag || !this.template) return;
        const field = this.fields.find((f) => f.id === this.drag!.fieldId);
        if (!field) return;

        const dx = Math.round((event.clientX - this.drag.startClientX) / this.scale);
        const dy = Math.round((event.clientY - this.drag.startClientY) / this.scale);

        if (this.drag.kind === 'move') {
            field.x = this.clamp(this.drag.startX + dx, 0, this.template.imageWidth - field.w);
            field.y = this.clamp(this.drag.startY + dy, 0, this.template.imageHeight - field.h);
        } else {
            field.w = this.clamp(this.drag.startW + dx, 20, this.template.imageWidth - field.x);
            field.h = this.clamp(this.drag.startH + dy, 20, this.template.imageHeight - field.y);
        }
    }

    @HostListener('document:pointerup')
    onPointerUp(): void {
        this.drag = null;
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        const active = document.activeElement;
        const isTyping = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
        if (isTyping) return;

        const field = this.selectedField;
        if (!field || !this.template) return;

        const step = event.shiftKey ? 10 : 1;
        let handled = true;
        switch (event.key) {
            case 'ArrowLeft':
                field.x = this.clamp(field.x - step, 0, this.template.imageWidth - field.w);
                break;
            case 'ArrowRight':
                field.x = this.clamp(field.x + step, 0, this.template.imageWidth - field.w);
                break;
            case 'ArrowUp':
                field.y = this.clamp(field.y - step, 0, this.template.imageHeight - field.h);
                break;
            case 'ArrowDown':
                field.y = this.clamp(field.y + step, 0, this.template.imageHeight - field.h);
                break;
            case 'Delete':
            case 'Backspace':
                this.removeSelected();
                break;
            default:
                handled = false;
        }
        if (handled) event.preventDefault();
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Math.round(value)));
    }

    // ---- Сохранение / превью / замена картинки ----

    get missingRequiredTypes(): string[] {
        const present = new Set(this.fields.map((f) => f.type));
        return REQUIRED_TYPES.filter((t) => !present.has(t)).map((t) => FIELD_TYPE_LABELS[t]);
    }

    save(): void {
        if (!this.template) return;
        if (this.missingRequiredTypes.length > 0) {
            const proceed = confirm(
                `Bu sahələr əlavə edilməyib: ${this.missingRequiredTypes.join(', ')}. Yenə də yadda saxlansın?`
            );
            if (!proceed) return;
        }
        this.isSaving = true;
        this.certificateService.updateTemplateFields(this.template.id, this.fields).subscribe({
            next: (updated) => {
                this.template = updated;
                this.isSaving = false;
                this.toast.show('Yadda saxlanıldı', 'success');
            },
            error: () => {
                this.isSaving = false;
                this.toast.show('Yadda saxlanarkən xəta baş verdi', 'error');
            },
        });
    }

    preview(): void {
        if (!this.template) return;
        this.isPreviewing = true;
        this.certificateService
            .previewTemplate(this.template.id, this.fields, this.testStudentResultId ?? undefined)
            .subscribe({
                next: (blob) => {
                    this.isPreviewing = false;
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                },
                error: () => {
                    this.isPreviewing = false;
                    this.toast.show('Önizləmə alınarkən xəta baş verdi', 'error');
                },
            });
    }

    onReplaceImageSelected(event: Event): void {
        if (!this.template) return;
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        this.certificateService.replaceTemplateImage(this.template.id, file).subscribe({
            next: (updated) => {
                this.template = updated;
                this.toast.show('Şəkil dəyişdirildi', 'success');
                setTimeout(() => this.recomputeScale());
            },
            error: () => this.toast.show('Şəkil yüklənərkən xəta baş verdi', 'error'),
        });
        input.value = '';
    }

    goBack(): void {
        this.router.navigate(['/admin/certificates']);
    }
}
