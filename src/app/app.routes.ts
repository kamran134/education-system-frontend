import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { HomeComponent } from './features/home/components/home/home.component';
import { DistrictsListComponent } from './features/districts/components/districts-list/districts-list.component';
import { RegionsListComponent } from './features/regions/components/regions-list/regions-list.component';
import { SchoolsListComponent } from './features/schools/components/schools-list/schools-list.component';
import { TeachersListComponent } from './features/teachers/components/teachers-list/teachers-list.component';
import { ExamsListComponent } from './features/exams/components/exams-list/exams-list.component';
import { StatsComponent } from './features/stats/components/stats-main/stats.component';
import { StatisticsMainComponent } from './features/statistics/components/statistics-main/statistics-main.component';
import { StudentsListComponent } from './features/students/components/students-list/students-list.component';
import { StudentDetailsComponent } from './features/students/components/student-details/student-details.component';
import { SchoolProfileComponent } from './features/schools/components/school-profile/school-profile.component';
import { TeacherProfileComponent } from './features/teachers/components/teacher-profile/teacher-profile.component';
import { DistrictProfileComponent } from './features/districts/components/district-profile/district-profile.component';
import { RegionProfileComponent } from './features/regions/components/region-profile/region-profile.component';
import { ExamResultsComponent } from './features/exam-results/components/exam-results.component';
import { BookletsListComponent } from './features/booklets/components/booklets-list/booklets-list.component';
import { BookletDetailComponent } from './features/booklets/components/booklet-detail/booklet-detail.component';
import { CertificateVerifyComponent } from './features/certificates/components/certificate-verify/certificate-verify.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/register/register/register.component';

export const routes: Routes = [
    // Публичный лендинг, без гварда — витрина продукта. Прежний HomeComponent (сетка ярлыков
    // по разделам под RBAC) переехал на /panel, это рабочий экран для авторизованных.
    { path: '', component: LandingComponent },
    { path: 'panel', component: HomeComponent, canActivate: [authGuard] },
    { path: 'regions', component: RegionsListComponent, canActivate: [authGuard, roleGuard('canAccessRegions')] },
    { path: 'regions/:id/districts', component: DistrictsListComponent, canActivate: [authGuard, roleGuard('canAccessRegions')] },
    // Профиль РТИ — не gated ролевым canAccessRegions, тот же паттерн, что у профилей
    // района/школы/учителя: regionRepresenter должен видеть СВОЙ профиль (это его домашняя
    // страница, PROFILE_AS_HOME_TASK.md), даже если canAccessRegions=false — тот флаг про
    // доступ к чужим спискам. Владение проверяется в компоненте и на бэкенде.
    { path: 'regions/:id/profile', component: RegionProfileComponent, canActivate: [authGuard] },
    { path: 'districts', component: DistrictsListComponent, canActivate: [authGuard, roleGuard('canAccessDistricts')] },
    { path: 'districts/:id/schools', component: SchoolsListComponent, canActivate: [authGuard, roleGuard('canAccessDistricts')] },
    // Профиль района — не gated ролевым canAccessDistricts, тот же паттерн, что у профиля
    // школы/учителя чуть ниже: districtRepresenter должен видеть/редактировать СВОЙ профиль,
    // даже если canAccessDistricts=false (тот флаг про доступ к чужим спискам, не про свою
    // же запись). Владение проверяется в компоненте (canEdit) и на бэкенде (canManageOwnEntity).
    { path: 'districts/:id/profile', component: DistrictProfileComponent, canActivate: [authGuard] },
    { path: 'schools', component: SchoolsListComponent, canActivate: [authGuard, roleGuard('canAccessSchools')] },
    { path: 'schools/:id/teachers', component: TeachersListComponent, canActivate: [authGuard, roleGuard('canAccessSchools')] },
    // Профиль школы/учителя — не gated ролевым canAccessSchools/canAccessTeachers: schoolDirector
    // и teacher должны видеть/редактировать СВОЙ профиль, даже если у них canAccessSchools/
    // canAccessTeachers=false (те флаги про доступ к чужим спискам, не про свою же запись).
    // Владение проверяется в самом компоненте (canEdit) и на бэкенде (canManageOwnEntity).
    { path: 'schools/:id/profile', component: SchoolProfileComponent, canActivate: [authGuard] },
    { path: 'teachers', component: TeachersListComponent, canActivate: [authGuard, roleGuard('canAccessTeachers')] },
    { path: 'teachers/:id/students', component: StudentsListComponent, canActivate: [authGuard, roleGuard('canAccessTeachers')] },
    { path: 'teachers/:id/profile', component: TeacherProfileComponent, canActivate: [authGuard] },
    { path: 'students', component: StudentsListComponent, canActivate: [authGuard, roleGuard('canAccessStudents')] },
    { path: 'students/:id', component: StudentDetailsComponent, canActivate: [authGuard, roleGuard('canAccessStudents')] },
    { path: 'exams', component: ExamsListComponent, canActivate: [authGuard, roleGuard('canAccessExams')] },
    { path: 'booklets', component: BookletsListComponent, canActivate: [authGuard, roleGuard('canAccessBooklets')] },
    { path: 'public/booklets/:id', component: BookletDetailComponent },
    // Публичная проверка сертификата по QR — без гварда, намеренно (CERTIFICATES_TASK.md §10)
    { path: 'sertifikat/:token', component: CertificateVerifyComponent },
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
