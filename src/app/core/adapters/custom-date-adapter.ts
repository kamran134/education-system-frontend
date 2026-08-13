import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
    override parse(value: any): Date | null {
        if (typeof value === 'string' && value.includes('.')) {
            const [day, month, year] = value.split('.');
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
        return super.parse(value);
    }

    override format(date: Date, displayFormat: string): string {
        const day = this._to2digit(date.getDate());
        const month = this._to2digit(date.getMonth() + 1);
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    private _to2digit(n: number): string {
        return n < 10 ? `0${n}` : `${n}`;
    }
}