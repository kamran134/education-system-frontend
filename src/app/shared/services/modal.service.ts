import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ModalConfig {
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  data?: any;
}

export interface ModalRef<T = any> {
  componentInstance: T;
  afterClosed(): Observable<any>;
  close(result?: any): void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private viewContainerRef?: ViewContainerRef;
  private modals: ComponentRef<any>[] = [];

  setRootViewContainer(viewContainerRef: ViewContainerRef): void {
    this.viewContainerRef = viewContainerRef;
  }

  open<T>(component: Type<T>, config: ModalConfig = {}): ModalRef<T> {
    if (!this.viewContainerRef) {
      throw new Error('ViewContainerRef not set. Call setRootViewContainer first.');
    }

    // Создаем компонент
    const componentRef = this.viewContainerRef.createComponent(component);
    
    // Передаем данные если есть
    if (config.data) {
      (componentRef.instance as any).data = config.data;
    }

    this.modals.push(componentRef);

    // Создаем subject для результата
    const afterClosedSubject = new Subject<any>();

    // Создаем ModalRef
    const modalRef: ModalRef<T> = {
      componentInstance: componentRef.instance,
      afterClosed: () => afterClosedSubject.asObservable(),
      close: (result?: any) => {
        this.closeModal(componentRef);
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
      }
    };

    // Если компонент имеет метод setModalRef, вызываем его
    if (typeof (componentRef.instance as any).setModalRef === 'function') {
      (componentRef.instance as any).setModalRef(modalRef);
    }

    return modalRef;
  }

  closeAll(): void {
    this.modals.forEach(modal => this.closeModal(modal));
  }

  private closeModal(componentRef: ComponentRef<any>): void {
    const index = this.modals.indexOf(componentRef);
    if (index > -1) {
      this.modals.splice(index, 1);
    }
    componentRef.destroy();
  }
}