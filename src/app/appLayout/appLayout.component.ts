import { Component, computed, inject, OnInit } from '@angular/core';
import { TopComponent } from './components/top/top.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { LayoutService } from './layout.service';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from './components/drawer/drawer.component';

@Component({
  selector: 'app-appLayout',
  templateUrl: './appLayout.component.html',
  styleUrls: ['./appLayout.component.css'],
  imports: [ TopComponent, SidebarComponent, RouterModule, CommonModule, DrawerComponent]
})
export class AppLayoutComponent implements OnInit {

  layoutService = inject(LayoutService);

  readonly containerClass = computed(() => ({
    'layout-wrapper': true,
    'layout-menu-active': this.layoutService.showMenu(),
  }));
  
  ngOnInit() {
  }

}
