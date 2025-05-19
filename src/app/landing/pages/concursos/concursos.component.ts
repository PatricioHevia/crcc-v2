import { Component, OnInit } from '@angular/core';
import { CardConcursoComponent } from '../components/card-concurso/card-concurso.component';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.css'],
  imports: [CardConcursoComponent, TranslateModule, ButtonModule]
})
export class ConcursosComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
