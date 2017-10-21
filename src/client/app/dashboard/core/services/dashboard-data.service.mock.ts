import {DashboardDataService} from './dashboard-data.service';

//This can be used whenever you need DashboardDataService but don't want to use it.
//Inject it for it.
export class MockDashboardDataService extends DashboardDataService {

	constructor() {
		// Not required to create internal services. If required then mock service instances shud be created
		super(void 0, void 0, void 0, void 0, void 0, void 0, void 0);
	// public dashboardsLoadedEvent: Observable<DashboardModel[]>;
	// public dashboardDeletedEvent: Observable<DashboardModel>;
	// public dashboards: DashboardModel[] = [];
	// public variableList: QueryLogsApi.ILog[] = [];
	// public preDefineObjectList: QueryPredefineObjectTemplateApi.ReportTemplate[] = [];
	// public currentJob: AuthenticateApi.IJob;
	// public isDashboardDelete: boolean = false;

	// private dashboardsLoadedSource = new Subject<DashboardModel[]>();
	// private dashboardDeletedSource = new Subject<DashboardModel>();

	// constructor() {
	// 	this.dashboardsLoadedEvent = this.dashboardsLoadedSource.asObservable();
	// 	this.dashboardDeletedEvent = this.dashboardDeletedSource.asObservable();
	}

	// public setCurrentJob(job: AuthenticateApi.IJob) {
	// 	//this.currentJob = job;
	// }

	// public setCurrentJobTimeZone() {
	// 	// if (this.currentJob) {
	// 	// 	this.timeZoneService.setJobTimeZone(this.currentJob.JobName);
	// 	// }
	// }
	// public loadDashboards() {
	// 	// this.dashboards.length = 0;

	// 	// // Assign id to dashboard properly
	// 	// this.rtsWebService.getDashboards(this.currentJob)
	// 	// 	.map(response => _.chain(response)
	// 	// 		.map(dbc => {
	// 	// 			if (dbc.Dashboard !== undefined) {
	// 	// 				dbc.Dashboard.Id = dbc.Id;
	// 	// 				dbc.Dashboard.Name = dbc.Name;
	// 	// 				dbc.Dashboard.IsDefault = dbc.IsDefault;
	// 	// 				dbc.Dashboard.Type = 'Dashboard';
	// 	// 				return this.serializerService.deserialize(dbc.Dashboard);
	// 	// 			}
	// 	// 		})
	// 	// 		.value())
	// 	// 	.subscribe(dbs => {
	// 	// 		// remove the undefined(bad) dashboard from the dashboard list
	// 	// 		_.forEach(dbs, function (element) {
	// 	// 			if (element === undefined) {
	// 	// 				_.pull(dbs, element);
	// 	// 			}
	// 	// 		});
	// 	// 		// Query the curves before we load the dashboard
	// 	// 		this.rtsWebService.queryLogs(this.currentJob)
	// 	// 			.subscribe(logs => {
	// 	// 				this.dashboards.push(...dbs);
	// 	// 				this.variableList = _.sortBy(logs, l => l.Curve.toLocaleLowerCase());
	// 	// 				this.dashboardsLoadedSource.next(this.dashboards);
	// 	// 			},
	// 	// 			error => this.dashboardsLoadedSource.error(error));
	// 	// 	}, error => this.dashboardsLoadedSource.error(error));
	// }

	// public getLatestCurves(): Observable<QueryLogsApi.ILog[]> {
	// 	//return this.rtsWebService.queryLogs(this.currentJob);
	// 	return null;
	// }

	// public handleGetCurvesError(error: any) {
	// 	//this.dashboardsLoadedSource.error(error);
	// }

	// public loadObjectTemplist() {
	// 	// this.rtsWebService.queryObjectTemplate(this.currentJob)
	// 	// 	.subscribe(objectTemplate => {
	// 	// 		this.preDefineObjectList = _.sortBy(objectTemplate, ob => ob.Name.toLocaleLowerCase());
	// 	// 	},
	// 	// 	error => console.log(error.text()));
	// }

	// public updateCurveList() {
	// 	// this.rtsWebService.queryLogs(this.currentJob)
	// 	// 	.subscribe(logs => {
	// 	// 		this.variableList = _.sortBy(logs, l => l.Curve.toLocaleLowerCase());
	// 	// 	},
	// 	// 	error => this.dashboardsLoadedSource.error(error));
	// }

	// public saveDashboard(dashboard: DashboardModel): Observable<DashboardModel> {
	// 	// return this.rtsWebService.saveDashboard(this.serializerService.serialize(dashboard) as DashboardModel, this.currentJob)
	// 	// 	.map(response => {

	// 	// 		// Everytime dashboards are saved we update our dashboard list with alphabetical reordering
	// 	// 		//this.dashboards.sortAll();

	// 	// 		dashboard.Id = response || dashboard.Id;
	// 	// 		dashboard.resetDirty();
	// 	// 		return dashboard;
	// 	// 	});
	// 	return null;
	// }

	// public deleteDashboard(dashboard: DashboardModel) {
	// 	// this.rtsWebService.deleteDashboard(dashboard, this.currentJob)
	// 	// 	.subscribe(
	// 	// 	response => this.dashboardDeletedSource.next(dashboard),
	// 	// 	error => this.dashboardDeletedSource.error(this.parseErrorMessage(error)));
	// }

	// public parseErrorMessage(error: any): string {
	// 	// if (error.status === 500) {
	// 	// 	return 'Internal Server Error.';
	// 	// }
	// 	// var errorString: string = error.text();
	// 	// if (errorString !== null) {
	// 	// 	var errorStringArray = error.text().split(':');
	// 	// 	errorString = errorStringArray[0];
	// 	// }
	// 	// return errorString;
	// 	return '';
	// }
}
