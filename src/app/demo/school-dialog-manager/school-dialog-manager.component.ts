import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DialogService } from '../../shared/components/ui/dialog';
import { School as SchoolModel } from '../../core/models/school.model';

@Component({
    selector: 'app-school-dialog-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-6">School Dialog Examples</h2>
            
            <div class="space-y-4">
                <button 
                    (click)="openAddSchoolDialog()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add New School
                </button>
                
                <button 
                    (click)="openEditSchoolDialog()"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Edit Existing School
                </button>
                
                <button 
                    (click)="openDeleteSchoolDialog()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Delete School
                </button>
            </div>
            
            <div *ngIf="result" class="mt-4 p-4 bg-gray-100 rounded-lg">
                {{ result }}
            </div>
        </div>
    `
})
export class SchoolDialogManagerComponent {
    result = '';
    
    constructor(private dialogService: DialogService) {}
    
    openAddSchoolDialog(): void {
        const dialogRef = this.dialogService.open({
            title: 'Yeni məktəb əlavə et',
            size: 'lg',
            showFooter: false // We'll use custom actions
        });
        
        // Here we would dynamically create and insert the school editing component
        // For demonstration purposes, we'll show a simulated form
        this.openSchoolFormDialog(null, false);
    }
    
    openEditSchoolDialog(): void {
        // Simulate existing school data
        const existingSchool: SchoolModel = {
            id: '1',
            name: 'Example School',
            code: 123,
            address: 'Example Address',
            districtCode: 1,
            district: {
                id: '1',
                name: 'Example District',
                code: 1,
                region: 'Example Region',
                rate: 5,
                score: 100,
                averageScore: 85,
                studentCount: 500
            },
            active: true
        };
        
        this.openSchoolFormDialog(existingSchool, true);
    }
    
    openDeleteSchoolDialog(): void {
        const dialogRef = this.dialogService.confirm({
            title: 'Silinməyə razılıq',
            content: 'Məktəbi silmək istədiyinizdən əminsiniz mi?<br><br><strong>DİQQƏT!</strong> Məktəb silinərkən ona bağlı müəllimlər, şagirdlər və onların nəticələri də silinəcək!',
            type: 'error',
            confirmText: 'Bəli, Sil',
            cancelText: 'Ləğv et'
        });
        
        dialogRef.confirmed$.subscribe(() => {
            this.result = 'School would be deleted';
        });
        
        dialogRef.cancelled$.subscribe(() => {
            this.result = 'Deletion cancelled';
        });
    }
    
    private openSchoolFormDialog(school: SchoolModel | null, isEditing: boolean): void {
        const formData = school ? { ...school } : {
            id: '',
            name: '',
            code: 0,
            address: '',
            districtCode: 0,
            district: undefined,
            active: true
        };
        
        let isFormValid = false;
        let isLoading = false;
        
        const dialogRef = this.dialogService.open({
            title: isEditing ? 'Məktəbi redaktə et' : 'Yeni məktəb əlavə et',
            content: this.generateFormHTML(formData),
            size: 'lg',
            closeOnOverlayClick: false,
            actions: [
                {
                    label: 'Ləğv et',
                    action: () => {
                        dialogRef.close();
                        this.result = 'Form cancelled';
                    },
                    variant: 'secondary'
                },
                {
                    label: isEditing ? 'Yenilə' : 'Yarad',
                    action: () => {
                        if (this.validateForm(formData)) {
                            this.saveSchool(formData, isEditing, dialogRef);
                        }
                    },
                    variant: 'primary',
                    loading: isLoading,
                    disabled: !isFormValid
                }
            ]
        });
        
        // Simulate form validation
        setTimeout(() => {
            isFormValid = true;
            dialogRef.updateConfig({
                actions: [
                    {
                        label: 'Ləğv et',
                        action: () => {
                            dialogRef.close();
                            this.result = 'Form cancelled';
                        },
                        variant: 'secondary'
                    },
                    {
                        label: isEditing ? 'Yenilə' : 'Yarad',
                        action: () => {
                            if (this.validateForm(formData)) {
                                this.saveSchool(formData, isEditing, dialogRef);
                            }
                        },
                        variant: 'primary',
                        loading: isLoading,
                        disabled: false
                    }
                ]
            });
        }, 1000);
    }
    
    private generateFormHTML(school: any): string {
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Məktəb kodu</label>
                    <input 
                        type="number" 
                        value="${school.code || ''}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Məktəb kodunu daxil edin">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Məktəb adı</label>
                    <input 
                        type="text" 
                        value="${school.name || ''}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Məktəb adını daxil edin">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                    <textarea 
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Məktəbin ünvanını daxil edin">${school.address || ''}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rayon</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Rayon seçin</option>
                        <option value="1" ${school.district?.id === '1' ? 'selected' : ''}>Nümunə rayon</option>
                    </select>
                </div>
                
                <div class="flex items-center">
                    <input 
                        type="checkbox" 
                        id="active"
                        ${school.active ? 'checked' : ''}
                        class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <label for="active" class="ml-2 block text-sm text-gray-700">Aktiv</label>
                </div>
            </div>
        `;
    }
    
    private validateForm(school: any): boolean {
        return !!(school.name && school.code);
    }
    
    private saveSchool(school: any, isEditing: boolean, dialogRef: any): void {
        // Simulate API call
        setTimeout(() => {
            this.result = isEditing 
                ? `School "${school.name || 'Unknown'}" updated successfully`
                : `School "${school.name || 'New School'}" created successfully`;
            dialogRef.close();
        }, 1500);
    }
}