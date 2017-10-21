import { Injectable } from '@angular/core';
import { ICommand } from './command.interface';
import { Router } from '@angular/router';
import { DashboardModel, DashboardManagerService, DashboardDataService } from './../core/core';

@Injectable()
export class CopyDashboardCommand implements ICommand<DashboardModel> {
	constructor(private router: Router,
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService) {

	}

	execute(model: DashboardModel) {
		if (!this.canExecute(model)) {
			return false;
		}

		this.dashboardManagerService.isDBChangedFromGM = this.dashboardManagerService.currentDashboard
			&& this.dashboardManagerService.currentDashboard.IsDirty;//#571404
		this.dashboardManagerService.isCancelPressed = false;
		this.dashboardManagerService.createDashboard(model, true)
			.subscribe(
			dashboard => {
				this.router.navigate(['/jobs/' + this.dashboardDataService.currentJob.JobName + '/dashboards', dashboard.Id]).then((val) => {
					if (val) {
						this.dashboardManagerService.setCurrentDashboard(dashboard);
						this.dashboardManagerService.setDashboardMode(true);// A new dashboard shud always open in edit mode
						this.dashboardManagerService.setWellInfo(false);// to show Menu when executing copy/new while in wellinfo/exporter page
					}
				});
			},
			() => {
				// Do nothing on error
			});
		return true;
	}

	canExecute(model: DashboardModel) {
		return !!model;
	}
}
