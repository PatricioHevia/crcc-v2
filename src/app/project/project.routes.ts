import { Routes } from "@angular/router";
import { FichaGeneralComponent } from "./pages/ficha-general/ficha-general.component";
import { ProjectsListComponent } from "./pages/projects-list/projects-list.component";
import { TenderListComponent } from "./pages/tenders/pages/tender-list/tender-list.component";
import { TenderComponent } from "./pages/tenders/pages/tender/tender.component";

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
        path: 'project/:id/tenders',
        component: TenderListComponent
    },
    {
        path: 'project/:id/tender/:tenderId',
        component: TenderComponent
    },
    {
        path: '**',
        redirectTo: 'projects'
    }
]