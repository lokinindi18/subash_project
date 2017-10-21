import { Routes } from '@angular/router';

import { HomeRoutes } from './home/index';
import { JobRoutes } from './jobs/index';
import { DashboardRoutes } from './dashboard/index';

export const routes: Routes = [
  ...HomeRoutes,
  ...JobRoutes,
  ...DashboardRoutes
];
