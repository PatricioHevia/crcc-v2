import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";
import { ProyectosComponent } from "./pages/proyectos/proyectos.component";
import { ConcursosComponent } from "./pages/concursos/concursos.component";
import { FaqComponent } from "./pages/faq/faq.component";
import { ContactoComponent } from "./pages/contacto/contacto.component";


export const LANDING_ROUTES: Routes = [ 
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'proyectos',
        component: ProyectosComponent
    },
    {
        path: 'concursos',
        component: ConcursosComponent
    },
    {
        path: 'faq',
        component: FaqComponent
    },
    {
        path: 'contacto',
        component: ContactoComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];