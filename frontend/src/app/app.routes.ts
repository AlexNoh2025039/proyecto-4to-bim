import { Routes } from '@angular/router';

import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },

  // --- AUTENTICACIÓN / GUEST ---
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // --- RUTAS COMUNES PARA AUTENTICADOS ---
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },

  // --- RUTAS DE CANDIDATO ---
  {
<<<<<<< HEAD
    path: 'candidato',
=======
    path: 'user-dashboard',
>>>>>>> 92159d7 (Home y rutas para pruebas)
    canActivate: [authGuard, roleGuard(['Candidato'])],
    children: [
      {
        path: 'curriculum',
        loadComponent: () =>
          import('./pages/user-dashboard/components/user-curriculum-form/user-curriculum-form').then(m => m.UserCurriculumForm)
      },
      {
        path: 'postulacion',
        loadComponent: () =>
          import('./pages/user-dashboard/components/user-postulation-form/user-postulation-form').then(m => m.UserPostulationForm)
      }
    ]
  },
  {
    path: 'curriculum',
    canActivate: [authGuard, roleGuard(['Candidato'])],
    loadComponent: () =>
      import('./pages/curriculum/curriculum.component').then(m => m.CurriculumComponent)
  },
  {
    path: 'job-detail/:id',
    canActivate: [authGuard, roleGuard(['Candidato'])],
    loadComponent: () =>
      import('./pages/job-detail/job-detail').then(m => m.JobDetailComponent)
  },
  {
    path: 'take-evaluation/:id',
    canActivate: [authGuard, roleGuard(['Candidato'])],
    loadComponent: () =>
      import('./pages/take-evaluation/take-evaluation').then(m => m.TakeEvaluation)
  },

  // --- RUTAS DE ADMINISTRADOR ---
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'empresas/nueva',
        loadComponent: () =>

          import('./pages/admin-dashboard/components/admin-companies-form/admin-companies-form').then(m => m.AdminCompaniesFormComponent)
      },
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/admin-evaluations-list/admin-evaluations-list').then(m => m.AdminEvaluationsList)
      },
      {
        path: 'evaluaciones/nueva',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/admin-evaluations-form/admin-evaluations-form').then(m => m.AdminEvaluationsForm)
      },
      {
        path: 'preguntas/nueva',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/admin-questions-form/admin-questions-form').then(m => m.AdminQuestionsForm)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/admin-users-form/admin-users-form').then(m => m.AdminUsersForm)
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/notifications-form/notifications-form').then(m => m.NotificationsForm)
      },
      {
        path: 'expediente-usuario',
        loadComponent: () =>
          import('./pages/admin-dashboard/components/user-record-form/user-record-form').then(m => m.UserRecordForm)
      }
    ]
  },

  // --- RUTAS DE EMPRESA ---
  {
    path: 'empresa',
    canActivate: [authGuard, roleGuard(['Empresa'])],
    children: [
      {
        path: 'candidato/:id',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/candidate-profile-view/candidate-profile-view').then(m => m.CandidateProfileView)
      },
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/companies-evaluations/companies-evaluations').then(m => m.CompaniesEvaluations)
      },
      {
        path: 'evaluaciones/nueva',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/companies-evaluations-form/companies-evaluations-form').then(m => m.CompaniesEvaluationsForm)
      },
      {
        path: 'preguntas/nueva',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/companies-questions-form/companies-questions-form').then(m => m.CompaniesQuestionsForm)
      },
      {
        path: 'vacantes/nueva',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/companies-vacancies-form/companies-vacancies-form').then(m => m.CompaniesVacanciesFormComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/companies-dashboard/components/notifications-form/notifications-form').then(m => m.NotificationsForm)
      }
    ]
  },

  // WILDCARD
  {
    path: '**',
    redirectTo: 'home'
  }
];