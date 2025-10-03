import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component';

export const PROFILE_ROUTES: Routes = [
    {
        path: '',
        component: UserProfileComponent,
        title: 'İstifadəçi Profili'
    }
];