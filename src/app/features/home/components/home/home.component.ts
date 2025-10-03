import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { LucideAngularModule, Building2, GraduationCap, Users, UserCheck, FileText, TrendingUp } from 'lucide-angular';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIcon, LucideAngularModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    readonly Building2 = Building2;
    readonly GraduationCap = GraduationCap;
    readonly Users = Users;
    readonly UserCheck = UserCheck;
    readonly FileText = FileText;
    readonly TrendingUp = TrendingUp;

    constructor() {}

    ngOnInit(): void {}
}
