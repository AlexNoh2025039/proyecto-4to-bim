import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [CommonModule],
  selector: 'app-home.component',
  styleUrl: './home.component.css',
  templateUrl: './home.component.html',
})

export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.currentUsuario;

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}