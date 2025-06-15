import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FilterParams } from '../models/filterParams.model';

@Injectable({
    providedIn: 'root'
})
export class StatsFilterService {
    selectedDistrictIds$ = new BehaviorSubject<string[]>([]);
    selectedSchoolIds$ = new BehaviorSubject<string[]>([]);
    selectedTeacherIds$ = new BehaviorSubject<string[]>([]);
    selectedGrades$ = new BehaviorSubject<string[]>([]);
    selectedExamId$ = new BehaviorSubject<string | undefined>(undefined);
    selectedMonth$ = new BehaviorSubject<string | undefined>(undefined);

    constructor() { }

    setDistrictIds(ids: string[]): void {
        this.selectedDistrictIds$.next(ids);
    }

    setSchoolIds(ids: string[]): void {
        this.selectedSchoolIds$.next(ids);
    }

    setTeacherIds(ids: string[]): void {
        this.selectedTeacherIds$.next(ids);
    }

    setGrades(grades: string[]): void {
        this.selectedGrades$.next(grades);
    }

    setExamId(examId: string | undefined): void {
        this.selectedExamId$.next(examId);
    }

    setMonth(month: string | undefined): void {
        this.selectedMonth$.next(month);
    }

    resetFilters(): void {
        this.selectedDistrictIds$.next([]);
        this.selectedSchoolIds$.next([]);
        this.selectedTeacherIds$.next([]);
        this.selectedGrades$.next([]);
        this.selectedExamId$.next(undefined);
        this.selectedMonth$.next(undefined);
    }

    getFilterParams(): FilterParams {
        return {
            districtIds: this.selectedDistrictIds$.value.join(","),
            schoolIds: this.selectedSchoolIds$.value.join(","),
            teacherIds: this.selectedTeacherIds$.value.join(","),
            grades: this.selectedGrades$.value.join(","),
            code: undefined,
            examId: this.selectedExamId$.value || undefined,
            month: this.selectedMonth$.value || undefined,
        };
    }
} 