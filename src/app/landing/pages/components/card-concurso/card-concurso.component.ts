import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-card-concurso',
  templateUrl: './card-concurso.component.html',
  styleUrls: ['./card-concurso.component.css']
})
export class CardConcursoComponent implements OnInit {

  constructor(private ts:TranslationService) { }

 ngOnInit(): void {
   
 }


}
