import { Component, Inject, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DashboardDataService, DashboardManagerService } from './../../core/core';
import { ApiWebService, WellsApi } from '../../../shared/services/services';
// import { CORE_DIRECTIVES, FORM_DIRECTIVES } from '@angular/common';
import { APP_RESOURCE, IResource } from './../../../app.resource';
import { DialogService, LoggingService } from '../../../shared/services/services';
import { WellInfoModal } from './well-info.model';

// import * as _ from 'lodash';

@Component({
	selector: 'iw-well-info',
	moduleId: module.id,
	templateUrl: './well-information.component.html',
	styleUrls: ['./well-information.component.css'],
	// directives: [FORM_DIRECTIVES, CORE_DIRECTIVES]
})

export class WellInformationComponent implements OnInit, AfterViewInit, OnDestroy {

	public jobName: string;
	public unitSet: string;
	public wellinfoModel: WellInfoModal;

	constructor(
		@Inject(APP_RESOURCE) private resource: IResource
		, private cdr: ChangeDetectorRef
		, private apiWebService: ApiWebService
		, private dashboardDataService: DashboardDataService
		, private dialogService: DialogService
		, private dashboardManagerService: DashboardManagerService
		, private loggingService: LoggingService

	) {
		//Padding required for data formetting
		(<any>Number.prototype).padLeft = function (base: any, chr: any) {
			var len = (String(base || 10).length - String(this).length) + 1;
			return len > 0 ? new Array(len).join(chr || '0') + this : this;
		};
		this.wellinfoModel = new WellInfoModal(loggingService);
		this.dashboardManagerService.setDashboardMode(false);
		this.dashboardManagerService.setWellInfo(true);
	}

	ngOnInit() {
		this.cdr.detach();
		this.dialogService.wait(`Loading Well Information for ${this.dashboardDataService.currentJob.JobName}`)
			.then(
			(waitDialog: any) => {
				let wellid = this.dashboardDataService.currentJob.WellUid;
				this.jobName = this.dashboardDataService.currentJob.JobName;
				this.unitSet = this.dashboardDataService.currentJob.UnitSet.split('|')[0];
				this.apiWebService.getWellRawData(wellid, this.unitSet).subscribe(
					rawResponse => {
						if (rawResponse.response) {
							let rawData = rawResponse.response.rawdata;
							if (rawData === null || rawData === undefined || rawData.length === 0 || rawData[0] === null || rawData[0] === undefined) {
								waitDialog.dismiss();
								this.dialogService.alert(this.resource.ApplicationErrorDialog, 'Well Info not available.');
								return;
							}
							this.cdr.reattach();
							let wellsLogDict: WellsApi.IWellLogData = rawResponse.response.rawdata[0];
							let wellLogData: WellsApi.IWellRawData = wellsLogDict.logData;
							this.wellinfoModel.mapValuesToModel(wellLogData);
							this.loggingService.log(wellLogData.variableList);
							this.loggingService.log(wellLogData.data[0]);
							waitDialog.dismiss();
						} else {
							waitDialog.dismiss();
							this.dialogService.alert(this.resource.ApplicationErrorDialog, rawResponse.Error.Code);
						}
					},
					error => {
						waitDialog.dismiss();
						var errorString = this.dashboardDataService.parseErrorMessage(error);
						if (errorString === '[object ProgressEvent]') {
							errorString = 'Internal Server Error.';
						}
						this.dialogService.alert(this.resource.ApplicationErrorDialog, errorString);
						this.loggingService.log(error);
					});
			});
	}
	ngAfterViewInit() {
		this.dashboardManagerService.wellInfoRefresh(true);
	}
	ngOnDestroy() {
		this.loggingService.log('ngOnDestroy');
	}

}
