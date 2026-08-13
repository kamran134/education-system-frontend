import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Building2, Landmark, GraduationCap, Users, UserCheck, FileText, TrendingUp, ClipboardList, BarChart3, BookOpen } from 'lucide-angular';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';

/** Роли с привязанной сущностью — им показываем profile-блок вместо заголовка İSİM. */
const PROFILE_ROLES = ['student', 'teacher', 'schoolDirector', 'districtRepresenter', 'regionRepresenter'];

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterModule, LucideAngularModule, ProfileHeaderComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    readonly Building2 = Building2;
    readonly Landmark = Landmark;
    readonly GraduationCap = GraduationCap;
    readonly Users = Users;
    readonly UserCheck = UserCheck;
    readonly FileText = FileText;
    readonly ClipboardList = ClipboardList;
    readonly TrendingUp = TrendingUp;
    readonly BarChart3 = BarChart3;
    readonly BookOpen = BookOpen;

    constructor(public permissions: PermissionsService, private authService: AuthService) {}

    get hasProfileHeader(): boolean {
        const role = this.authService.getRole();
        return !!role && PROFILE_ROLES.includes(role);
    }

    ngOnInit(): void {}
}
