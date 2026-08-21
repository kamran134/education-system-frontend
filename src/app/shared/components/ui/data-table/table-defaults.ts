import { PageSizeOption } from './data-table.component';

export const TABLE_PAGE_SIZE_DEFAULT = 100;
export const TABLE_PAGE_SIZE_FULLSCREEN = 1000;
export const TABLE_EXPORT_PAGE_SIZE = 100000;

export const TABLE_PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 250, label: '250' },
  { value: 500, label: '500' },
  { value: 1000, label: '1000' },
  { value: 5000, label: '5000' },
];
