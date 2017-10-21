import {Inject, Injectable} from '@angular/core';
import {ICommand} from './command.interface';
import {DashboardModel, DashboardDataService, DashboardManagerService} from './../core/core';
import {DialogService, APP_RESOURCE, IResource, SessionService} from './../../shared/services/services';

@Injectable()
export class DeleteDashboardCommand implements ICommand<DashboardModel> {
	constructor(
		private dialogService: DialogService,
		@Inject(APP_RESOURCE) private resource: IResource,
		private dashboardDataService: DashboardDataService,
		private dashboardManagerService: DashboardManagerService,
		private sessionService: SessionService) {
	}

	execute(model: DashboardModel) {
		if (!this.canExecute(model)) {
			return false;
		}

		this.dialogService.confirm(this.resource.DeleteDashboardDialog, model.Name)
			.then(dialog => {
				dialog.result
					.then(confirmed => {
						this.dashboardDataService.isDashboardDelete = true;
						this.dashboardDataService.deleteDashboard(model)
						.subscribe(
						response => {
							this.dashboardDataService.deleteDashboardSuccess(model);
						},
						error => {
							if (this.dashboardManagerService.isLoggedIn(error)) {
								this.dialogService.alert(this.resource.ApplicationErrorDialog,
								error.text() ? this.dashboardDataService.parseErrorMessage(error) : error.message);
							}
						});
					})
					.catch(error => {
						if (error) {
							this.dialogService.alert(this.resource.ApplicationErrorDialog, this.dashboardDataService.parseErrorMessage(error));
						}
						this.dashboardDataService.isDashboardDelete = false;
					});
			});
		return true;
	}

	canExecute(model: DashboardModel) {
		return !!model && (this.sessionService.session.IsIWSupportUser || !model.IsDefault);
	}
}
