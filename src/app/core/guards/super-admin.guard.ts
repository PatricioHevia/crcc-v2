import { inject, effect, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserService } from '../../auth/services/user.service';
// Observable ya no es necesario si devolvemos una Promise directamente

export const superAdminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const injector = inject(Injector); // Sigue siendo necesario para runInInjectionContext

  return new Promise<boolean | UrlTree>((resolve) => {
    // runInInjectionContext es necesario para crear el effect aquí
    runInInjectionContext(injector, () => {
      const effectRef = effect(() => {
        const accountResolved = userService.isUserAccountResolved();
        console.log('SuperAdminGuard: Effect ejecutado. isUserAccountResolved:', accountResolved);

        if (accountResolved) {
          const isSuper = userService.isSuperAdmin();
          console.log('SuperAdminGuard: Account resuelto. userService.isSuperAdmin():', isSuper, '| userService.usuario():', userService.usuario());

          if (isSuper) {
            resolve(true);
          } else {
            // Navegar y luego resolver con una UrlTree o false.
            // Devolver UrlTree es la forma canónica de indicar una redirección desde una guardia.
            resolve(router.createUrlTree(['/admin/dashboard']));
          }
          effectRef.destroy(); // Importante: destruir el efecto una vez que ha cumplido su propósito
        }
        // Si accountResolved es false, el effect simplemente se re-ejecutará cuando cambie la señal.
        // La Promise seguirá pendiente.
      });

      // No hay una función de limpieza directa para la Promise como en Observable,
      // pero el effect se destruye a sí mismo una vez que la Promise se resuelve.
      // Si la navegación se cancela antes de que la Promise resuelva, el effect podría quedar activo.
      // Esto es una limitación de este patrón con Promises si la navegación se cancela.
      // Sin embargo, para guardias, usualmente la navegación espera.
    });
  });
};