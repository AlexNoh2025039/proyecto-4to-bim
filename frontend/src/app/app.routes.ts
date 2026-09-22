import { Routes } from '@angular/router';

import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },

  {
    path: 'login',

    canActivate: [
      guestGuard
    ],

    loadComponent: () =>
      import(
        './pages/login/login.component'
      ).then(
        component =>
          component.LoginComponent
      )
  },

  {
    path: 'register',

    canActivate: [
      guestGuard
    ],

    loadComponent: () =>
      import(
        './pages/register/register.component'
      ).then(
        component =>
          component.RegisterComponent
      )
  },

  {
    path: 'home',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './pages/home/home.component'
      ).then(
        component =>
          component.HomeComponent
      )
  },

  {
    path: '**',
    redirectTo: 'home'
  }

];