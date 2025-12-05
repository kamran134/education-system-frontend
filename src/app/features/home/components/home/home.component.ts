import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Building2, GraduationCap, Users, UserCheck, FileText, TrendingUp, ClipboardList, BarChart3 } from 'lucide-angular';
import { PermissionsService } from '../../../../core/services/permissions.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    readonly Building2 = Building2;
    readonly GraduationCap = GraduationCap;
    readonly Users = Users;
    readonly UserCheck = UserCheck;
    readonly FileText = FileText;
    readonly ClipboardList = ClipboardList;
    readonly TrendingUp = TrendingUp;
    readonly BarChart3 = BarChart3;

    constructor(public permissions: PermissionsService) {}

    ngOnInit(): void {}
}