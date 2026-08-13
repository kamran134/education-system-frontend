import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../constants/snack-bar.config';

@Component({
    selector: 'app-snack-bar',
    imports: [MatSnackBarModule, CommonModule],
    templateUrl: './snack-bar.component.html',
    styleUrl: './snack-bar.component.scss'
})
export class SnackBarComponent {
    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}
}
