import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Notificacion } from '../../core/models/notificacion.model';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  styleUrl: './notification-card.css',
  templateUrl: './notification-card.html',
})
export class NotificationCardComponent {
  @Input({ required: true }) notificacion!: Notificacion;

  @Output() markRead = new EventEmitter<Notificacion>();

  onToggleRead(): void {
    this.markRead.emit({
      ...this.notificacion,
      estado: !this.notificacion.estado
    });
  }
}
