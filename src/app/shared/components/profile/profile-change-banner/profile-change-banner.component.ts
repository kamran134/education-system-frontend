import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, ShieldAlert, Check, Pencil, X } from 'lucide-angular';
import { ProfileChangeRequest } from '../../../../core/models/profile-change.model';
import { ButtonComponent } from '../../ui/button/button.component';

interface DiffRow {
    label: string;
    before: string;
    after: string;
}

/**
 * Плашка модерации на профиле школы/учителя/района (BASE_FIXES_TASK.md §2.6). Владельцу —
 * спокойная («Məlumatlarınız təsdiq gözləyir», только его отправленные значения, без before/
 * after — он и так знает, что было раньше). Админу — заметная, с сравнением было→стало и
 * тремя действиями. «Düzəliş et» здесь не редактирует ничего сама: она просто эмиттит событие,
 * родительская страница открывает свою обычную форму редактирования фактов, предзаполненную
 * значениями заявки, — так не плодим вторую форму ради одного и того же набора полей.
 */
@Component({
    selector: 'app-profile-change-banner',
    imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent],
    templateUrl: './profile-change-banner.component.html',
})
export class ProfileChangeBannerComponent {
    @Input() pending: ProfileChangeRequest | null = null;
    @Input() isAdminView = false;
    @Input() fieldLabels: Record<string, string> = {};
    /** Текущие подтверждённые значения тех же полей — только для админского вида (было→стало). */
    @Input() current: Record<string, any> = {};
    @Input() isProcessing = false;

    @Output() approveClicked = new EventEmitter<void>();
    @Output() correctClicked = new EventEmitter<void>();
    @Output() rejectClicked = new EventEmitter<string | null>();

    readonly Clock = Clock;
    readonly ShieldAlert = ShieldAlert;
    readonly Check = Check;
    readonly Pencil = Pencil;
    readonly X = X;

    showRejectForm = false;
    rejectNote = '';

    private formatValue(value: any): string {
        if (value === null || value === undefined || value === '') return 'Doldurulmayıb';
        return String(value);
    }

    /** Text fields of the request; achievementFiles is not a field but a file-op carrier. */
    private get textKeys(): string[] {
        return this.pending ? Object.keys(this.pending.payload).filter((key) => key !== 'achievementFiles') : [];
    }

    /** "Düzəliş et" corrects text values only — a request made of files alone has nothing to correct. */
    get hasTextFields(): boolean {
        return this.textKeys.length > 0;
    }

    /** E.g. "2 yeni fayl, 1 faylın silinməsi"; null when the request has no file ops. */
    get filesSummary(): string | null {
        const ops = this.pending?.payload['achievementFiles'];
        const added = Array.isArray(ops?.add) ? ops.add.length : 0;
        const removed = Array.isArray(ops?.remove) ? ops.remove.length : 0;
        const parts: string[] = [];
        if (added > 0) parts.push(`${added} yeni fayl`);
        if (removed > 0) parts.push(`${removed} faylın silinməsi`);
        return parts.length > 0 ? parts.join(', ') : null;
    }

    get diffRows(): DiffRow[] {
        if (!this.pending) return [];
        return this.textKeys.map((key) => ({
            label: this.fieldLabels[key] ?? key,
            before: this.formatValue(this.current[key]),
            after: this.formatValue(this.pending!.payload[key]),
        }));
    }

    get ownFields(): DiffRow[] {
        if (!this.pending) return [];
        return this.textKeys.map((key) => ({
            label: this.fieldLabels[key] ?? key,
            before: '',
            after: this.formatValue(this.pending!.payload[key]),
        }));
    }

    toggleRejectForm(): void {
        this.showRejectForm = !this.showRejectForm;
        this.rejectNote = '';
    }

    confirmReject(): void {
        this.rejectClicked.emit(this.rejectNote.trim() || null);
        this.showRejectForm = false;
        this.rejectNote = '';
    }
}
