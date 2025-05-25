import { Component, input, model, OnInit } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Account } from '../../../auth/models/account-interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css'],
  imports:[DrawerModule, InputTextModule, SelectModule, CommonModule  ]
})
export class UpdateUserComponent implements OnInit {
  visible = model(false);
  userToUpdate = input<Account | null>(null); // Para almacenar el usuario a actualizar

  constructor() { }

  ngOnInit() {
  }

}
