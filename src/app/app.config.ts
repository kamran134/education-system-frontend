import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateAdapter, MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { CustomDateAdapter } from './core/adapters/custom-date-adapter';
import { CUSTOM_DATE_FORMATS } from './core/services/custom-date-formats';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes), 
        provideClientHydration(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        importProvidersFrom(
            BrowserAnimationsModule,
            MatDialogModule,
            MatDatepickerModule,
            MatFormFieldModule,
            MatButtonModule,
            MatIconModule,
            MatNativeDateModule
        ),
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
        { provide: 'NG_HYDRATION', useValue: false }
    ]
};
