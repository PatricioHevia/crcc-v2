import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { OfficesComponent } from './pages/offices/offices.component'; // Asumo que tienes este
import { AdminProjectsComponent } from './pages/admin-projects/admin-projects.component'; // Nuevo
import { superAdminGuard } from '../core/guards/super-admin.guard'; // Importa la guardia
import { mandanteAdminGuard } from '../core/guards/mandante-admin.guard';
import { adminGuard } from '../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [mandanteAdminGuard],
    data: { title: 'SIDEBAR.DASHBOARD' },
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [adminGuard],
    data: { title: 'SIDEBAR.USERS' },
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
    canActivate: [mandanteAdminGuard],
    data: { title: 'SIDEBAR.ORGANIZATIONS' },
  },
  {
    path: 'offices', // Ejemplo, si tienes esta ruta
    component: OfficesComponent,
    canActivate: [superAdminGuard],
    data: { title: 'SIDEBAR.OFFICES' },
  },
  {
    path: 'projects', // Nueva ruta para administrar proyectos
    component: AdminProjectsComponent,
    canActivate: [superAdminGuard], // ¡Aquí aplicamos la guardia!
    data: { title: 'SIDEBAR.PROJECTS' }, // Asegúrate de tener esta clave en tus i18n JSON
  },
  // ... más rutas si las tienes
];