import { Component } from '@angular/core';
import { LeadInsightsComponent } from './lead-insights/lead-insights.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LeadInsightsComponent],
  template: `<app-lead-insights></app-lead-insights>`,
})
export class AppComponent {}
