import { Injectable } from '@angular/core';
import { ICommand } from './command.interface';
import { DashboardManagerService } from './../core/core';

@Injectable()
export class AddObjectContainerCommand implements ICommand<string> {
	constructor(private dashboardManagerService: DashboardManagerService) {

	}
	execute(containerType: string) {
		if (!this.canExecute(containerType)) {
			return false;
		}

		this.dashboardManagerService.addNewObject(containerType);

		return true;
	}

	canExecute(containerType: string) {
		return !!containerType;
	}
}
