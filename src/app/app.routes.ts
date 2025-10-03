import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home/home.component';
import { DistrictsListComponent } from './features/districts/components/districts-list/districts-list.component';
import { SchoolsListComponent } from './features/schools/components/schools-list/schools-list.component';
import { TeachersListComponent } from './features/teachers/components/teachers-list/teachers-list.component';
import { ExamsListComponent } from './features/exams/components/exams-list/exams-list.component';
import { StatsComponent } from './features/stats/components/stats-main/stats.component';
import { StudentsListComponent } from './features/students/components/students-list/students-list.component';
import { StudentDetailsComponent } from './features/students/components/student-details/student-details.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/register/register/register.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'districts', component: DistrictsListComponent, canActivate: [authGuard] },
    { path: 'schools', component: SchoolsListComponent, canActivate: [authGuard] },
    { path: 'teachers', component: TeachersListComponent, canActivate: [authGuard] },
    { path: 'students', component: StudentsListComponent, canActivate: [authGuard] },
    { path: 'students/:id', component: StudentDetailsComponent, canActivate: [authGuard] },
    { path: 'exams', component: ExamsListComponent, canActivate: [authGuard] },
    { path: 'stats', component: StatsComponent, canActivate: [authGuard] },
    { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [authGuard] },
    { path: 'admin', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.routes), canActivate: [authGuard] },
    { path: 'admin/dashboard', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '**', redirectTo: '' }
];