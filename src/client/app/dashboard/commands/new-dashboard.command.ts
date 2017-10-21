import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardManagerService, DashboardDataService } from './../core/core';
import { CopyDashboardCommand } from './copy-dashboard.command';

@Injectable()
export class NewDashboardCommand extends CopyDashboardCommand {
	constructor(router: Router, dashboardManagerService: DashboardManagerService, dashboardDataService: DashboardDataService) {
		super(router, dashboardManagerService, dashboardDataService);
	}

	execute() {
		if (!this.canExecute()) {
			return false;
		}

		return super.execute(null);
	}

	canExecute() {
		return true;
	}
}
