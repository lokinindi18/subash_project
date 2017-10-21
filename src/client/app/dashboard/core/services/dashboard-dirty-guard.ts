import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { DashboardCanvasComponent } from './../../components/dashboard-canvas/dashboard-canvas.component';

@Injectable()
export class DashboardDirtyGuard implements CanDeactivate<DashboardCanvasComponent> {
  canDeactivate(
    component: DashboardCanvasComponent): Observable<boolean> | boolean {
    return component.canDeactivate();
  }
}
