import { Component, Inject, Type, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService } from '../../../shared/services/services';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import { Model } from './../../core/core';
import { IEditable, DashboardModel, DashboardDataService, DashboardManagerService } from './../../core/core';
import { BasePropertiesComponent } from './../../objects/base/base-properties.component';
import { IWValidators } from './../../../shared/iw-validators';
import { DeleteDashboardCommand } from './../../commands/commands';

import * as _ from 'lodash';

@Component({
	selector: 'iw-dashboard-property',
	moduleId: module.id,
	templateUrl: './dashboard-properties.component.html',
	styleUrls: ['./dashboard-properties.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPropertiesComponent extends BasePropertiesComponent<DashboardModel> {
	constructor(
		deleteCommand: DeleteDashboardCommand,
		formBuilder: FormBuilder,
		private router: Router,
		@Inject(Model) model: DashboardModel,
		@Inject(Type) component: IEditable,
		@Inject(APP_RESOURCE) resource: IResource,
		dialogService: DialogService,
		dashboardManagerService: DashboardManagerService,
		dashboardDataService: DashboardDataService
	) {
		super(deleteCommand, formBuilder, model, component, resource, dialogService, dashboardManagerService, dashboardDataService);
	}

	trimDashBoardName(name: string) {
		this.model.newName = this.model.newName.trim();
		this.model.Name = this.model.Name.trim();
	}

	protected generateFormControls(formBuilder: FormBuilder) {
		const existingNames = _.chain(this.dashboardDataService.dashboards)
			.filter(db => db !== this.model)
			.map(db => db.Name)
			.value();
		return formBuilder.group({
			'Name': [this.model.newName, [
				Validators.required,
				Validators.maxLength(40),
				IWValidators.nonBlank,
				IWValidators.unique(existingNames)]]
		});
	}
}
