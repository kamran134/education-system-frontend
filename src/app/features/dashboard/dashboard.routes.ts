import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { UsersComponent } from './components/users/users.component';
import { StatsColumnsComponent } from './components/stats-columns/stats-columns.component';
import { LegacyImportComponent } from './components/legacy-import/legacy-import.component';
import { RolesColumnsComponent } from './components/roles-columns/roles-columns.component';
import { AcademicYearComponent } from './components/academic-year/academic-year.component';
import { MetodikaEditorComponent } from './components/metodika-editor/metodika-editor.component';
import { CertificateTemplatesListComponent } from '../certificates/components/certificate-templates-list/certificate-templates-list.component';
import { CertificateEditorComponent } from '../certificates/components/certificate-editor/certificate-editor.component';
import { ProfileChangesComponent } from './components/profile-changes/profile-changes.component';
import { ExamTypesListComponent } from '../exam-types/components/exam-types-list/exam-types-list.component';
import { ExamTypeEditorComponent } from '../exam-types/components/exam-type-editor/exam-type-editor.component';
import { SubjectsListComponent } from '../exam-types/components/subjects-list/subjects-list.component';
import { LevelScalesViewComponent } from '../exam-types/components/level-scales-view/level-scales-view.component';
import { adminGuard } from '../../core/guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { path: 'users', component: UsersComponent, canActivate: [adminGuard] },
            { path: 'rating-columns', component: StatsColumnsComponent, canActivate: [adminGuard] },
            { path: 'profile-changes', component: ProfileChangesComponent, canActivate: [adminGuard] },
            { path: 'roles', component: RolesColumnsComponent, canActivate: [adminGuard] },
            { path: 'legacy-import', component: LegacyImportComponent, canActivate: [adminGuard] },
            { path: 'academic-year', component: AcademicYearComponent, canActivate: [adminGuard] },
            { path: 'metodika', component: MetodikaEditorComponent, canActivate: [adminGuard] },
            { path: 'certificates', component: CertificateTemplatesListComponent, canActivate: [adminGuard] },
            { path: 'certificates/:id', component: CertificateEditorComponent, canActivate: [adminGuard] },
            // IMTAHAN_NOVLERI_TASK.md §6 — админка справочников (шаг 1)
            { path: 'exam-types', component: ExamTypesListComponent, canActivate: [adminGuard] },
            { path: 'exam-types/new', component: ExamTypeEditorComponent, canActivate: [adminGuard] },
            { path: 'exam-types/:id', component: ExamTypeEditorComponent, canActivate: [adminGuard] },
            { path: 'subjects', component: SubjectsListComponent, canActivate: [adminGuard] },
            { path: 'level-scales', component: LevelScalesViewComponent, canActivate: [adminGuard] },
            { path: '', redirectTo: 'rating-columns', pathMatch: 'full' }
        ]
    }
];
