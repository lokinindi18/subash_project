import { Component, OnInit, OnDestroy, Input, Inject } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DialogService, AuthenticateApi } from '../../../shared/services/services';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import { Router } from '@angular/router';
import { DashboardModel, DashboardManagerService, DashboardDataService } from './../../core/core';
import { ViewFactoryService } from './../../core/core';

import {
	AddObjectContainerCommand,
	CopyDashboardCommand,
	DeleteDashboardCommand,
	EditDashboardCommand,
	SaveDashboardCommand
} from '../../commands/commands';

import * as _ from 'lodash';

@Component({
	selector: 'iw-menu',
	moduleId: module.id,
	templateUrl: './menu.component.html',
	styleUrls: ['./menu.component.css'],

})
export class MenuComponent implements OnInit, OnDestroy {
	@Input() dashboardCollection: DashboardModel[];
	@Input() currentJob: AuthenticateApi.IJob;

	public currentDashboard: DashboardModel;

	public objectType: string;

	@Input() isEditModeEnabled: boolean;
	public isWellInfo = false;
	private objectList: string[];
	private dashboardChangedSubscription: Subscription;
	private editModeSubscription: Subscription;
	private isDefault: boolean;

	constructor(
		factory: ViewFactoryService,
		@Inject(APP_RESOURCE) private resource: IResource,
		public addObjectContainerCommand: AddObjectContainerCommand,
		public copyCommand: CopyDashboardCommand,
		public deleteCommand: DeleteDashboardCommand,
		public editCommand: EditDashboardCommand,
		public saveCommand: SaveDashboardCommand,
		private router: Router,
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService,
		private dialogService: DialogService) {
		this.objectList = _.filter(factory.getRegisteredViewNames(), name => name !== 'Container').sort();
		// this.onObjTypeSelectChanged(this.objectTypeSelected);
	}

	public ngOnInit() {
		this.dashboardChangedSubscription = this.dashboardManagerService.dashboardChangedEvent.subscribe(dashboard => {
			this.currentDashboard = dashboard;
			this.isDefault = this.currentDashboard.IsDefault;
		});
		this.dashboardChangedSubscription = this.dashboardManagerService.dashboardChangedEvent
			.subscribe(dashboard => this.currentDashboard = dashboard);
		this.dashboardManagerService.objectPanelChanged(this.objectType);

		this.editModeSubscription = this.dashboardManagerService.editModeChangedEvent
			.subscribe(isInEditMode => {
				this.isEditModeEnabled = isInEditMode;
				this.objectType = this.objectList[0];
			});
	}

	public ngOnDestroy() {
		if (this.dashboardChangedSubscription) {
			this.dashboardChangedSubscription.unsubscribe();
		}
		if (this.editModeSubscription) {
			this.editModeSubscription.unsubscribe();
		}
	}

	public onObjTypeSelectChanged(objectType: string) {
		this.objectType = objectType;
		this.dashboardManagerService.objectPanelChanged(this.objectType);
	}
}
