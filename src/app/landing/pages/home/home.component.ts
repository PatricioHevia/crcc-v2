import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, Injector, runInInjectionContext, signal, ViewChild, WritableSignal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GalleriaModule } from 'primeng/galleria';
import { DividerModule } from 'primeng/divider';
import { register } from 'swiper/element/bundle';
import { UserService } from '../../../auth/services/user.service';

register();


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [TranslateModule, GalleriaModule, DividerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent {
  @ViewChild('swiperContainerHome') swiperContainerRef!: ElementRef<any & { swiper: any }>;
  private userService = inject(UserService);
  private injector = inject(Injector); // Nueva señal para controlar la visibilidad del Swiper

  public swiperRenderedCorrectly: WritableSignal<boolean> = signal(false);


  images = [
    {
      previewImageSrc: 'assets/images/galleria-1/crcci-lusail-stadium-qatar-world-cup-night.png',
      alt: 'Exterior nocturno del Estadio Lusail, sede principal del Mundial de Catar',
      title: 'HOME.GALLERIA_LUSAIL_STADIUM',
    },
    {
      previewImageSrc: 'assets/images/galleria-1/crcci-arima-general-hospital-trinidad-tobago.jpg',
      alt: 'Vista aérea del Hospital General de Arima construido por CRCCI en Trinidad y Tobago',
      title: 'HOME.GALLERIA_ARIMA_GENERAL_HOSPITAL',
    },
    {
      previewImageSrc: 'assets/images/galleria-1/crcci-4season-hotel-kuala-lumpur.jpg',
      alt: 'Vista del proyecto Four Seasons Hotel construido por CRCCI en Kuala Lumpur, Malasia',
      title: 'HOME.GALLERIA_FOUR_SEASONS_HOTEL',
    },
    {
      previewImageSrc: 'assets/images/galleria-1/crcci-mecca-light-rail-metro-station.jpg',
      alt: 'Exterior de la estación Al Mashaaer del Metro de la Meca construida por CRCCI',
      title: 'HOME.GALLERIA_MECCA',
    },
    {
      previewImageSrc: 'assets/images/galleria-1/mid-segment-of-algeria-east-west-expressway.jpg',
      alt: 'Vista de carretera del tramo medio de la Autopista Este-Oeste de Argelia de CRCCI',
      title: 'HOME.GALLERIA_SEGMENT_EAST_WEST_EXPRESSWAY'
    },
    {
      previewImageSrc: 'assets/images/galleria-1/the-southwest-section-of-third-transfer-line-of-moscow-metro.jpg',
      alt: 'Vista de la sección interior suroeste de la tercera línea de transferencia del metro de Moscú',
      title: 'HOME.GALLERIA_METRO_MOSCOW',
    },
    {
      previewImageSrc: 'assets/images/galleria-1/the-electrified-doble-track-railway-project-from-gemas-to-johor-bahru.png',
      alt: 'Vista aérea del proyecto de ferrocarril electrificado de doble vía de Gemas a Johor Bahru',
      title: 'HOME.GALLERIA_GEMAS_JOHOR_BAHRU',
    },

  ];

  ngAfterViewInit(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const accountResolved = this.userService.isUserAccountResolved();

        if (accountResolved) {
          // El entorno está listo. Intentar actualizar el swiper.
          // El swiper ya está en el DOM (no usamos *ngIf para él, solo para el placeholder)
          if (this.swiperContainerRef?.nativeElement?.swiper) {
            setTimeout(() => { // Delay para estabilidad del DOM
              try {
                this.swiperContainerRef.nativeElement.swiper.update();
                this.swiperContainerRef.nativeElement.swiper.resize.resizeHandler();
                this.swiperRenderedCorrectly.set(true); // Marcar como listo para opacidad completa
              } catch (e) {
                this.swiperRenderedCorrectly.set(true); // Mostrar de todas formas
              }
            }, 150);
          } else {
            console.warn('HomeComponent: Account resolved, pero Swiper ref no disponible AÚN en AfterViewInit.');
            // Podría necesitar un pequeño delay para que ViewChild se resuelva si el template es complejo
             setTimeout(() => {
                if (this.swiperContainerRef?.nativeElement?.swiper) {
                    this.swiperContainerRef.nativeElement.swiper.update();
                    this.swiperContainerRef.nativeElement.swiper.resize.resizeHandler();
                    this.swiperRenderedCorrectly.set(true);
                } else {
                    this.swiperRenderedCorrectly.set(true); // Mostrar de todas formas para no bloquear UI
                }
             }, 200); // Un delay un poco mayor para este caso
          }
        } else {
          // Si la cuenta no está resuelta, resetear el estado de visibilidad del swiper
          this.swiperRenderedCorrectly.set(false);
        }
      });
    });
  }

}
