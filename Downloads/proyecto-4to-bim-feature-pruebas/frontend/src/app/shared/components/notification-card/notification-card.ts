import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Notificacion } from '../../../core/models/notificacion.model';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  styleUrl: './notification-card.css',
  templateUrl: './notification-card.html',
})
export class NotificationCardComponent {
  @Input({ required: true }) notificacion!: Notificacion;

  @Output() toggleRead = new EventEmitter<Notificacion>();

  onToggleRead(): void {
    this.toggleRead.emit({
      ...this.notificacion,
      estado: !this.notificacion.estado
    });
  }
}
