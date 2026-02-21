import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Database, Upload, School, Users, GraduationCap, FileText } from 'lucide-angular';

@Component({
    selector: 'app-legacy-import',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule
    ],
    templateUrl: './legacy-import.component.html',
    styleUrl: './legacy-import.component.scss'
})
export class LegacyImportComponent {
    // Icons
    readonly Database = Database;
    readonly Upload = Upload;
    readonly School = School;
    readonly Users = Users;
    readonly GraduationCap = GraduationCap;
    readonly FileText = FileText;

    importSections = [
        {
            id: 'schools',
            title: 'Məktəblər',
            description: 'Köhnə bazadan məktəb məlumatlarını idxal edin',
            icon: School,
            disabled: false
        },
        {
            id: 'teachers',
            title: 'Müəllimlər',
            description: 'Köhnə bazadan müəllim məlumatlarını idxal edin',
            icon: Users,
            disabled: false
        },
        {
            id: 'students',
            title: 'Şagirdlər',
            description: 'Köhnə bazadan şagird məlumatlarını idxal edin',
            icon: GraduationCap,
            disabled: false
        },
        {
            id: 'results',
            title: 'Şagird nəticələri',
            description: 'Köhnə bazadan şagird nəticələrini idxal edin',
            icon: FileText,
            disabled: false
        }
    ];

    onImport(sectionId: string): void {
        console.log(`Import started for: ${sectionId}`);
        // TODO: Implement import logic
    }
}
