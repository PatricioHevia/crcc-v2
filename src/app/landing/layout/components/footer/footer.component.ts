import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [TranslateModule],
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

  constructor() { }

  ngOnInit() {
  }

}
