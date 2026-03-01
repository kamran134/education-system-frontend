import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home/home.component';
import { DistrictsListComponent } from './features/districts/components/districts-list/districts-list.component';
import { SchoolsListComponent } from './features/schools/components/schools-list/schools-list.component';
import { TeachersListComponent } from './features/teachers/components/teachers-list/teachers-list.component';
import { ExamsListComponent } from './features/exams/components/exams-list/exams-list.component';
import { StatsComponent } from './features/stats/components/stats-main/stats.component';
import { StatisticsMainComponent } from './features/statistics/components/statistics-main/statistics-main.component';
import { StudentsListComponent } from './features/students/components/students-list/students-list.component';
import { StudentDetailsComponent } from './features/students/components/student-details/student-details.component';
import { ExamResultsComponent } from './features/exam-results/components/exam-results.component';
import { BookletsListComponent } from './features/booklets/components/booklets-list/booklets-list.component';
import { BookletDetailComponent } from './features/booklets/components/booklet-detail/booklet-detail.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/register/register/register.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [authGuard] },
    { path: 'districts', component: DistrictsListComponent, canActivate: [authGuard, roleGuard('canAccessDistricts')] },
    { path: 'districts/:id/schools', component: SchoolsListComponent, canActivate: [authGuard, roleGuard('canAccessDistricts')] },
    { path: 'schools', component: SchoolsListComponent, canActivate: [authGuard, roleGuard('canAccessSchools')] },
    { path: 'schools/:id/teachers', component: TeachersListComponent, canActivate: [authGuard, roleGuard('canAccessSchools')] },
    { path: 'teachers', component: TeachersListComponent, canActivate: [authGuard, roleGuard('canAccessTeachers')] },
    { path: 'teachers/:id/students', component: StudentsListComponent, canActivate: [authGuard, roleGuard('canAccessTeachers')] },
    { path: 'students', component: StudentsListComponent, canActivate: [authGuard, roleGuard('canAccessStudents')] },
    { path: 'students/:id', component: StudentDetailsComponent, canActivate: [authGuard, roleGuard('canAccessStudents')] },
    { path: 'exams', component: ExamsListComponent, canActivate: [authGuard, roleGuard('canAccessExams')] },
    { path: 'booklets', component: BookletsListComponent, canActivate: [authGuard, roleGuard('canAccessBooklets')] },
    { path: 'public/booklets/:id', component: BookletDetailComponent },
    { path: 'exam-results', component: ExamResultsComponent, canActivate: [authGuard] },
    { path: 'stats', component: StatsComponent, canActivate: [authGuard, roleGuard('canAccessStats')] },
    { path: 'statistics', component: StatisticsMainComponent, canActivate: [authGuard] },
    { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [authGuard] },
    { path: 'admin', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.routes), canActivate: [authGuard] },
    { path: 'admin/dashboard', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '**', redirectTo: '' }
];
