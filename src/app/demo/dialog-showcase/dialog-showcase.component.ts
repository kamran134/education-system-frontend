import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle, CheckCircle, Info, AlertTriangle, MessageSquare } from 'lucide-angular';
import { DialogService } from '../../shared/components/ui/dialog';

@Component({
    selector: 'app-dialog-showcase',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
        <div class="p-6 space-y-4 max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Dialog System Showcase</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Basic Dialogs -->
                <div class="space-y-3">
                    <h3 class="text-lg font-semibold text-gray-800">Basic Dialogs</h3>
                    
                    <button 
                        (click)="showInfoDialog()"
                        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <div class="flex items-center justify-center space-x-2">
                            <lucide-icon [img]="Info" class="h-4 w-4"></lucide-icon>
                            <span>Info Dialog</span>
                        </div>
                    </button>
                    
                    <button 
                        (click)="showSuccessDialog()"
                        class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <div class="flex items-center justify-center space-x-2">
                            <lucide-icon [img]="CheckCircle" class="h-4 w-4"></lucide-icon>
                            <span>Success Dialog</span>
                        </div>
                    </button>
                    
                    <button 
                        (click)="showWarningDialog()"
                        class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                        <div class="flex items-center justify-center space-x-2">
                            <lucide-icon [img]="AlertTriangle" class="h-4 w-4"></lucide-icon>
                            <span>Warning Dialog</span>
                        </div>
                    </button>
                    
                    <button 
                        (click)="showErrorDialog()"
                        class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <div class="flex items-center justify-center space-x-2">
                            <lucide-icon [img]="AlertCircle" class="h-4 w-4"></lucide-icon>
                            <span>Error Dialog</span>
                        </div>
                    </button>
                </div>
                
                <!-- Confirm Dialogs -->
                <div class="space-y-3">
                    <h3 class="text-lg font-semibold text-gray-800">Confirm Dialogs</h3>
                    
                    <button 
                        (click)="showConfirmDialog()"
                        class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Confirm Dialog
                    </button>
                    
                    <button 
                        (click)="showDeleteConfirm()"
                        class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete Confirm
                    </button>
                </div>
                
                <!-- Custom Dialogs -->
                <div class="space-y-3">
                    <h3 class="text-lg font-semibold text-gray-800">Custom Dialogs</h3>
                    
                    <button 
                        (click)="showCustomDialog()"
                        class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Custom Dialog
                    </button>
                    
                    <button 
                        (click)="showLargeDialog()"
                        class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Large Dialog
                    </button>
                    
                    <button 
                        (click)="showCustomActionsDialog()"
                        class="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                        Custom Actions
                    </button>
                </div>
            </div>
            
            <!-- Results Display -->
            <div *ngIf="lastResult" class="mt-6 p-4 bg-gray-100 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-2">Last Action Result:</h4>
                <p class="text-gray-600">{{ lastResult }}</p>
            </div>
        </div>
    `
})
export class DialogShowcaseComponent {
    lastResult = '';
    
    // Icons
    readonly Info = Info;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly AlertCircle = AlertCircle;
    readonly MessageSquare = MessageSquare;
    
    constructor(private dialogService: DialogService) {}
    
    showInfoDialog(): void {
        const dialogRef = this.dialogService.alert({
            title: 'Məlumat',
            content: 'Bu məlumat dialoqxanasıdır. Məlumatları göstərmək üçün istifadə olunur.',
            type: 'info'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Info dialog confirmed';
        });
    }
    
    showSuccessDialog(): void {
        const dialogRef = this.dialogService.success({
            title: 'Uğurlu əməliyyat',
            content: 'Əməliyyat uğurla icra edildi! Artıq növbəti addıma keçə bilərsiniz.',
            confirmText: 'Əla!'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Success dialog confirmed';
        });
    }
    
    showWarningDialog(): void {
        const dialogRef = this.dialogService.warning({
            title: 'Diqqət!',
            content: 'Bu əməliyyat geri qaytarıla bilməz. Davam etmək istədiyinizdən əminsiniz mi?',
            confirmText: 'Bəli, davam et',
            cancelText: 'Xeyr, ləğv et'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Warning dialog confirmed';
        });
        
        dialogRef.cancelled$.subscribe(() => {
            this.lastResult = 'Warning dialog cancelled';
        });
    }
    
    showErrorDialog(): void {
        const dialogRef = this.dialogService.error({
            title: 'Xəta baş verdi',
            content: 'Əməliyyat zamanı gözlənilməz xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
            confirmText: 'Anladım'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Error dialog confirmed';
        });
    }
    
    showConfirmDialog(): void {
        const dialogRef = this.dialogService.confirm({
            title: 'Təsdiq tələb olunur',
            content: 'Bu əməliyyatı həyata keçirmək istədiyinizdən əminsiniz mi?',
            confirmText: 'Bəli',
            cancelText: 'Xeyr'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Confirm dialog confirmed';
        });
        
        dialogRef.cancelled$.subscribe(() => {
            this.lastResult = 'Confirm dialog cancelled';
        });
    }
    
    showDeleteConfirm(): void {
        const dialogRef = this.dialogService.confirm({
            title: 'Silinməyə razılıq',
            content: 'Bu elementi silmək istədiyinizdən əminsiniz mi? Bu əməliyyat geri qaytarıla bilməz!',
            type: 'error',
            confirmText: 'Sil',
            cancelText: 'Ləğv et'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Delete confirmed';
        });
        
        dialogRef.cancelled$.subscribe(() => {
            this.lastResult = 'Delete cancelled';
        });
    }
    
    showCustomDialog(): void {
        const dialogRef = this.dialogService.open({
            title: 'Xüsusi dialoq',
            content: 'Bu xüsusi konfiqurasiyaya malik dialoqxanasıdır. İstənilən məzmun və düymələr əlavə edilə bilər.',
            type: 'custom',
            icon: this.MessageSquare,
            size: 'md',
            closeOnOverlayClick: false,
            actions: [
                {
                    label: 'Ləğv et',
                    action: () => {
                        this.lastResult = 'Custom dialog cancelled';
                        dialogRef.close();
                    },
                    variant: 'secondary'
                },
                {
                    label: 'Saxla',
                    action: () => {
                        this.lastResult = 'Custom dialog saved';
                        dialogRef.close();
                    },
                    variant: 'primary'
                },
                {
                    label: 'Sil',
                    action: () => {
                        this.lastResult = 'Custom dialog deleted';
                        dialogRef.close();
                    },
                    variant: 'danger'
                }
            ]
        });
    }
    
    showLargeDialog(): void {
        const longContent = `
            <h3 class="text-lg font-semibold mb-3">Geniş məzmunlu dialoq</h3>
            <p class="mb-3">Bu böyük ölçüli dialoqxanasıdır. Çoxlu məlumat və ya forma sahələri üçün istifadə edilir.</p>
            <p class="mb-3">Bu yerə istənilən HTML məzmunu əlavə edilə bilər:</p>
            <ul class="list-disc list-inside space-y-1 mb-3">
                <li>Formalar</li>
                <li>Cədvəllər</li>
                <li>Şəkillər</li>
                <li>Videolar</li>
                <li>Və s.</li>
            </ul>
            <p>Dialoq avtomatik olaraq məzmun ölçüsünə uyğunlaşır.</p>
        `;
        
        const dialogRef = this.dialogService.open({
            title: 'Böyük dialoq',
            content: longContent,
            size: 'xl',
            type: 'info'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.lastResult = 'Large dialog confirmed';
        });
    }
    
    showCustomActionsDialog(): void {
        let isLoading = false;
        
        const dialogRef = this.dialogService.open({
            title: 'Müxtəlif düymələr',
            content: 'Bu dialoqda müxtəlif növ düymələr və yükləmə vəziyyəti nümayiş etdirilir.',
            actions: [
                {
                    label: 'Bağla',
                    action: () => {
                        dialogRef.close();
                        this.lastResult = 'Custom actions dialog closed';
                    },
                    variant: 'secondary'
                },
                {
                    label: 'Saxla',
                    action: () => {
                        // Simulate loading
                        isLoading = true;
                        setTimeout(() => {
                            isLoading = false;
                            this.lastResult = 'Custom actions dialog saved';
                            dialogRef.close();
                        }, 2000);
                    },
                    variant: 'success',
                    loading: isLoading
                },
                {
                    label: 'Yenilə',
                    action: () => {
                        this.lastResult = 'Custom actions dialog refreshed';
                    },
                    variant: 'primary'
                },
                {
                    label: 'Sil',
                    action: () => {
                        this.lastResult = 'Custom actions dialog deleted';
                        dialogRef.close();
                    },
                    variant: 'danger'
                }
            ]
        });
    }
}