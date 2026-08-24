import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { AdminTokenStatsComponent } from '../../shared/components/admin-token-stats.component';
import { UserSessionsComponent } from '../../shared/components/user-sessions.component';
import { LucideAngularModule, Shield, BarChart, User, Settings, Info, ShieldCheck, Eye, Users, Server, CreditCard, Database, Clock, CheckCircle } from 'lucide-angular';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { TabsComponent, TabItem } from '../../shared/components/ui/tabs/tabs.component';

@Component({
    selector: 'app-admin-dashboard',
    imports: [
    LucideAngularModule,
    ButtonComponent,
    AdminTokenStatsComponent,
    UserSessionsComponent,
    TabsComponent
],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    selectedTabIndex = 0;

    readonly tabs: TabItem[] = [
        { label: 'Token Statistikası', icon: BarChart },
        { label: 'Şəxsi Sessiyalar', icon: User },
        { label: 'Sistem', icon: Settings },
    ];

    // Icons
    readonly Shield = Shield;
    readonly Info = Info;
    readonly ShieldCheck = ShieldCheck;
    readonly Eye = Eye;
    readonly Users = Users;
    readonly Server = Server;
    readonly CreditCard = CreditCard;
    readonly Database = Database;
    readonly Clock = Clock;
    readonly CheckCircle = CheckCircle;

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        // Компонент готов к использованию
    }

    selectTab(index: number): void {
        this.selectedTabIndex = index;
    }

    viewSystemLogs(): void {
        // Здесь будет переход к системным логам
        console.log('Navigate to system logs');
    }

    viewUserManagement(): void {
        // Здесь будет переход к управлению пользователями
        console.log('Navigate to user management');
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}