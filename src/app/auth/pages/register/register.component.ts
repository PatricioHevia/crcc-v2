import { Component, computed, inject, signal } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { StepperModule } from 'primeng/stepper';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { passwordsMatchValidator } from '../../../core/helpers/repeat-password';
import { orgTypes } from '../../../core/constants/organizationTypes';



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    ButtonModule,
    CommonModule,
    InputTextModule,
    CheckboxModule,
    FluidModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule,
    TranslateModule,
    DialogModule,
    ProgressSpinnerModule,
    RouterModule,
    StepperModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    SelectButtonModule,
    TooltipModule,
    DividerModule,
    FluidModule,
  ]
})
export class RegisterComponent {
  private theme = inject(ThemeService);
  public translation = inject(TranslationService);
  private fb = inject(FormBuilder);
  private orgS = inject(OrganizationService);
  private auth = inject(AuthService);
  private router = inject(Router);
  //Dialogs
  newOrgDialog = signal(false);
  lang = computed(() => this.translation.currentLang());

  // Organizaciones MAP ID-> Name
  orgOptions = this.orgS.getOrganizationsOptions();

  orgTypeOptions = computed(() => {
    const l = this.lang(); // "es" | "en" | "zh"
    return this.orgTypes.map(o => ({
      label: o.label[l],
      value: o.value
    }));
  });

  // tipo de usuario options
  // register.component.ts
  typeOption = [
    {
      label: { es: 'Empresa', en: 'Company', zh: '公司' },
      value: 'empresa',
      tooltip: {
        es: `Empresa:\n- Dashboards\n- Licitaciones`,
        en: `Company:\n- Dashboards\n- Tenders`,
        zh: `公司：\n- 仪表板\n- 招标`
      },
      icon: 'pi pi-building'
    },
    {
      label: { es: 'Individual', en: 'Individual', zh: '个人' },
      value: 'individual',
      tooltip: {
        es: `Individual:\n- Dashboards\n- Postulaciones\n- Concursos`,
        en: `Individual:\n- Dashboards\n- Applications\n- Contests`,
        zh: `个人：\n- 仪表板\n- 申请\n- 比赛`
      },
      icon: 'pi pi-user'
    }
  ];

  orgTypes = orgTypes;
  // formularios
  step1Form!: FormGroup;    // para nueva org
  userForm !: FormGroup;
  newOrgForm !: FormGroup;
  orgSelected = '';   // datos usuario / selección org


  dialogVisible = signal(false);
  loading = signal(false);
  registerSuccess = signal<boolean | null>(null);
  feedbackMessage = signal('');

  isDark = computed(() => this.theme.effectiveTheme() === 'dark');

  //Stepper
  activeIndex = signal(0);


  isSelected(option: { value: string }) {
    return this.step1Form.get('asOrg')?.value === option.value;
  }


  ngOnInit() {
    // paso 1
    this.step1Form = this.fb.group({
      asOrg: [null, Validators.required]
    });

    // datos usuario
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeat_password: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: passwordsMatchValidator
    });
    // nueva organización
    this.newOrgForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      tin: ['', [Validators.required, Validators.minLength(3)]],     // ← aquí ARRAY
      address: ['', [Validators.required, Validators.minLength(3)]],     // ← aquí ARRAY
      type: ['', [Validators.required]]
    });
  }

  // Revision de errores
  hasError(field: string, errorCode: string): boolean {
    const ctrl = this.userForm.get(field);
    return !!(ctrl?.hasError(errorCode) && ctrl.touched);
  }

  hasErrorOrg(ctrl: string, err: string) {
    const c = this.newOrgForm.get(ctrl);
    return !!(c?.touched && c.hasError(err));
  }

  // Avanzamos al siguiente paso
  nextStep() {
    const idx = this.activeIndex();
    // si en paso1 y elige NO org, saltar directo a paso2 (datos usuario)
    if (idx === 0 && !this.step1Form.value.asOrg) {
      this.activeIndex.set(1);
    } else {
      this.activeIndex.set(Math.min(idx + 1, 2));
    }
  }

  // Retrocedemos al paso anterior
  prev() {
    this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
  }

  registrarUsuario() {
    console.log('registrarUsuario');
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.userForm.value;
    this.dialogVisible.set(true);
    this.loading.set(true);
    this.registerSuccess.set(null);

    this.auth.registerUser(name, email, password, this.orgSelected)
      .then(() => {
        // Éxito
        this.loading.set(false);
        this.registerSuccess.set(true);
        this.feedbackMessage.set(this.translation.instant('AUTH.REGISTER_SUCCESS'));

        // Cerramos diálogo y navegamos al '/' tras 2s
        setTimeout(() => {
          this.dialogVisible.set(false);
          this.router.navigate(['/']);
        }, 2000);
      })
      .catch(err => {
        // Error
        this.loading.set(false);
        this.registerSuccess.set(false);
        this.feedbackMessage.set(err.message);

        // Cerramos solo el diálogo tras 2s
        setTimeout(() => this.dialogVisible.set(false), 2000);
      });
  }

  // register.component.ts (fragmento)
  saveOrg(activateCallback: (step: number) => void) {
    if (this.newOrgForm.invalid) {
      this.newOrgForm.markAllAsTouched();
      return;
    }

    // Extraigo los valores del form
    const { name, email, tin, address, type } = this.newOrgForm.value;

    // Abro diálogo y muestro spinner
    this.dialogVisible.set(true);
    this.loading.set(true);
    this.registerSuccess.set(null);

    this.orgS
      .crearOrganizacion(name, email, tin, address, type)
      .then(id => {
        // Guardamos el id seleccionado para el siguiente paso
        this.orgSelected = id;

        // Muestro éxito
        this.loading.set(false);
        this.registerSuccess.set(true);
        this.feedbackMessage.set(
          this.translation.instant('AUTH.ORGANIZACION_CREADA')
        );

        // Cierro diálogo y avanzo al paso 4 tras 2s
        setTimeout(() => {
          this.dialogVisible.set(false);
          activateCallback(4);
        }, 2000);
      })
      .catch(err => {
        // Muestro error
        this.loading.set(false);
        this.registerSuccess.set(false);
        this.feedbackMessage.set(err.message);

        // Sólo cierro diálogo tras 2s
        setTimeout(() => this.dialogVisible.set(false), 2000);
      });
  }


}




