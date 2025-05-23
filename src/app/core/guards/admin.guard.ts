import { inject, effect, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserService } from '../../auth/services/user.service'; // Ajusta la ruta si es necesario

export const adminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const injector = inject(Injector);

  return new Promise<boolean | UrlTree>((resolve) => {
    runInInjectionContext(injector, () => {
      const effectRef = effect(() => {
        const accountResolved = userService.isUserAccountResolved();
        // console.log('AdminGuard: Effect ejecutado. isUserAccountResolved:', accountResolved);

        if (accountResolved) {
          const user = userService.usuario();
          const isAdminOrSuperAdmin = !!user && (user.role === 'Admin' || user.role === 'Super Admin');
          // console.log('AdminGuard: Account resuelto. userService.usuario():', user, 'Es Admin o SuperAdmin:', isAdminOrSuperAdmin);

          if (isAdminOrSuperAdmin) {
            resolve(true);
          } else {
            // Si no es Admin ni SuperAdmin, redirigir (podría ser al login o a una página de no autorizado general)
            // Dado que authGuard ya protege /admin, aquí asumimos que está logueado pero no tiene el rol.
            // Redirigir al dashboard principal del landing o a donde authGuard redirigiría.
            // O a una página específica de 'no tiene permisos suficientes'.
            // Por consistencia con superAdminGuard, lo mandamos al dashboard de admin (que podría tener su propia guardia más específica).
            // O mejor, a la raíz o a una página de "acceso denegado" si el dashboard de admin requiere ser MandanteAdmin.
            resolve(router.createUrlTree(['/'])); // Redirigir a la página principal si no tiene rol suficiente
          }
          effectRef.destroy();
        }
      });
    });
  });
};