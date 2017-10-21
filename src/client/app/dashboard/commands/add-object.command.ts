import { Injectable } from '@angular/core';
import { ICommand } from './command.interface';
import { DashboardManagerService } from './../core/core';
import { DashboardContainerModel } from './../components/dashboard-containers/dashboard-container.model';

@Injectable()
export class AddObjectCommand implements ICommand<DashboardContainerModel> {
	constructor(private dashboardManagerService: DashboardManagerService) {

	}

	execute(model: DashboardContainerModel) {
		if (!this.canExecute(model)) {
			return false;
		}

		this.dashboardManagerService.addNewObjectToContainer(model);

		return true;
	}

	canExecute(model: DashboardContainerModel) {
		return this.dashboardManagerService.isDashboardInEditMode;
	}
}
