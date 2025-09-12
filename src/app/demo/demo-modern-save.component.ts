import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { SchoolEditingDialogComponent } from '../features/schools/components/school-editing/school-editing-dialog.component';
import { StudentEditingDialogComponent } from '../features/students/components/student-editing/student-editing-dialog.component';
import { UserEditDialogComponent } from '../features/dashboard/components/user-edit-dialog/user-edit-dialog.component';
import { School } from '../core/models/school.model';
import { Student } from '../core/models/student.model';
import { UserEdit } from '../core/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-demo-modern-save',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ],
  template: `
    <div class="demo-container">
      <h1>Modern Save Functionality Demo</h1>
      <p class="demo-description">
        This demo showcases the new modern save functionality with improved UX, loading states, 
        success/error feedback, and better form validation.
      </p>
      
      <div class="demo-buttons">
        <button mat-raised-button color="primary" (click)="openSchoolDialog()">
          Open School Dialog (Create)
        </button>
        
        <button mat-raised-button color="primary" (click)="openSchoolEditDialog()">
          Open School Dialog (Edit)
        </button>
        
        <button mat-raised-button color="accent" (click)="openStudentDialog()">
          Open Student Dialog
        </button>
        
        <button mat-raised-button color="warn" (click)="openUserDialog()">
          Open User Dialog (Create)
        </button>
        
        <button mat-raised-button color="warn" (click)="openUserEditDialog()">
          Open User Dialog (Edit)
        </button>
      </div>

      <div class="features-list">
        <h2>New Features:</h2>
        <ul>
          <li>✨ Modern form container with gradient headers</li>
          <li>🔄 Loading states with spinners</li>
          <li>✅ Success feedback with animations</li>
          <li>❌ Error handling with auto-hide</li>
          <li>📝 Real-time form validation</li>
          <li>🎨 Beautiful Material Design 3 styling</li>
          <li>📱 Responsive design for mobile</li>
          <li>♿ Improved accessibility</li>
          <li>🌙 Dark mode support</li>
          <li>⚡ Smooth animations and transitions</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #1976d2;
      text-align: center;
      margin-bottom: 1rem;
    }

    .demo-description {
      text-align: center;
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .demo-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .demo-buttons button {
      min-width: 200px;
    }

    .features-list {
      margin-top: 2rem;
    }

    .features-list h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    .features-list ul {
      list-style: none;
      padding: 0;
    }

    .features-list li {
      padding: 0.5rem 0;
      color: #555;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .demo-container {
        margin: 1rem;
        padding: 1rem;
      }

      .demo-buttons {
        flex-direction: column;
        align-items: center;
      }

      .demo-buttons button {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class DemoModernSaveComponent {
  constructor(private dialog: MatDialog) {}

  openSchoolDialog() {
    const school: School = {
      _id: '',
      code: 0,
      name: '',
      address: '',
      active: true
    } as School;

    this.dialog.open(SchoolEditingDialogComponent, {
      width: '600px',
      data: { school, isEditing: false }
    });
  }

  openSchoolEditDialog() {
    const school: School = {
      _id: '123',
      code: 12345,
      name: 'Bakı Məktəbi №1',
      address: 'Bakı şəhəri',
      active: true,
      district: {
        _id: 'dist1',
        name: 'Bakı',
        code: 1
      }
    } as School;

    this.dialog.open(SchoolEditingDialogComponent, {
      width: '600px',
      data: { school, isEditing: true }
    });
  }

  openStudentDialog() {
    const student: Partial<Student> = {
      _id: '456',
      code: 12001,
      firstName: 'Ayşe',
      lastName: 'Əliyeva',
      middleName: 'Mübariz',
      grade: 9
    };

    this.dialog.open(StudentEditingDialogComponent, {
      width: '600px',
      data: { student: student as Student, isEditing: true }
    });
  }

  openUserDialog() {
    const user: Partial<UserEdit> = {
      email: '',
      password: '',
      role: undefined,
      isApproved: false
    };

    this.dialog.open(UserEditDialogComponent, {
      width: '500px',
      data: user as UserEdit
    });
  }

  openUserEditDialog() {
    const user: UserEdit = {
      _id: '789',
      email: 'admin@example.com',
      role: 'admin',
      isApproved: true
    };

    this.dialog.open(UserEditDialogComponent, {
      width: '500px',
      data: user
    });
  }
}
