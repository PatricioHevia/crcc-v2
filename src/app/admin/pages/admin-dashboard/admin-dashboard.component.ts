import { Component, inject } from '@angular/core';
import { UserService } from '../../../auth/services/user.service';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [CommonModule, PanelModule, ButtonModule],
})
export class AdminDashboardComponent {

  userService = inject(UserService);

  header = 'Dashboard';
  nombreBoton = 'Ckick Me';
  icon = 'pi pi-check';

  cambiarNombreBoton(){
    this.nombreBoton = 'Cargando'
    this.icon = 'pi pi-spin pi-spinner';
    setTimeout(() => {
      this.resetearBoton();
    }
    , 2000);
  }

  resetearBoton(){
    this.nombreBoton = 'Ckick Me';
    this.icon = 'pi pi-check';
  }

  contenido = 'Contenido del Dashboard';
}
