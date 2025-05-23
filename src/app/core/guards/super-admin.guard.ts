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

        if (accountResolved) {
          const isSuper = userService.isSuperAdmin();

          if (isSuper) {
            resolve(true);
          } else {
            resolve(router.createUrlTree(['/admin/dashboard']));
          }
          effectRef.destroy();
        }

      });


    });
  });
};