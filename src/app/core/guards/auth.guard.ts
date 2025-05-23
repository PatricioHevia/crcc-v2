import { inject, effect, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { UserService } from '../../auth/services/user.service';
// Observable ya no es necesario

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const injector = inject(Injector);

  return new Promise<boolean | UrlTree>((resolve) => {
    runInInjectionContext(injector, () => {
      const effectRef = effect(() => {
        const accountResolved = userService.isUserAccountResolved();
        console.log('AuthGuard: Effect ejecutado. isUserAccountResolved:', accountResolved);

        if (accountResolved) {
          const currentUser = userService.usuario();
          console.log('AuthGuard: Account resuelto. userService.usuario():', currentUser);

          if (currentUser) {
            resolve(true);
          } else {
            resolve(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }));
          }
          effectRef.destroy();
        }
      });
    });
  });
};