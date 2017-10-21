import { Injectable } from '@angular/core';
import {
	RtsWebService, AuthenticateApi, LogsApi, QueryLogsApi, ApiWebService, RtDataHubService, WellsApi,
	QueryPredefineObjectTemplateApi, TimeZoneService, UtilsService, IRealTimeEvent, IRealTimeEventData, LoggingService
}
	from './../../../shared/services/services';
import 'rxjs/add/operator/share';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Observer } from 'rxjs/Observer';
import { DashboardModel } from './../data/dashboard.model';
import { SerializerService } from './serializer.service';
import { GTKManagerService } from './gtk-manager.service';

import * as _ from 'lodash';

@Injectable()
export class DashboardDataService {
	public dashboardsLoadedEvent: Observable<DashboardModel[]>;
	public dashboardDeletedEvent: Observable<DashboardModel>;
	public dashboradWirelineDirectionEvent: Observable<IRealTimeEventData>;
	public dashboradWirelinePassChangeEvent: Observable<IRealTimeEventData>;
	public dashboradWirelineLogAddedEvent: Observable<IRealTimeEventData>;

	public dashboards: DashboardModel[] = [];
	public variableList: QueryLogsApi.ILog[] = [];
	public passList: LogsApi.WLIPassInfo[] = [];
	public preDefineObjectList: QueryPredefineObjectTemplateApi.ReportTemplate[] = [];
	public currentJob: AuthenticateApi.IJob;
	public isDashboardDelete: boolean = false;
	public currentPassDirection: string = UtilsService.logType.TimeDriven;
	public depthUnit: string = 'ft';

	private dashboardsLoadedSource = new Subject<DashboardModel[]>();
	private dashboardDeletedSource = new Subject<DashboardModel>();
	private dashboardWirelineDirectionSource = new Subject<IRealTimeEventData>();
	private dashboardWirelinePassChangeSource = new Subject<IRealTimeEventData>();
	private dashboardWirelineLogAddedSource = new Subject<IRealTimeEventData>();
	constructor(
		private rtsWebService: RtsWebService,
		private apiService: ApiWebService,
		private serializerService: SerializerService,
		private timeZoneService: TimeZoneService,
		private rtService: RtDataHubService,
		private gtkManagerService: GTKManagerService,
		private loggingService: LoggingService) {
		this.dashboardsLoadedEvent = this.dashboardsLoadedSource.asObservable();
		this.dashboardDeletedEvent = this.dashboardDeletedSource.asObservable();
		this.dashboradWirelineDirectionEvent = this.dashboardWirelineDirectionSource.asObservable();
		this.dashboradWirelinePassChangeEvent = this.dashboardWirelinePassChangeSource.asObservable();
		this.dashboradWirelineLogAddedEvent = this.dashboardWirelineLogAddedSource.asObservable();
	}

	public setCurrentJob(job: AuthenticateApi.IJob) {
		this.currentJob = job;
	}

	public setCurrentJobTimeZone() {
		if (this.currentJob) {
			this.timeZoneService.setTimeZone(this.currentJob.JobName);
		}
	}

	public getLithPatterns() {
		this.apiService.getLithPatterns(this.currentJob.WellUid)
			.subscribe(lithPatternResponse => {
				this.gtkManagerService.setLithPatterns(lithPatternResponse);
			},
			error => this.loggingService.log(error.text()));
	}

	public getDepthUnit() {
		return new Observable<string>((observer: Observer<string>) => {
			if (this.currentJob.UnitSet && this.currentJob.UnitSet.length > 0) {
				let currentUnitSet = this.currentJob.UnitSet.split('|')[1];
				this.apiService.getDepthUnit(currentUnitSet)
					.subscribe(depthUnitResponse => {
						if (depthUnitResponse.response && depthUnitResponse.response.uomProfileDefaultUnits &&
							depthUnitResponse.response.uomProfileDefaultUnits.length > 0 && depthUnitResponse.response.uomProfileDefaultUnits[0].unitTypes &&
							depthUnitResponse.response.uomProfileDefaultUnits[0].unitTypes.length > 0) {
							this.depthUnit = depthUnitResponse.response.uomProfileDefaultUnits[0].unitTypes[0].defaultUnits.shortUnit;
							this.loggingService.log(this.depthUnit);
						}
					},
					error => {
						this.loggingService.log(error.text());
						observer.error(error);
					}, () => {
						observer.next(this.depthUnit);
						observer.complete();
					});
			} else {
				observer.next(this.depthUnit);
				observer.complete();
			}
		});
	}


	public getSortedPassList(ivType: string) {
		let passList = _.map(_.filter(this.passList, pass => {
			return pass.IndexType === UtilsService.getLogIndexType(ivType);
		}), 'PassName');

		if (passList && passList.length > 0) {
			passList.sort();
			if (UtilsService.isDepthBasedIV(ivType)) {
				_.pull(passList, UtilsService.DefaultPassNames.DepthBased);
				passList.unshift(UtilsService.DefaultPassNames.DepthBased);
			} else {
				_.pull(passList, UtilsService.DefaultPassNames.TimeBased);
				passList.unshift(UtilsService.DefaultPassNames.TimeBased);
			}
			return passList;
		} else {
			return [];
		}
	}

	public loadDashboard() {
		this.dashboards.length = 0;
		return new Observable<DashboardModel[]>((observer: Observer<DashboardModel[]>) => {
			this.rtsWebService.getDashboards(this.currentJob)
				.map(response => _.chain(response)
					.map(dbc => {
						if (dbc.Dashboard !== undefined) {
							dbc.Dashboard.Id = dbc.Id;
							dbc.Dashboard.Name = dbc.Name;
							dbc.Dashboard.IsDefault = dbc.IsDefault;
							dbc.Dashboard.Type = 'Dashboard';
							return this.serializerService.deserialize(dbc.Dashboard);
						}
					})
					.value())
				.subscribe(dbs => {
					// remove the undefined(bad) dashboard from the dashboard list
					_.forEach(dbs, function (element) {
						if (element === undefined) {
							_.pull(dbs, element);
						}
					});
					if (this.currentJob.PSLName === UtilsService.PSLNames.Wireline) {
						this.getWirelineEventData();
					}
					this.rtsWebService.queryLogs(this.currentJob).
						subscribe(logs => {
							this.dashboards.push(...dbs);
							this.fillVariableList(logs);
							//this.variableList = _.sortBy(logs, l => l.Curve.toLocaleLowerCase());
							observer.next(this.dashboards);
							observer.complete();
						},
						error => {
							this.dashboardsLoadedSource.error(error);
							observer.error(error);
						});
				}, error => {
					this.dashboardsLoadedSource.error(error);
					observer.error(error);
				});
		});
	}

	public dashboardLoaded() {
		this.dashboardsLoadedSource.next(this.dashboards);
	}

	public restartDashboardObserver() {
		if(!this.dashboardsLoadedSource.isStopped) return;
		this.dashboardsLoadedSource = new Subject<DashboardModel[]>();
		this.dashboardsLoadedEvent = this.dashboardsLoadedSource.asObservable();

		if (!this.dashboardDeletedSource.isStopped) return;
		this.dashboardDeletedSource = new Subject<DashboardModel>();
		this.dashboardDeletedEvent = this.dashboardDeletedSource.asObservable();
	}

	public getPassDirection() {
		return new Observable<string>((observer: Observer<string>) => {
			if (this.currentJob.PSLName === UtilsService.PSLNames.Wireline) {
				this.apiService.getLogDirection(this.currentJob.WellUid)
					.subscribe(rawResponse => {
						if (rawResponse.response) {
							let rawData = rawResponse.response.rawdata;
							if (rawData === null || rawData === undefined || rawData.length === 0 || rawData[0] === null
								|| rawData[0] === undefined) {
								this.currentPassDirection = UtilsService.logType.TimeDriven;
							} else {
								let wellsLogDict: WellsApi.IWellLogData = rawResponse.response.rawdata[0];
								let wellLogData: WellsApi.IWellRawData = wellsLogDict.logData;
								let dataArr = wellLogData.data[0];
								this.currentPassDirection = dataArr[3];
							}
						}
						observer.next(this.currentPassDirection);
						observer.complete();
					});
			} else {
				observer.next(this.currentPassDirection);
				observer.complete();
			}

		});
	}

	public getPassOnLoadDashboard() {
		return new Observable<LogsApi.WLIPassInfo[]>((observer: Observer<LogsApi.WLIPassInfo[]>) => {
			if (this.currentJob.PSLName === UtilsService.PSLNames.Wireline) {
				this.getPass(observer);
			} else {
				this.passList = [];
				observer.next(this.passList);
				observer.complete();
			}
		});
	}

	public getPass(observer?: Observer<LogsApi.WLIPassInfo[]>) {
		this.apiService.findLogs({ 'UidWell': this.currentJob.WellUid, 'size': 'm' })
			.subscribe(response => {
				if (response) {
					this.passList = [];
					_.forEach(response, (log) => {
						this.passList.push({
							PassName: log.name,
							LogUId: log.uid,
							IndexType: log.indexType,
							direction: log.direction
						});
					});
				}
				if (observer) {
					observer.next(this.passList);
					observer.complete();
				}
			});
	}

	public getWirelineEventData() {
		let wirelineEventRequest: IRealTimeEvent = {
			uid: this.currentJob.WellUid,
			objectType: 'Well',
			eventname: ''
		};
		this.rtService.subscribeEvent(wirelineEventRequest)
			.subscribe((wirelineEvent: IRealTimeEventData) => {
				if (UtilsService.isCurrentDirectionEvent(wirelineEvent)) {
					this.currentPassDirection = wirelineEvent.eventValue;
					this.dashboardWirelineDirectionSource.next(wirelineEvent);
				} else if (UtilsService.isCurrentPassEvent(wirelineEvent)) {
					this.dashboardWirelinePassChangeSource.next(wirelineEvent);
				} else if (UtilsService.isLogAddedPassEvent(wirelineEvent)) {
					this.dashboardWirelineLogAddedSource.next(wirelineEvent);
				}
			});
	}

	public getLatestCurves(): Observable<QueryLogsApi.ILog[]> {
		return this.rtsWebService.queryLogs(this.currentJob);
	}

	public handleGetCurvesError(error: any) {
		this.dashboardsLoadedSource.error(error);
	}

	public loadObjectTemplist() {
		this.rtsWebService.queryObjectTemplate(this.currentJob)
			.subscribe(objectTemplate => {
				this.preDefineObjectList = _.sortBy(objectTemplate, ob => ob.Name.toLocaleLowerCase());
			},
			error => this.loggingService.log(error.text()));
	}

	public updateCurveList() {
		this.rtsWebService.queryLogs(this.currentJob)
			.subscribe(logs => {
				this.fillVariableList(logs);
				//this.variableList = _.sortBy(logs, l => l.Curve.toLocaleLowerCase());
			},
			error => this.dashboardsLoadedSource.error(error));
	}

	public saveDashboard(dashboard: DashboardModel): Observable<DashboardModel> {
		return this.rtsWebService.saveDashboard(this.serializerService.serialize(dashboard) as DashboardModel, this.currentJob)
			.map(response => {

				// Everytime dashboards are saved we update our dashboard list with alphabetical reordering
				//this.dashboards.sortAll();

				dashboard.Id = response || dashboard.Id;
				dashboard.resetDirty();
				return dashboard;
			});
	}

	public deleteDashboard(dashboard: DashboardModel) {
		return this.rtsWebService.deleteDashboard(dashboard, this.currentJob)
			.map(response => dashboard);
	}

	public deleteDashboardSuccess(dashboard: DashboardModel) {
		this.dashboardDeletedSource.next(dashboard);
	}

	public parseErrorMessage(error: any): string {
		if (error.status === 500) {
			return 'Internal Server Error.';
		}
		var errorString: string = error && error.text && error.text();
		if (UtilsService.isNullOrUndefined(errorString)) {
			errorString = '';
		} else {
			var errorStringArray = error.text().split(':');
			errorString = errorStringArray[0];
		}
		return errorString;
	}

	public fillVariableList(logs: QueryLogsApi.ILog[]) {
		this.variableList = _.chain(logs)
			.map((log) => {
				let matchedLog = _.find(this.currentJob.LogUids, (logUid) => {
					return logUid.uid === log.LogUid;
				});
				log.IndexType = matchedLog ? matchedLog.indexType : '';
				return log;
			})
			.sortBy(log => log.MnemonicAlias.toLocaleLowerCase())
			.value();
	}

	public getRealTimeLogInfo(curve: string, ivType?: LogsApi.LogIndexType) {
		if (this.currentJob.PSLName === UtilsService.PSLNames.Wireline) {
			if (!UtilsService.isNullOrUndefined(ivType)) {
				let activePassUid = _.find(this.passList, p => {
					return (ivType === LogsApi.LogIndexType.ElapsedTime || ivType === LogsApi.LogIndexType.DateTime) ?
						p.PassName === UtilsService.DefaultPassNames.TimeBased
						: p.PassName === UtilsService.DefaultPassNames.DepthBased;
				});
				return _.find(this.variableList, v => {
					return v.MnemonicAlias === curve && (activePassUid && activePassUid.LogUId === (v.LogUid));
				});
			} else {
				let matchedCurve;
				let activePass = _.find(this.passList, p => this.currentPassDirection === UtilsService.logType.TimeDriven ?
					p.PassName === UtilsService.DefaultPassNames.TimeBased : p.PassName === UtilsService.DefaultPassNames.DepthBased);
				this.loggingService.log(activePass);
				if (activePass) {
					matchedCurve = _.find(this.variableList, v => v.MnemonicAlias === curve && (activePass.LogUId === v.LogUid));
				}
				return matchedCurve;
			}
		} else {
			if (ivType) {
				return _.find(this.variableList, v => v.MnemonicAlias === curve &&
					v.IndexType === UtilsService.getLogIndexType(LogsApi.LogIndexType[ivType]));
			} else {
				return _.find(this.variableList, v => (v.MnemonicAlias === curve));
			}
		}
	}
}
