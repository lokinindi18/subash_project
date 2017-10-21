import { Component, Inject } from '@angular/core';
import { DialogRef, ModalComponent } from 'angular2-modal';
import { BSModalContext } from 'angular2-modal/plugins/bootstrap';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

// import { CustomModalParams } from '../../../shared/components/dialog/custom-modal-params';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import { DashboardModel } from '../../core/data/dashboard.model';
import { IWValidators } from './../../../shared/iw-validators';
import { SerializerService } from './../../core/core';


//TODO : Kunjan - Change to proper code. Here are place holders to make code work


@Component({
	selector: 'iw-create-dashboard',
	moduleId: module.id,
	templateUrl: './create-dashboard-dialog.component.html',
	styleUrls: ['./create-dashboard-dialog.component.css'],

})

export class CreateDashboardWindowComponent implements ModalComponent<CreateDashboardWindowParams> {
	context: CreateDashboardWindowParams;
	public applicationTitle: string;
	public dashboard: DashboardModel;
	public error: string;
	isDuplicate: boolean;
	private createDashboardForm: FormGroup;
	private exisitingNames: string[];
	constructor(
		formBuilder: FormBuilder,
		@Inject(APP_RESOURCE) resource: IResource,
		public dialog: DialogRef<CreateDashboardWindowParams>) {
		this.context = dialog.context;
		this.exisitingNames = this.context.existingNames;
		this.isDuplicate = false;
		if (this.context.dashboard) {
			this.dashboard = this.context.serializerService.deserialize(this.context.dashboard);
			this.dashboard.Name = 'Copy of ' + this.dashboard.Name;
		} else {
			this.dashboard = this.context.serializerService.createModel('Dashboard') as DashboardModel;
		}

		this.dashboard.Id = void 0;
		this.dashboard.IsDefault = false;

		this.applicationTitle = resource.ApplicationTitle;
		this.createDashboardForm = this.generateFormControls(formBuilder);
	}

	createDashboard() {
		this.dialog.close(this.dashboard);
	}

	trimDashBoardName(name: string) {
		this.isDuplicate = false;
		if (this.dashboard.Name) {
			this.dashboard.Name = this.dashboard.Name.trim();
			let itemFound = this.exisitingNames.find(item => item.toLocaleLowerCase() === this.dashboard.Name.toLocaleLowerCase());
			if (itemFound) {
				this.isDuplicate = true;
			}
		}
	}

	protected generateFormControls(formBuilder: FormBuilder) {
		return formBuilder.group({
			'dashboardname': [this.dashboard.Name,
			Validators.compose([Validators.required, Validators.maxLength(40), IWValidators.unique(this.exisitingNames), IWValidators.nonBlank])]
		});
	}
}

export class CreateDashboardWindowParams extends BSModalContext {
	constructor(public serializerService: SerializerService, public dashboard: DashboardModel, public existingNames: string[]) {
		super();
	}
}
