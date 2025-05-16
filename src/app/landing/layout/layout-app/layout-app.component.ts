import { Component, OnInit } from '@angular/core';
import TopBarComponent from '../components/top-bar/top-bar.component';

@Component({
  selector: 'app-layout-app',
  templateUrl: './layout-app.component.html',
  styleUrls: ['./layout-app.component.css'],
  imports: [TopBarComponent]
})
export class LayoutAppComponent implements OnInit {


  constructor() { }

  ngOnInit() {
  }

}
