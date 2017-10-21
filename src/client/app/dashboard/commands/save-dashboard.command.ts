import { Injectable, Inject } from '@angular/core';
import { ICommand } from './command.interface';
import { DashboardDataService, DashboardManagerService } from './../core/core';
import { DialogService, APP_RESOURCE, IResource } from './../../shared/services/services';
import { DashboardModel } from './../core/core';

@Injectable()
export class SaveDashboardCommand implements ICommand<DashboardModel> {
	constructor(
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService,
		private dialogService: DialogService,
		@Inject(APP_RESOURCE) private resource: IResource
	) {

	}

	public execute(dashboard: DashboardModel) {
		if (!this.canExecute(dashboard)) {
			return false;
		}

		if (!dashboard.IsDirty) {
			this.dashboardManagerService.setDashboardMode(false);
			return true;
		}
		this.dialogService.wait('Saving dashboard...')
			.then(d => {
				if (dashboard.newName) {
					dashboard.Name = dashboard.newName;
				}

				this.dashboardDataService.saveDashboard(dashboard)
					.subscribe(
					response => {
						d.close();
						dashboard.resetDirty();
						this.dashboardManagerService.setDashboardMode(false);
					},
					error => {
						d.close();
						//Done to handle error.text undefined exception
						// this.dialogService.alert(this.resource.ApplicationErrorDialog,
						// 	error.text() ? this.dashboardDataService.parseErrorMessage(error) : error.message);
						if (this.dashboardManagerService.isLoggedIn(error)) {
							this.dialogService.alert(this.resource.ApplicationErrorDialog,
							error.text() ? this.dashboardDataService.parseErrorMessage(error) : error.message);
						}
					});
			});

		return true;
	}

	public canExecute(dashboard: DashboardModel) {
		return dashboard.IsValid;
	}
}
