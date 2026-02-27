import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { UsersComponent } from './components/users/users.component';
import { StatsColumnsComponent } from './components/stats-columns/stats-columns.component';
import { LegacyImportComponent } from './components/legacy-import/legacy-import.component';
import { adminGuard } from '../../core/guards/admin.guard';
import { authGuard } from '../../core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { path: 'users', component: UsersComponent, canActivate: [adminGuard] },
            { path: 'rating-columns', component: StatsColumnsComponent, canActivate: [authGuard] },
            { path: 'legacy-import', component: LegacyImportComponent, canActivate: [adminGuard] },
            { path: '', redirectTo: 'rating-columns', pathMatch: 'full' }
        ]
    }
];
