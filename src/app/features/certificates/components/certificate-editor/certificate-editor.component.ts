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
    };
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
            },
            error: () => {
                this.toast.show('Şablon tapılmadı', 'error');
                this.router.navigate(['/admin/certificates']);
            },
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
            justifyContent: field.align === 'left' ? 'flex-start' : field.align === 'right' ? 'flex-end' : 'center',
            textAlign: field.align,
        };
    }

    previewText(field: CertificateField): string {
        const sample: Record<CertificateFieldType, string> = {
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
            qr: '',
            static: field.text || '',
        };
        if (field.type === 'qr') return '';
        return `${field.prefix}${sample[field.type]}${field.suffix}`;
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
