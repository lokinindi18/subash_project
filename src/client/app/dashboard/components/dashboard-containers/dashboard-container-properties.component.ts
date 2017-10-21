import { Component, Inject, Type, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { APP_RESOURCE, IResource } from './../../../app.resource';
import { DashboardContainerModel } from './dashboard-container.model';
import { IEditable, DashboardManagerService, DashboardDataService, Model } from './../../core/core';
import { BasePropertiesComponent } from '../../objects/base/base-properties.component';
import { Subscription } from 'rxjs/Subscription';
import { DialogService, LoggingService } from './../../../shared/services/services';
import { AddObjectCommand, DeleteObjectCommand } from './../../commands/commands';
import { IWValidators } from './../../../shared/iw-validators';

@Component({
	selector: 'iw-dashboard-container-property',
	moduleId: module.id,
	templateUrl: 'dashboard-container-properties.component.html',
	styleUrls: ['dashboard-container-properties.component.css'],
})

export class DashboardContainerPropertiesComponent extends BasePropertiesComponent<DashboardContainerModel> implements OnInit, OnDestroy {
	public objectPanelName: string;
	public isDisabled: boolean = true;
	private objectPanelChangedSubscription: Subscription;
	private selectedObjectChangedSubscription: Subscription;

	constructor(
		public addCommand: AddObjectCommand,
		public deleteCommand: DeleteObjectCommand,
		public formBuilder: FormBuilder,
		@Inject(Model) model: DashboardContainerModel,
		@Inject(Type) component: IEditable,
		@Inject(APP_RESOURCE) resource: IResource,
		dialogService: DialogService,
		dashboardManagerService: DashboardManagerService,
		dashboardDataService: DashboardDataService,
		private loggingService: LoggingService) {
		super(deleteCommand, formBuilder, model, component, resource, dialogService, dashboardManagerService, dashboardDataService);
	}

	public ngOnDestroy() {
		if (this.objectPanelChangedSubscription)
			this.objectPanelChangedSubscription.unsubscribe();
		if (this.selectedObjectChangedSubscription)
			this.selectedObjectChangedSubscription.unsubscribe();
	}

	public ngOnInit() {
		this.objectPanelChangedSubscription = this.dashboardManagerService.objectPanelChangedEvent
			.subscribe((panelName: string) => {
				this.objectPanelName = panelName;
			});
		this.selectedObjectChangedSubscription = this.dashboardManagerService.selectedObjectChangedEvent
			.subscribe((component: IEditable) => {
				this.loggingService.log(component.Model.Name);
				this.model.Name = component.Model.Name;
			});
		this.dashboardManagerService.objectPanelChanged();
	}

	public showAddButton(model: DashboardContainerModel) {
		if ((model.ContainsType === 'Table' || model.ContainsType.indexOf('Table') !== -1) && model.Objects.length !== 0) {
			return false;
		} else if ((model.ContainsType === 'XY Plot' || model.ContainsType.indexOf('XY Plot') !== -1) && model.Objects.length !== 0) {
			return false;
		} else if ((model.ContainsType === 'Plot' || model.ContainsType.indexOf('Plot') !== -1) && model.Objects.length !== 0) {
			return false;
		}
		return true;
	}

	trimContainerName(name: string) {
		this.model.Name = this.model.Name.trim();
	}
	protected generateFormControls(formBuilder: FormBuilder) {
		return formBuilder.group({
			'Name': [this.model.Name, [
				Validators.required,
				Validators.maxLength(25),
				IWValidators.nonBlank]]
		});
	}
}
