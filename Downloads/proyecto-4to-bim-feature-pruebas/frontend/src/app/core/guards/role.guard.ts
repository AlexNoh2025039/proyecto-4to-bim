import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.model';

export const roleGuard = (allowedRoles: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUsuario();

    if (user && allowedRoles.includes(user.usuario_rol)) {
      return true;
    }

    router.navigate(['/home']);
    return false;
  };
};