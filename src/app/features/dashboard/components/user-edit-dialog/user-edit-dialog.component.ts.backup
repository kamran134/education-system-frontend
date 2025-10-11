import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { UserEdit } from '../../../../core/models/user.model';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
    selector: 'app-user-edit-dialog',
    standalone: true,
    imports: [
        MatDialogContent,
        MatInputModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        FormsModule,
        CommonModule
    ],
    templateUrl: './user-edit-dialog.component.html',
    styleUrl: './user-edit-dialog.component.scss'
})
export class UserEditDialogComponent {
    repeatedPassword: string = '';
    emailPattern: string = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    };

    constructor(
        public dialogRef: MatDialogRef<UserEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dataSource: UserEdit,
        private authService: AuthService,
        private matSnackBar: MatSnackBar,
    ) {}

    isSuperAdmin(): boolean {
        return this.authService.isSuperAdmin();
    }

    isNewUser(): boolean {
        return !this.dataSource._id;
    }

    onSave(): void {
        if (this.isNewUser()) {
            // Create new user logic
            if (!this.dataSource.email || !this.dataSource.password) {
                this.matSnackBar.open('Email və şifrə mütləqdir!', '', this.matSnackConfig);
                return;
            }
            if (this.dataSource.password !== this.repeatedPassword) {
                this.matSnackBar.open('Şifrələr uyğun gəlmir!', '', this.matSnackConfig);
                return;
            }
            if (!this.dataSource.role) {
                this.matSnackBar.open('Rol seçilməlidir!', '', this.matSnackConfig);
                return;
            }
        }

        if (this.dataSource.email && !new RegExp(this.emailPattern).test(this.dataSource.email)) {
            this.matSnackBar.open('Email formatı düzgün deyil!', '', this.matSnackConfig);
            return;
        }
        if (!this.dataSource.email) {
            this.matSnackBar.open('Email mütləqdir!', '', this.matSnackConfig);
            return;
        }

        this.dialogRef.close(this.dataSource);
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
