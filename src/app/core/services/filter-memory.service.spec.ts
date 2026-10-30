import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { FilterMemoryService, clearRememberedFilters } from './filter-memory.service';
import { restoreFiltersGuard } from '../guards/restore-filters.guard';

@Component({ template: '' })
class DummyComponent {}

describe('FilterMemoryService', () => {
    let router: Router;
    let location: Location;

    beforeEach(() => {
        sessionStorage.clear();
        TestBed.configureTestingModule({
            providers: [provideLocationMocks(), provideRouter([
                { path: 'students', component: DummyComponent, canActivate: [restoreFiltersGuard] },
                { path: 'students/:id', component: DummyComponent },
                { path: 'panel', component: DummyComponent },
            ])],
        });
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
    });

    afterEach(() => sessionStorage.clear());

    it('opens a page without memory as is', async () => {
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students');
    });

    it('restores the last filters when the page is opened bare', async () => {
        await router.navigateByUrl('/students?grades=3&districtIds=5');
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students?grades=3&districtIds=5');
        expect(TestBed.inject(FilterMemoryService).takeRestored()).toBeTrue();
    });

    it('records in-page URL rewrites (replaceUrl and Location.replaceState)', async () => {
        await router.navigateByUrl('/students');
        await router.navigate([], { queryParams: { grades: 7 }, replaceUrl: true });
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students?grades=7');

        location.replaceState('/students?grades=9');
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students?grades=9');
    });

    it('a cleared filter stays cleared', async () => {
        await router.navigateByUrl('/students?grades=3');
        await router.navigate([], { queryParams: {}, replaceUrl: true });
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students');
    });

    it('a link whose params are part of the remembered state gets the rest of it', async () => {
        await router.navigateByUrl('/students?teacherIds=4&grades=3');
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students?teacherIds=4');
        expect(location.path()).toBe('/students?teacherIds=4&grades=3');
    });

    it('an explicit link with other params wins and becomes the memory', async () => {
        await router.navigateByUrl('/students?districtIds=1&grades=3');
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students?districtIds=2');
        expect(location.path()).toBe('/students?districtIds=2');
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students?districtIds=2');
    });

    it('logout forgets everything', async () => {
        await router.navigateByUrl('/students?grades=3');
        clearRememberedFilters();
        await router.navigateByUrl('/panel');
        await router.navigateByUrl('/students');
        expect(location.path()).toBe('/students');
    });

    it('other pages are not recorded', async () => {
        await router.navigateByUrl('/students/12?source=students');
        expect(sessionStorage.length).toBe(0);
    });
});
