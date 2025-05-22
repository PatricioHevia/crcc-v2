import { Routes } from '@angular/router';
import { LayoutAppComponent } from './landing/layout/layout-app/layout-app.component';
import { AuthLayoutComponent } from './auth/auth-layout/auth-layout.component';
import { AppLayoutComponent } from './appLayout/appLayout.component';

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
        path: 'admin',
        component: AppLayoutComponent,
        children: [
            {
                path: '',
                loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
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