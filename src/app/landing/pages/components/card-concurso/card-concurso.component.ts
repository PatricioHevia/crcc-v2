import { Component, computed, inject } from '@angular/core';
import { UserService } from '../../../../auth/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-concurso',
  templateUrl: './card-concurso.component.html',
  styleUrls: ['./card-concurso.component.css'],
  imports: [CommonModule],
})
export class CardConcursoComponent  {

  userService = inject(UserService);

  user = computed(() => this.userService.usuario());
  usuarios = computed(() => this.userService.usuarios());

}
