import { inject, effect, Injector, runInInjectionContext, computed } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserService } from '../../auth/services/user.service';         // Ajusta la ruta
import { OrganizationService } from '../../auth/services/organization.service'; // Ajusta la ruta

export const mandanteAdminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const injector = inject(Injector);

  return new Promise<boolean | UrlTree>((resolve) => {
    runInInjectionContext(injector, () => {
      // Creamos señales computadas internas a la guardia para la lógica,
      // estas dependerán de las señales de los servicios.
      const currentUser = userService.usuario; // Señal Account | null

      const isUserSuperAdminSignal = computed(() => {
        const user = currentUser();
        return !!user && user.role === 'Super Admin';
      });

      const isUserAdminSignal = computed(() => {
        const user = currentUser();
        return !!user && user.role === 'Admin';
      });

      // Esta señal es un poco más compleja porque depende de una llamada a organizationService
      const isAdminAndOrganizationMandanteSignal = computed(() => {
        const user = currentUser();
        if (!user || user.role !== 'Admin' || !user.organization) {
          return false;
        }
        // runInInjectionContext aquí es crucial si isMandante() usa signals/computed y se llama desde otro computed
        // Esto ya lo tienes en el sidebar, así que es consistente.
        return userService.isMandante();
      });


      const effectRef = effect(() => {
        const accountResolved = userService.isUserAccountResolved();
        // console.log('MandanteAdminGuard: Effect. isUserAccountResolved:', accountResolved);

        if (accountResolved) {
          // Una vez resuelta la cuenta, evaluamos las condiciones.
          const isSuperAdmin = isUserSuperAdminSignal();
          const isAdmin = isUserAdminSignal();
          const isAdminMandante = isAdminAndOrganizationMandanteSignal(); // Este se evaluará correctamente ahora

          // console.log('MandanteAdminGuard: Account resuelto. userService.usuario():', currentUser(), 'isSuperAdmin:', isSuperAdmin, 'isAdmin:', isAdmin, 'isAdminMandante:', isAdminMandante);

          if (isSuperAdmin || (isAdmin && isAdminMandante)) {
            resolve(true);
          } else {
            resolve(router.createUrlTree(['/'])); // Redirigir a la página principal
          }
          effectRef.destroy();
        }
      });
    });
  });
};