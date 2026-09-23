import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ColumnDef {
  field: string;
  header: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html'
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() data: any[] = [];
}