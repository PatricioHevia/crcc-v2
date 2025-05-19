import { Component, inject, OnInit } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { AccordionModule } from 'primeng/accordion';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface FaqItem {
  // Pregunta
  question_es: string;
  question_en: string;
  question_zh: string;
  // Respuesta
  answer_es: string;
  answer_en: string;
  answer_zh: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  imports:[AccordionModule, CommonModule, TranslateModule]
})
export class FaqComponent implements OnInit {
  public translation = inject(TranslationService); // Your custom translation service

  faqs: FaqItem[] = [
    {
      question_es: 'Puedo consultar sobre cualquier proyecto de CRCC en Chile?',
      question_en: 'Can I inquire about any CRCC project in Chile?',
      question_zh: '我可以咨询关于中国铁路建设公司在智利的任何项目吗？',
      answer_es: 'No, solo puedes consultar sobre los proyectos que están en la plataforma.',
      answer_en: 'No, you can only inquire about the projects that are on the platform.',
      answer_zh: '不，你只能咨询平台上的项目。'
    },
    {
      question_es: 'Puedo registrarme como usuario sin una empresa?',
      question_en: 'Can I register as a user without a company?',
      question_zh: '我可以不注册公司就注册为用户吗？',
      answer_es: 'No, debes registrar primero tu empresa y luego tu cuenta de usuario eligiendola al momento de darte de alta.',
      answer_en: 'No, you must first register your company and then your user account by choosing it when you sign up.',
      answer_zh: '不，你必须先注册你的公司，然后在注册时选择你的用户账户。'
    },
    {
      question_es: 'Hay que pagar para participar en licitaciones?',
      question_en: 'Do I have to pay to participate in tenders?',
      question_zh: '我需要支付才能参加招标吗？',
      answer_es: 'Depende de cada licitación, lo cual será indicado al momento de solicitar el acceso.',
      answer_en: 'It depends on each tender, which will be indicated when requesting access.',
      answer_zh: '这取决于每个招标，申请访问时会说明。'
    },

  ];


  ngOnInit() {
  }

  localized(faq: FaqItem, field: 'question' | 'answer'): string {
    const lang = this.translation.currentLang; // 'es' | 'en' | 'zh'
    // TS no se queja si casteamos a any
    return (faq as any)[`${field}_${lang()}`] || '';
  }

}
