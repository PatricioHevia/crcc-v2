import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { OrganizationService } from '../../../auth/services/organization.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../auth/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Account } from '../../../auth/models/account-interface';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [TranslateModule, CommonModule, TableModule],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private orgSvc = inject(OrganizationService);
  private translationService = inject(TranslationService);


  lang = computed(() => this.translationService.currentLang());

  usuarios = this.userService.usuarios;
  loading = this.userService.usuariosLoading;
  totalUsers = 0;
  organizaciones = computed(() => this.orgSvc.Organizations);

  ngOnInit(): void {
    this.userService.getTotalUsers().then(total => {
      this.totalUsers = total;
    }
    );
  }


  getOrgName(id: string): Signal<string | null> {
    return this.orgSvc.getOrganizationNameById(id);
  }

  onEdit(user: Account): void {
    // TODO: implementar lógica de actualización de usuario
  }

}
