import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { FluidModule } from 'primeng/fluid';
import { TranslationService } from '../../../core/services/translation.service';
import { Contacto } from './models/contacto-interface';
import { Timestamp } from 'firebase/firestore';
import { ContactoService } from './contacto.service';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css'],
  imports: [RouterModule,TranslateModule, CardModule, ReactiveFormsModule, CommonModule, ButtonModule, InputTextModule, TextareaModule, FluidModule]
})
export class ContactoComponent implements OnInit {
  contactForm!: FormGroup;
  loading = false;

  fb = inject(FormBuilder);
  toast = inject(ToastService);
  translation = inject(TranslationService);
  contactoService = inject(ContactoService);



  ngOnInit() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  hasError(field: string, errorCode: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl?.hasError(errorCode) && ctrl.touched);
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { name, email, company, subject, message } = this.contactForm.value;
    const lang = this.translation.currentLang(); // 'es' | 'en' | 'zh'

    // 1) Prepara sólo los campos a traducir en un objeto
    const payload = {
      mensaje_es: lang === 'es' ? message : '',
      mensaje_en: lang === 'en' ? message : '',
      mensaje_zh: lang === 'zh' ? message : '',
      asunto_es: lang === 'es' ? subject : '',
      asunto_en: lang === 'en' ? subject : '',
      asunto_zh: lang === 'zh' ? subject : ''
    };

    try {
      // 2) Envía el objeto y recibe ya un objeto traducido
      const translated = await this.translation.translateJson<typeof payload>(payload);

      // 3) Construye el Contacto final
      const contacto: Omit<Contacto, 'id'> = {
        nombre: name,
        email,
        empresa: company,
        fecha: Timestamp.now(),
        leido: false,
        mensaje_es: translated.mensaje_es,
        mensaje_en: translated.mensaje_en,
        mensaje_zh: translated.mensaje_zh,
        asunto_es: translated.asunto_es,
        asunto_en: translated.asunto_en,
        asunto_zh: translated.asunto_zh
      };

      // 4) Guarda en Firestore
      await this.contactoService.crearMensaje(contacto);
      this.toast.success('TOAST.EXITO', 'CONTACTO.TOAST_MENSAJE_ENVIADO');
      this.contactForm.reset();
    } catch (error) {
      console.error('Error en envío o traducción:', error);
      this.toast.error('TOAST.ERROR', 'CONTACTO.TOAST_MENSAJE_ERROR');
    } finally {
      this.loading = false;
    }
  }

}
