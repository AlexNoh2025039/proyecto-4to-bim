import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-curriculum-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // <-- Quitamos RouterLink de aquí
  templateUrl: './user-curriculum-form.html',
  styleUrls: ['./user-curriculum-form.css']
})
export class UserCurriculumForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  cvForm!: FormGroup;
  guardando = false;
  mensajeExito = false;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.cvForm = this.fb.group({
      titular: ['', [Validators.required, Validators.maxLength(100)]],
      resumen: ['', [Validators.required, Validators.maxLength(500)]],
      experiencia: ['', [Validators.required]],
      educacion: ['', [Validators.required]],
      habilidades: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9+ ]{8,15}$')]],
      enlaceLinkedin: ['']
    });
  }

  onSubmit(): void {
    if (this.cvForm.invalid) {
      this.cvForm.markAllAsTouched();
      return;
    }

    this.guardando = true;

    setTimeout(() => {
      this.guardando = false;
      this.mensajeExito = true;

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    }, 1000);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}