import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'roundNumber',
    standalone: true
})
export class RoundNumberPipe implements PipeTransform {

    transform(value: number): string {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value % 1 === 0) return value.toString();
        return value.toFixed(1);
    }
}
