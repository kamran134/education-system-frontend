import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Award, Plus, Pencil, Trash2, ImageOff } from 'lucide-angular';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ConfigService } from '../../../../core/services/config.service';
import { CertificateService } from '../../services/certificate.service';
import {
    CERTIFICATE_LEVELS,
    CertificateTemplate,
    DEVELOPING_STUDENT_AWARD,
} from '../../../../core/models/certificate.model';

// Пять пиллей заказчика (§1 плана). award_code пока один, но модель рассчитана на
// добавление 'student_of_the_month' и т.д. без изменения кода — см. §12 п.4 ТЗ.
const AWARDS: { code: string; label: string }[] = [
    { code: DEVELOPING_STUDENT_AWARD, label: 'İnkişaf edən şagird' },
];

interface TemplateSlot {
    awardCode: string;
    awardLabel: string;
    levelCode: string;
    levelLabel: string;
    template: CertificateTemplate | null;
}

@Component({
    selector: 'app-certificate-templates-list',
    imports: [CommonModule, FormsModule, LucideAngularModule, SelectComponent, InputComponent, ModalComponent],
    templateUrl: './certificate-templates-list.component.html',
    styleUrl: './certificate-templates-list.component.scss',
})
export class CertificateTemplatesListComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    readonly Award = Award;
    readonly Plus = Plus;
    readonly Pencil = Pencil;
    readonly Trash2 = Trash2;
    readonly ImageOff = ImageOff;

    slots: TemplateSlot[] = [];
    isLoading = true;

    isCreateModalOpen = false;
    createAwardCode = DEVELOPING_STUDENT_AWARD;
    createLevelCode = '';
    createName = '';
    selectedFile: File | null = null;
    isSaving = false;

    deleteTarget: CertificateTemplate | null = null;

    readonly awardOptions: SelectOption[] = AWARDS.map((a) => ({ value: a.code, label: a.label }));
    readonly levelOptions: SelectOption[] = CERTIFICATE_LEVELS.map((l) => ({ value: l.code, label: l.label }));

    constructor(
        private certificateService: CertificateService,
        private configService: ConfigService,
        private toast: ToastService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.isLoading = true;
        this.certificateService.listTemplates().subscribe({
            next: (templates) => {
                this.slots = this.buildSlots(templates);
                this.isLoading = false;
            },
            error: () => {
                this.toast.show('Şablonlar yüklənərkən xəta baş verdi', 'error');
                this.isLoading = false;
            },
        });
    }

    private buildSlots(templates: CertificateTemplate[]): TemplateSlot[] {
        const slots: TemplateSlot[] = [];
        for (const award of AWARDS) {
            for (const level of CERTIFICATE_LEVELS) {
                const template = templates.find((t) => t.awardCode === award.code && t.levelCode === level.code) ?? null;
                slots.push({
                    awardCode: award.code,
                    awardLabel: award.label,
                    levelCode: level.code,
                    levelLabel: level.label,
                    template,
                });
            }
        }
        return slots;
    }

    imageUrl(template: CertificateTemplate): string | null {
        return this.configService.resolveAssetUrl(template.imagePath);
    }

    openEditor(slot: TemplateSlot): void {
        if (slot.template) {
            this.router.navigate(['/admin/certificates', slot.template.id]);
        } else {
            this.openCreateModal(slot);
        }
    }

    openCreateModal(slot: TemplateSlot): void {
        this.createAwardCode = slot.awardCode;
        this.createLevelCode = slot.levelCode;
        this.createName = `${slot.awardLabel} — ${slot.levelLabel}`;
        this.selectedFile = null;
        this.isCreateModalOpen = true;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
    }

    get createModalButtons(): ModalButton[] {
        return [
            { label: 'Ləğv et', variant: 'outline', action: () => (this.isCreateModalOpen = false) },
            {
                label: 'Yarat',
                variant: 'primary',
                loading: this.isSaving,
                disabled: !this.selectedFile || !this.createName.trim(),
                action: () => this.submitCreate(),
            },
        ];
    }

    submitCreate(): void {
        if (!this.selectedFile || !this.createName.trim()) return;
        this.isSaving = true;
        this.certificateService
            .createTemplate({
                awardCode: this.createAwardCode,
                levelCode: this.createLevelCode || null,
                name: this.createName.trim(),
                image: this.selectedFile,
            })
            .subscribe({
                next: (template) => {
                    this.isSaving = false;
                    this.isCreateModalOpen = false;
                    this.toast.show('Şablon yaradıldı', 'success');
                    this.router.navigate(['/admin/certificates', template.id]);
                },
                error: (err) => {
                    this.isSaving = false;
                    this.toast.show(err?.error?.message || 'Şablon yaradılarkən xəta baş verdi', 'error');
                },
            });
    }

    confirmDelete(template: CertificateTemplate, event: Event): void {
        event.stopPropagation();
        this.deleteTarget = template;
    }

    get deleteModalButtons(): ModalButton[] {
        return [
            { label: 'Ləğv et', variant: 'outline', action: () => (this.deleteTarget = null) },
            { label: 'Sil', variant: 'danger', action: () => this.doDelete() },
        ];
    }

    private doDelete(): void {
        if (!this.deleteTarget) return;
        const id = this.deleteTarget.id;
        this.certificateService.deleteTemplate(id).subscribe({
            next: () => {
                this.toast.show('Şablon silindi', 'success');
                this.deleteTarget = null;
                this.load();
            },
            error: () => {
                this.toast.show('Şablon silinərkən xəta baş verdi', 'error');
                this.deleteTarget = null;
            },
        });
    }
}
