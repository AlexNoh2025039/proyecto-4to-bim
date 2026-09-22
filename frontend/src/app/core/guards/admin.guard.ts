import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario =
    authService.currentUsuario();

  if (
    usuario?.usuario_rol === 'Administrador'
  ) {
    return true;
  }

  return router.createUrlTree([
    '/home'
  ]);
};