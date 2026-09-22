import { Component, Input } from '@angular/core';

export interface ColumnDef {
  field: string;
  header: string;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() data: any[] = [];
}