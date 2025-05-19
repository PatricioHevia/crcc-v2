import { Component, OnInit } from '@angular/core';
import TopBarComponent from '../components/top-bar/top-bar.component';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-layout-app',
  templateUrl: './layout-app.component.html',
  styleUrls: ['./layout-app.component.css'],
  imports: [TopBarComponent, FooterComponent, RouterModule]
})
export class LayoutAppComponent implements OnInit {


  constructor() { }

  ngOnInit() {
  }

}
