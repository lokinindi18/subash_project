import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { ApiWebService, DialogService, ExporterInfo, GraphicsService, LogsApi, RtsWebService, SessionService, UtilsService, LoggingService }
	from './../../../shared/services/services';
import { Subscription } from 'rxjs/Subscription';
import { ExporterModel } from './exporter.model';
import { DashboardDataService, DashboardManagerService } from './../../core/core';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import * as _ from 'lodash';

declare var saveAs: any;
@Component({
	selector: 'iw-exporter',
	moduleId: module.id,
	templateUrl: './exporter.component.html',
	styleUrls: ['./exporter.component.css'],

})
export class ExporterComponent implements OnInit, OnDestroy, AfterViewInit {
	public exporterModel: ExporterModel;
	public available: ExporterInfo.TableDetails[] = [];
	public showDropDown: boolean = false;
	public showStartDropDown: boolean = false;
	public exportTable: ExporterInfo.ExportTableDetails[] = [];
	public marked: ExporterInfo.TableDetails[] = [];
	public unmarked: ExporterInfo.TableDetails[] = [];
	public selected: ExporterInfo.TableDetails[] = []; //this.selected will be the output
	public passList: LogsApi.WLIPassInfo[] = [];

	@ViewChild('startDatePicker') public startDatePickerElement: any;
	@ViewChild('endDatePicker') public endDatePickerElement: any;

	private StartTimeRangeForDispaly: string;
	private EndTimeRangeForDispaly: string;
	private disableDelimitedInput: boolean = true;
	private isCollapsed = false;
	private isWireLine: boolean = false;
	private globalMenuChangedSubscription: Subscription;

	private startDepthTouched: boolean = false;
	private endDepthTouched: boolean = false;
	private lastTouchedDepth: string = '';
	private startTimeTouched: boolean = false;
	private endTimeTouched: boolean = false;
	private lastTouchedTime: string = '';
	private highlightUnsupportedItem: boolean = false;

	public get isTimeBasedIV(): boolean {
		return UtilsService.isTimeBasedIV(this.exporterModel.IVType);
	}
	public get timeValueList(): string[] {
		return GraphicsService.getTimeValueList('T&D');
	}
	public get startDepthError(): string {
		let errorMsg = this.exporterModel.validateStartDepth();
		if (errorMsg === this.exporterModel.errMsg.startDepthError && this.lastTouchedDepth !== 'start')
			return '';
		return errorMsg;
	}
	public get endDepthError(): string {
		let errorMsg = this.exporterModel.validateEndDepth();
		if (errorMsg === this.exporterModel.errMsg.endDepthError && this.lastTouchedDepth !== 'end')
			return '';
		return errorMsg;
	}
	public get startTimeError(): string {
		let errorMsg = this.exporterModel.validateStartTime();
		if (errorMsg === this.exporterModel.errMsg.startTimeError && this.lastTouchedTime !== 'StartDate')
			return '';
		return errorMsg;
	}
	public get endTimeError(): string {
		let errorMsg = this.exporterModel.validateEndTime();
		if (errorMsg === this.exporterModel.errMsg.endTimeError && this.lastTouchedTime !== 'EndDate')
			return '';
		return errorMsg;
	}

	public setStartTime(time: string) {
		this.exporterModel.StartTime = time;
		this.startTimeDropDownToggle(null);
		this.startTimeTouched = true;
		this.lastTouchedTime = 'StartDate';
	}

	public setEndTime(time: string) {
		this.exporterModel.EndTime = time;
		this.endTimeDropDownToggle(null);
		this.endTimeTouched = true;
		this.lastTouchedTime = 'EndDate';
	}

	constructor(
		@Inject(APP_RESOURCE) private resource: IResource,
		private rtsWebService: RtsWebService,
		private apiWebService: ApiWebService,
		protected dialogService: DialogService,
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService,
		private sessionService: SessionService,
		private loggingService: LoggingService) {
		//Padding required for data formetting
		(<any>Number.prototype).padLeft = function (base: any, chr: any) {
			var len = (String(base || 10).length - String(this).length) + 1;
			return len > 0 ? new Array(len).join(chr || '0') + this : this;
		};

		this.dashboardManagerService.setDashboardMode(false);
		this.dashboardManagerService.setWellInfo(true);
		this.exporterModel = new ExporterModel(this.dashboardDataService.currentJob, this.dashboardDataService.variableList);
		this.isWireLine = this.exporterModel.pslName === UtilsService.PSLNames.Wireline;
		this.dialogService.wait(`Loading exporter`).then(
			waitDialog => {
				this.dashboardDataService.getLatestCurves()
					.subscribe(logs => {
						waitDialog.dismiss();
						this.dashboardDataService.fillVariableList(logs);
						this.passList = _.filter(this.dashboardDataService.passList,
							pass => pass.IndexType === UtilsService.getLogIndexType(this.exporterModel.IVType));
						this.exporterModel.pass = this.getActivePass();
						this.available = this.getIVBasedTableDetails(this.exporterModel.IVType);
						this.getStartEndIVTypeInfo(UtilsService.isTDBasedIV(this.exporterModel.IVType) ? 0 : 3);
					},
					error => {
						waitDialog.dismiss();
						if (this.dashboardManagerService.isLoggedIn(error)) {
							this.dialogService.alert(this.resource.ApplicationErrorDialog,
								this.dashboardDataService.parseErrorMessage(error));
						}
						// this.dashboardDataService.handleGetCurvesError(error);

					});
			});
	}

	ngOnInit() {
		this.loggingService.log('ngOnInit');
	};

	ngAfterViewInit() {
		this.highlightUnsupportedItem = false;
		this.globalMenuChangedSubscription = this.dashboardManagerService.globalMenuChangedEvent
			.subscribe(isCollapsed =>
				this.isCollapsed = isCollapsed);
		this.dashboardManagerService.wellInfoRefresh(false);

	}

	ngOnDestroy() {
		if (this.globalMenuChangedSubscription) {
			this.globalMenuChangedSubscription.unsubscribe();
		}
	}

	public get ivTypeList(): Object[] {
		var ivList = this.getIVTypes(this.dashboardDataService.currentJob.PSLName);
		return ivList.filter(item => item.value !== 'ET');
	}

	public get timeFormats(): string[] {
		return GraphicsService.timeFormat;
	}
	public get delimitedWithValueList(): string[] {
		return GraphicsService.getDelimitedWithValueList();
	}
	public get fileFormatTypes(): string[] {
		return GraphicsService.fileFormatTypes;
	}

	public getStartEndIVTypeInfo(ivType: LogsApi.LogIndexType) {
		const complexLogMinMaxParams = this.getComplexLogParams(ivType);
		this.apiWebService.findComplexLogsMinMaxNew(complexLogMinMaxParams).subscribe(
			response => {
				if (response && response.maxIndex !== null &&
					response.minIndex !== null && response.minIndex !== response.maxIndex) {

					this.exporterModel.mapValuesToModel(response, ivType);
					this.StartTimeRangeForDispaly = this.exporterModel.StartTimeRange
						&& new Date(this.exporterModel.StartTimeRange).format('m/d/Y h:i:s A');
					this.EndTimeRangeForDispaly = this.exporterModel.EndTimeRange
						&& new Date(this.exporterModel.EndTimeRange).format('m/d/Y h:i:s A');
				}
			},
			error => {
				var errorString: string = error.text();
				if (errorString !== null) {
					var errorStringArray = error.text().split(':');
					errorString = errorStringArray[0];
				}
				this.dialogService.alert(this.resource.ApplicationErrorDialog, errorString);
			});
	}

	public getIVTypes(pslName: string) {
		let ivTypes = GraphicsService.getIVTypes();
		if (pslName === UtilsService.PSLNames.PEGel || pslName ===
			UtilsService.PSLNames.PEFoam || pslName === UtilsService.PSLNames.PEStandard ||
			pslName === UtilsService.PSLNames.CementingConventional || pslName === UtilsService.PSLNames.CementingFoam ||
			pslName === UtilsService.PSLNames.TSS) {
			return _.filter(ivTypes, x => UtilsService.isTDBasedIV(x.value));
		} else {
			return ivTypes;
		}
	}

	public clearSelectedVariables() {
		this.selected = [];
		this.marked = [];
		this.unmarked = [];
	}

	public get myDatePickerOptions() {
		let options = UtilsService.myDatePickerOptions;
		options.customPlaceholderTxt = 'MM/DD/YYYY';
		return options;
	}

	public import() {
		var self = this;
		this.marked.forEach(val => {
			var index = self.available.indexOf(val);
			if (index > -1) {
				self.available.splice(index, 1);
				this.addToExportTable(val);
			}
		});
		this.selected = this.sortAvailableSelectedArray(this.selected.concat(this.marked));
		this.marked = [];
	};

	public remove() {
		var self = this;
		this.unmarked.forEach(val => {
			var index = self.selected.indexOf(val);
			if (index > -1) {
				self.selected.splice(index, 1);
				this.removeFromExportTable(val);
			}
		});
		if (this.isWireLine) {
			this.available = this.sortAvailableSelectedArray(this.available
				.concat(_.filter(this.unmarked, variable => (this.isWireLine && variable.logUid === this.exporterModel.pass.LogUId))));
		} else {
			this.available = this.sortAvailableSelectedArray(this.available.concat(this.unmarked));
		}
		this.unmarked = [];
	};

	public toggleSelect(event: Event, val: ExporterInfo.TableDetails) {
		event.preventDefault();
		if (this.marked.indexOf(val) === -1) {
			this.marked = [...this.marked, val];
			var elem = document.getElementById(val.id);
			elem.className += ' selected';
		} else {
			var elem = document.getElementById(val.id);
			elem.className = elem.className.split(' ').splice(0, elem.className.split(' ').length - 2).join(' ');
			this.marked = this.marked.filter(elem => {
				return elem !== val;
			});
		}
	}

	public toggleDeSelect(event: Event, val: ExporterInfo.TableDetails) {
		event.preventDefault();
		if (this.unmarked.indexOf(val) === -1) {
			this.unmarked = [...this.unmarked, val];
			var elem = document.getElementById(val.id);
			elem.className += ' selected';
		} else {
			var elem = document.getElementById(val.id);
			elem.className = elem.className.split(' ').splice(0, elem.className.split(' ').length - 2).join(' ');
			this.unmarked = this.unmarked.filter(elem => {
				return elem !== val;
			});
		}
	}

	public startTimeDropDownToggle(event: Event) {
		this.showStartDropDown = !this.showStartDropDown;
		if (this.showStartDropDown)
			this.showDropDown = false;
		if (event)
			event.stopImmediatePropagation();
	}

	public endTimeDropDownToggle(event: Event) {
		this.showDropDown = !this.showDropDown;
		if (this.showDropDown)
			this.showStartDropDown = false;
		if (event)
			event.stopImmediatePropagation();
	}

	public outsideCliked() {
		if (this.showStartDropDown || this.showDropDown) {
			this.showDropDown = false;
			this.showStartDropDown = false;
		}
	}

	public onStartDateChanged(evt: any) {
		this.lastTouchedTime = 'StartDate';
		if (evt.value !== '')
			this.startTimeTouched = true;
		if (evt.valid) {
			this.exporterModel.StartDate = evt.value;
		} else {
			this.exporterModel.StartDate = '';
		}
	}
	public onEndDateChanged(evt: any) {
		this.lastTouchedTime = 'EndDate';
		if (evt.value !== '')
			this.endTimeTouched = true;
		if (evt.valid) {
			this.exporterModel.EndDate = evt.value;
		} else {
			this.exporterModel.EndDate = '';
		}
	}

	public export() {
		if (this.checkUnsupportedDataTypeAvailable()) {
			this.highlightUnsupportedItem = true;
			this.dialogService.confirm(this.resource.ExporterUnsupportedEntryDialog, this.exporterModel.FileFormat)
				.then(dialog => {
					dialog.result
						.then(confirmed => {
							this.callExportApi();
						})
						.catch(() => {
							// do nothing on cancel
						});
				});
		} else {
			this.callExportApi();
		}
	}

	public onIVTypeChange() {
		this.exportTable.length = 0;
		this.getStartEndIVTypeInfo(UtilsService.isTDBasedIV(this.exporterModel.IVType) ? 0 : 3);
		this.clearSelectedVariables();
		this.passList = _.filter(this.dashboardDataService.passList,
			pass => pass.IndexType === UtilsService.getLogIndexType(this.exporterModel.IVType));
		this.exporterModel.pass = this.getActivePass();
		this.available = this.getIVBasedTableDetails(this.exporterModel.IVType);

		this.startDepthTouched = false;
		this.endDepthTouched = false;
		this.startTimeTouched = false;
		this.endTimeTouched = false;
		this.startDatePickerElement.clearDate();
		this.endDatePickerElement.clearDate();
		this.exporterModel.clearDataSettings();
	}
	public onStartDepthChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.StartDepth = value;
		}
	}

	public onEndDepthChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.EndDepth = value;
		}
	}

	public onFixedWidthChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.FixedWidth = value;
		}
	}

	public onMissingFloatChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.MissingFloat = value;
		} else {
			this.exporterModel.MissingFloat = null;
		}
	}

	public onMissingIntegerChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.MissingInteger = value;
		} else {
			this.exporterModel.MissingInteger = null;
		}
	}

	public onEvenIntervalValueChange(value: number) {
		if (!isNaN(value)) {
			this.exporterModel.EvenIntervalValue = value;
		}
	}

	public onSmoothingDistanceChange(value: number, item: ExporterInfo.ExportTableDetails) {
		if (!isNaN(value)) {
			item.smoothingDistance = !UtilsService.isNullOrUndefined(value) ? value.toString() : null;
		}
	}

	public onPassTypeChange() {
		this.available = this.getIVBasedTableDetails(this.exporterModel.IVType);
		this.marked = [];
		_.forEach(this.unmarked, function (item) {
			let elem = document.getElementById(item.id);
			elem.className = elem.className.split(' ').splice(0, elem.className.split(' ').length - 2).join(' ');
		});
		this.unmarked = [];
	}

	protected getTableDetails(): ExporterInfo.TableDetails[] {
		let table: ExporterInfo.TableDetails[] = [];
		table = _.chain(this.dashboardDataService.variableList)
			.map((variable, index) => {
				return {
					id: 'id_' + index + variable.LogUid,
					mnemonic: variable.Mnemonic,
					name: variable.MnemonicAlias,
					table: variable.LogName,
					logUid: variable.LogUid,
					dataType: variable.DataType,
					unit: variable.Unit,
					specialHandling: variable.SpecialHandling
				};
			})
			.value();
		return table;
	}

	protected getIVBasedTableDetails(ivType?: string): ExporterInfo.TableDetails[] {
		let table = _.chain(this.dashboardDataService.variableList)
			.filter(variable => variable.IndexType === UtilsService.getLogIndexType(ivType))
			.value();
		let finalArray = [];
		finalArray = _.sortBy(table, ['LogName', 'MnemonicAlias']);
		finalArray = _.map(finalArray, (variable, index) =>
			({
				id: '' + index + variable.LogUid,
				mnemonic: variable.Mnemonic,
				name: variable.MnemonicAlias,
				table: variable.LogName,
				logUid: variable.LogUid,
				dataType: variable.DataType,
				unit: variable.Unit,
				specialHandling: variable.SpecialHandling
			}));

		if (this.isWireLine) {
			finalArray = _.filter(finalArray, variable => variable.logUid === this.exporterModel.pass.LogUId);
			if (this.selected.length) {
				_.forEach(this.selected, (item) => _.remove(finalArray, variable => item.name === variable.name));
			}
		}
		return finalArray;
	}

	public sortAvailableSelectedArray(list: any[]): any[] {
		return _.sortBy(list, ['table', 'name']);
	}


	public delimitedWithValueChanged() {
		this.exporterModel.DelimitedCharacter = GraphicsService.getDelimiltedValueCharacter(this.exporterModel.DelimitedValue);
		if (this.exporterModel.DelimitedCharacter === 'other') {
			this.exporterModel.DelimitedCharacter = '';
			this.disableDelimitedInput = false;
		} else
			this.disableDelimitedInput = true;
	}

	public clearExporter() {
		this.showDropDown = false;
		this.showStartDropDown = false;
		this.disableDelimitedInput = true;
		this.exporterModel.clearFormInputValues();
		this.startDatePickerElement.clearDate();
		this.endDatePickerElement.clearDate();
		this.onIVTypeChange();
	}

	public onlyNumberKey(event) {
		return (event.charCode === 8 || event.charCode === 0) ? null : event.charCode >= 48 && event.charCode <= 57;
	}

	public withinMaxMinRange(): boolean {
		var result: boolean = true;
		this.exportTable.forEach(element => {
			if (parseFloat(element.smoothingDistance) < 0 || parseFloat(element.smoothingDistance) > 9999 || element.smoothingDistance === null) {
				result = false;
			}
		});
		this.exporterModel.IsValid = result;
		return result;
	}

	public isUnsupportedEntry(dataType: string): boolean {
		let status: boolean = false;
		switch (this.exporterModel.FileFormat) {
			case UtilsService.FileFormats.LAS2:
				status = UtilsService.isFileFormatLAS2(this.exporterModel.FileFormat) && dataType === 'string';
				break;
			case UtilsService.FileFormats.ASCII:
				break;
			case UtilsService.FileFormats.DLIS:
				break;
			case UtilsService.FileFormats.LIS:
				break;
			default:
				break;
		}
		return status;
	}

	private checkUnsupportedDataTypeAvailable(): boolean {
		if (UtilsService.isFileFormatLAS2(this.exporterModel.FileFormat)) {
			return _.find(this.exportTable, variable => variable.dataType === 'string') === undefined ? false : true;
		}
		return false;
	}

	private callExportApi() {
		this.highlightUnsupportedItem = false;
		this.rtsWebService.getExporterData(this.exporterModel).subscribe(
			rawResponse => {
				if (this.sessionService.session) {
					const baseUrl = this.rtsWebService.getUpdateUrlFromSession();
					const waiToken = this.sessionService.session.WaiToken;
					const jobName = this.dashboardDataService.currentJob.JobName;
					window.open(`${baseUrl}/Export?fileKey=${rawResponse}&waiToken=${waiToken}&jobName=${jobName}`, '_blank');
				}
			},
			error => {
				let errorString: string = error.text();
				if (errorString !== null) {
					let errorStringArray = error.text().split(':');
					errorString = errorStringArray[0];
				}
				this.dialogService.alert(this.resource.ApplicationErrorDialog, errorString);
			});
	}

	private getActivePass(): LogsApi.WLIPassInfo {
		let activePass = _.find(this.passList,
			pass => (pass.PassName === 'DAQ Current_Time' && UtilsService.getLogIndexType(this.exporterModel.IVType) !== 'measureddepth') ||
				(pass.PassName === 'DAQ Current_Depth' && UtilsService.getLogIndexType(this.exporterModel.IVType) === 'measureddepth'));
		return activePass === undefined ? this.passList[0] : activePass;
	}

	private getComplexLogParams(ivType: LogsApi.LogIndexType): LogsApi.PostComplexCombinedNewLogsRequest {

		return {
			IndexType: ivType,
			RtsComplexLogQueryList: this.getRtsLogQueryRequestParams(ivType),
			UidWell: this.dashboardDataService.currentJob.WellUid
		};
	}
	private getRtsLogQueryRequestParams(ivType: LogsApi.LogIndexType): LogsApi.NewFindComplexMinMaxRequest[] {
		let params: LogsApi.NewFindComplexMinMaxRequest[] = [];
		const ivMatched = (ivType === 0) ? 'datetime' : 'measureddepth';
		let ivMatchedList = _.chain(this.dashboardDataService.currentJob.LogUids)
			.filter(variable => variable.indexType === ivMatched)
			.value();
		params = _.map(ivMatchedList, (variable, index) =>
			({
				Uid: variable.uid,
				Uom: this.dashboardDataService.currentJob.UnitSet,
				Size: 'm'
			}));
		return params;
	}

	private addToExportTable(table: ExporterInfo.TableDetails) {
		let exportTableCopy: ExporterInfo.ExportTableDetails = {
			variable: table.name,
			id: table.id,
			mnemonic: table.mnemonic,
			table: table.table,
			traceLabel: table.name,
			uom: table.unit,
			smoothingOption: ['Smoothing'],
			intervalDistance: this.exporterModel.DataPoint ? 1 : this.exporterModel.EvenIntervalValue,
			smoothingDistance: '1.0',
			logUid: table.logUid,
			dataType: table.dataType,
			unit: table.unit,
			specialHandling: table.specialHandling
		};
		this.exportTable.push(exportTableCopy);
		this.sortExportTableArray();
	}

	private removeFromExportTable(table: ExporterInfo.TableDetails) {
		_.remove(this.exportTable, (n) => {
			return n.id === table.id;
		});
		this.sortExportTableArray();
	}

	private sortExportTableArray() {
		this.exportTable = _.sortBy(this.exportTable, ['table', 'variable']);
		this.exporterModel.exportTableArray = this.exportTable;
	}
}
