import { Injectable } from "@angular/core";
import { ToastService, ToastType } from "../../../shared/components/ui/toast/toast.service";

@Injectable({
    providedIn: 'root'
})
export class SnackBarService {
    constructor(private toastService: ToastService) { }

    show(message: string, type: ToastType = 'info'): void {
        this.toastService.show(message, type);
    }
}
