import { Routes } from '@angular/router';

import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './pages/login/login.component'
      ).then(
        m => m.LoginComponent
      )
  },

  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './pages/register/register.component'
      ).then(
        m => m.RegisterComponent
      )
  },

  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './pages/home/home.component'
      ).then(
        m => m.HomeComponent
      )
  },

  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './pages/profile/profile.component'
      ).then(
        m => m.ProfileComponent
      )
  },

  {
    path: 'curriculum',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './pages/curriculum/curriculum.component'
      ).then(
        m => m.CurriculumComponent
      )
  },

  {
    path: 'admin/usuarios',
    canActivate: [
      authGuard,
      adminGuard
    ],
    loadComponent: () =>
      import(
        './pages/admin-users/admin-users.component'
      ).then(
        m => m.AdminUsersComponent
      )
  },

  {
    path: '**',
    redirectTo: 'home'
  }
];