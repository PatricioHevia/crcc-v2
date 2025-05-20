import { Routes } from '@angular/router';
import { LayoutAppComponent } from './landing/layout/layout-app/layout-app.component';
import { AuthLayoutComponent } from './auth/auth-layout/auth-layout.component';
import { AUTH_ROUTES } from './auth/auth.routes';
import { LANDING_ROUTES } from './landing/landing.routes';

export const routes: Routes = [
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
            {
                path: '',
                loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
            }
        ]
    },
    {
        path: '',
        component: LayoutAppComponent,
        children: [
            {
                path: '',
                loadChildren: () => import('./landing/landing.routes').then(m => m.LANDING_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];