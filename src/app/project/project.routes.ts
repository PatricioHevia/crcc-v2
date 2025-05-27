import { Routes } from "@angular/router";
import { FichaGeneralComponent } from "./pages/ficha-general/ficha-general.component";
import { ProjectsListComponent } from "./pages/projects-list/projects-list.component";

export const PROJECT_ROUTES: Routes = [
    {
        path: 'projects',
        component: ProjectsListComponent
    },
    {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full',
    },
    {
        path: 'project/:id',
        component: FichaGeneralComponent
    },
    {
        path: '**',
        redirectTo: 'projects'
    }
]