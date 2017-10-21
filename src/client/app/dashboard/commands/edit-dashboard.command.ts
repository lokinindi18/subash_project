import {Injectable} from '@angular/core';
import {ICommand} from './command.interface';
import {DashboardModel} from './../core/core';
import { DashboardManagerService } from './../core/core';
import { SessionService } from '../../shared/services/services';

@Injectable()
export class EditDashboardCommand implements ICommand<DashboardModel> {
	constructor(private dashboardManagerService: DashboardManagerService,
		private sessionService: SessionService) {
	}

	execute(model: DashboardModel) {
		if (!this.canExecute(model)) {
			return false;
		}
		this.dashboardManagerService.setDashboardMode(true);
		return true;
	}

	canExecute(model: DashboardModel) {
		return model && (this.sessionService.session.IsIWSupportUser || !model.IsDefault ) && !this.dashboardManagerService.isDashboardInEditMode;
	}
}
