import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Vacante } from '../../../core/models/vacante.model';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-card.html',
  styleUrl: './job-card.css'
})
export class JobCardComponent {
  @Input({ required: true }) vacante!: Vacante;
  @Input() isCompanyOwner: boolean = false;

  @Output() edit = new EventEmitter<Vacante>();
  @Output() delete = new EventEmitter<number>();

  onEdit(): void {
    this.edit.emit(this.vacante);
  }

  onDelete(): void {
    if (this.vacante.vacante_id) {
      this.delete.emit(this.vacante.vacante_id);
    }
  }
}