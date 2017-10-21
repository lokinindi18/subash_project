import { Inject, Injectable } from '@angular/core';
import { ICommand } from './command.interface';
import { Model, DashboardManagerService } from './../core/core';
import { DialogService, APP_RESOURCE, IResource } from './../../shared/services/services';

@Injectable()
export class DeleteObjectCommand implements ICommand<Model> {
	constructor(
		private dialogService: DialogService,
		@Inject(APP_RESOURCE) private resource: IResource,
		private dashboardManagerService: DashboardManagerService) {
	}

	execute(model: Model) {
		if (!this.canExecute(model)) {
			return false;
		}
		this.dialogService.confirm(this.resource.DeleteObjectDialog, model.Name, model.Type)
			.then(dialog => {
				dialog.result
					.then(confirmed => {
						this.dashboardManagerService.deleteObject(model);
					})
					.catch(() => {
						// do nothing on cancel
					});
			});

		return true;
	}

	canExecute(model: Model) {
		return this.dashboardManagerService.isDashboardInEditMode;
	}
}
