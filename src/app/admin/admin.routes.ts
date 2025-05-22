import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { AdminProjectsComponent } from './pages/admin-projects/admin-projects.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { OfficesComponent } from './pages/offices/offices.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: '', redirectTo: 'dashboard', pathMatch: 'full'
    }, 
    {
        path: 'dashboard',
        component: AdminDashboardComponent   
    }, 
    {
        path: 'users',
        component: UsersComponent        
    },
    {
        path: 'projects',
        component: AdminProjectsComponent
    },
    {
        path: 'organizations',
        component: OrganizationsComponent
    },
    {
        path: 'offices',
        component: OfficesComponent
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
    
];