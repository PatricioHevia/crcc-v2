import { Routes } from '@angular/router';
import { LayoutAppComponent } from './landing/layout/layout-app/layout-app.component';

export const routes: Routes = [
    {
        path: '',
        component:LayoutAppComponent,
        children: [
            {
                path: '',
                loadChildren: () => import('./landing/landing.routes').then(m => m.LANDING_ROUTES)
            }
        ]
    }
];
