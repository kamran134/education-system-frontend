import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Booklet, BookletDisciplines, BookletDistrict, BookletExam } from '../../../../core/models/booklet.model';
import { BookletService } from '../../../exams/services/booklet.service';
import { LucideAngularModule, BookOpen, MapPin, Calendar, Hash, Loader } from 'lucide-angular';

interface DisciplineTab {
    key: keyof BookletDisciplines;
    label: string;
}

@Component({
    selector: 'app-booklet-detail',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './booklet-detail.component.html',
    styleUrls: ['./booklet-detail.component.scss']
})
export class BookletDetailComponent implements OnInit {
    booklet: Booklet | null = null;
    isLoading = true;
    hasError = false;
    errorMessage = '';

    activeTab: keyof BookletDisciplines | null = null;

    readonly disciplineTabs: DisciplineTab[] = [
        { key: 'az',            label: 'Azərbaycan dili' },
        { key: 'math',          label: 'Riyaziyyat' },
        { key: 'lifeKnowledge', label: 'Həyat bilgisi' },
        { key: 'logic',         label: 'Məntiq' },
        { key: 'english',       label: 'İngilis dili' },
    ];

    // Icons
    readonly BookOpen = BookOpen;
    readonly MapPin = MapPin;
    readonly Calendar = Calendar;
    readonly Hash = Hash;
    readonly Loader = Loader;

    constructor(
        private route: ActivatedRoute,
        private bookletService: BookletService
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.hasError = true;
            this.errorMessage = 'Kitabça tapılmadı';
            this.isLoading = false;
            return;
        }
        this.bookletService.getBookletPublic(id).subscribe({
            next: (b) => {
                this.booklet = b;
                this.isLoading = false;
                // Select first available discipline tab
                const available = this.availableTabs;
                if (available.length > 0) {
                    this.activeTab = available[0].key;
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = err?.error?.message ?? 'Kitabça yüklənərkən xəta baş verdi';
            }
        });
    }

    get availableTabs(): DisciplineTab[] {
        if (!this.booklet?.disciplines) return [];
        return this.disciplineTabs.filter(
            tab => (this.booklet!.disciplines[tab.key]?.length ?? 0) > 0
        );
    }

    get activeAnswers(): string[] {
        if (!this.booklet || !this.activeTab) return [];
        return this.booklet.disciplines[this.activeTab] ?? [];
    }

    get districtName(): string {
        if (!this.booklet?.district) return '—';
        if (typeof this.booklet.district === 'object') {
            return (this.booklet.district as BookletDistrict).name;
        }
        return '—';
    }

    get examInfo(): string {
        if (!this.booklet?.exam) return '—';
        if (typeof this.booklet.exam === 'object') {
            const e = this.booklet.exam as BookletExam;
            const date = e.date ? new Date(e.date).toLocaleDateString('az-AZ') : '';
            return `${e.name} (${e.code})${date ? ' · ' + date : ''}`;
        }
        return '—';
    }

    selectTab(key: keyof BookletDisciplines): void {
        this.activeTab = key;
    }
}
