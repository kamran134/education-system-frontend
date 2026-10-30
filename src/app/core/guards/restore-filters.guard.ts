import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { FilterMemoryService } from '../services/filter-memory.service';

/** Puts back the filters last used on this page in this browser tab (see FilterMemoryService).
 *  Goes last in `canActivate`, after authGuard/roleGuard. */
export const restoreFiltersGuard: CanActivateFn = (_route, state) => inject(FilterMemoryService).restore(state.url);
