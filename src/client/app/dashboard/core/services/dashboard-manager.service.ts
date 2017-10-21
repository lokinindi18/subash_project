import { Injectable, Inject } from '@angular/core';
import 'rxjs/add/operator/share';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subject } from 'rxjs/Subject';
import { IEditable } from './../data/editable';
import { Router } from '@angular/router';
import { Model } from './../data/model';
import {IObjectPlotMenu} from './../data/object-data';
import { DashboardModel } from './../data/dashboard.model';
import { SerializerService } from './serializer.service';
import { DashboardContainerModel } from '../../components/dashboard-containers/dashboard-container.model';
import { DashboardDataService } from './dashboard-data.service';
import { DialogService, SessionService, KeepAliveService, APP_RESOURCE, IResource,
	LoggingService } from './../../../shared/services/services';
import { CreateDashboardWindowComponent, CreateDashboardWindowParams }
from './../../components/create-dashboard-dialog/create-dashboard-dialog.component';
import * as _ from 'lodash';

@Injectable()
export class DashboardManagerService {
	public currentDashboard: DashboardModel = null;
	public isDashboardInEditMode = false;
	public isSameConatiner: boolean = true;
	public isCancelPressed: boolean = false;
	public isDBChangedFromGM: boolean = false;
	public clickedDBId: number;

	// Events
	/**
	 * Event raised when current dashboard is changed
	 *
	 * @type {Observable<DashboardModel>}
	 */
	public dashboardChangedEvent: Observable<DashboardModel>;
	public addObjectEvent: Observable<string>;
	public addObjectToContainerEvent: Observable<DashboardContainerModel>;
	public deleteObjectEvent: Observable<Model>;
	public selectedObjectChangedEvent: Observable<IEditable>;
	public selectedObjectMaxEvent: Observable<Model>;
	public containerAutoModeEvent: Observable<Model>;
	public globalMenuChangedEvent: Observable<boolean>;
	public refreshGlobalMenuEvent: Observable<DashboardModel>;
	public propertyMenuChangedEvent: Observable<boolean>;
	public objectPanelChangedEvent: Observable<string>;
	public objectSelectedEvent: Observable<boolean>;
	public containerZIndexChangedEvent: Observable<IObjectPlotMenu>;
	/**
	 * Event raised when dashboard mode is changed from edit to read only and vice-versa
	 *
	 * @type {Observable<boolean>}
	 */
	public editModeChangedEvent: Observable<boolean>;
	public wellInfoClickedEvent: Observable<boolean>;
	public dashboardInValidEvent: Observable<boolean>;

	public wellInfoRefreshEvent: Observable<boolean>;

	private wellInfoRefreshSource = new Subject<boolean>();
	private dashboardChangedSource = new Subject<DashboardModel>();
	private addObjectSource = new Subject<string>();
	private addObjectToContainerSource = new Subject<DashboardContainerModel>();
	private deleteObjectSource = new Subject<Model>();
	private objectPanelChangedSource = new Subject<string>();
	private editModeChangedSource = new Subject<boolean>();
	private wellInfoClickedSource = new Subject<boolean>();
	private selectedObjectChangedSource = new Subject<IEditable>();
	private selectedObjectMaxEvntSource = new Subject<Model>();
	private containerAutoModeSource = new Subject<Model>();
	private globalMenuChangedSource = new Subject<boolean>();
	private refreshGlobalMenuSource = new Subject<DashboardModel>();
	private dashboardInValidSource = new Subject<boolean>();
	private propertyMenuChangedSource = new Subject<boolean>();
	private objectSelectedSource = new Subject<boolean>();
	private containerZIndexChangedSource = new Subject<IObjectPlotMenu>();

	/**
	 * to keep the backup as soon as dashboard goes into edit editMode
	 * If the user cancel the save, we would use this to revert the dashboard changes
	 *
	 * @private
	 * @type {*}
	 */
	private backupDashboardData: any;

	public setDashboardDirty(isDirty: boolean = true) {
		this.currentDashboard.IsDirty = isDirty;
	}

	constructor(
		private serializerService: SerializerService,
		private dashboardDataService: DashboardDataService,
		private dialogService: DialogService,
		private sessionService: SessionService,
		private keepAliveService: KeepAliveService,
		private router: Router,
		@Inject(APP_RESOURCE) private resource: IResource,
		private loggingService: LoggingService) {
		this.dashboardChangedEvent = this.dashboardChangedSource.asObservable();
		this.addObjectEvent = this.addObjectSource.asObservable();
		this.addObjectToContainerEvent = this.addObjectToContainerSource.asObservable();
		this.deleteObjectEvent = this.deleteObjectSource.asObservable();
		this.selectedObjectChangedEvent = this.selectedObjectChangedSource.asObservable();
		this.selectedObjectMaxEvent = this.selectedObjectMaxEvntSource.asObservable();
		this.containerAutoModeEvent = this.containerAutoModeSource.asObservable();
		this.editModeChangedEvent = this.editModeChangedSource.asObservable();
		this.wellInfoClickedEvent = this.wellInfoClickedSource.asObservable();
		this.objectPanelChangedEvent = this.objectPanelChangedSource.asObservable();
		this.globalMenuChangedEvent = this.globalMenuChangedSource.asObservable();
		this.refreshGlobalMenuEvent = this.refreshGlobalMenuSource.asObservable();
		this.propertyMenuChangedEvent = this.propertyMenuChangedSource.asObservable();
		this.dashboardInValidEvent = this.dashboardInValidSource.asObservable();
		this.objectSelectedEvent = this.objectSelectedSource.asObservable();
		this.wellInfoRefreshEvent = this.wellInfoRefreshSource.asObservable();
		this.containerZIndexChangedEvent = this.containerZIndexChangedSource.asObservable();
	}

	public setCurrentDashboard(dashboard: DashboardModel) {
		this.currentDashboard = dashboard;
		this.currentDashboard.newName = dashboard.Name;
		this.dashboardChangedSource.next(dashboard);
	}

	public deleteObject(model: Model) {
		this.deleteObjectSource.next(model);
	}

	public isEditModeShown() {
		return this.isDashboardInEditMode;
	}


	/**
	 * Sets the dashboard as editable or read only
	 *
	 * @param {boolean} editMode true to set to edit mode, false for readonly
	 */
	public setDashboardMode(editMode: boolean) {
		this.isDashboardInEditMode = editMode;
		if (editMode)
			// Keep a backup of dashboard so that we can revert the changes later on
			this.backupDashboardData = this.serializerService.serialize(this.currentDashboard);
		this.editModeChangedSource.next(editMode);
	}

	/**
	 * Broadcase well info to all the subscriber */
	public setWellInfo(isWellInfo: boolean) {
		this.wellInfoClickedSource.next(isWellInfo);
	}

	public wellInfoRefresh(iswellRefresh: boolean) {
		this.wellInfoRefreshSource.next(iswellRefresh);
	}

	public objectPanelChanged(objectPanelName: string = 'DataPanel') {
		this.objectPanelChangedSource.next(objectPanelName);
	}

	/**
	 * reverts a dashboard to its original state
	 *
	 * @param {boolean} [refreshRequired=false] Optionally raises a dashboard change event
	 */
	public revertDashboard(refreshRequired: boolean = false) {
		// To revert a dashboard to its original state, we delete the existing dashboard with the changes and
		// add a new dashboard from backup

		_.pull(this.dashboardDataService.dashboards, this.currentDashboard);
		this.currentDashboard = this.serializerService.deserialize(this.backupDashboardData) as DashboardModel;

		this.dashboardDataService.dashboards.push(this.currentDashboard);

		if (refreshRequired) {
			this.dashboardChangedSource.next(this.currentDashboard);
		}
	}

	public refreshGlobalMenu(dashboard: DashboardModel) {
		if (this.currentDashboard !== dashboard) {
			this.setCurrentDashboard(dashboard);
		}
		this.refreshGlobalMenuSource.next(dashboard);
	}

	public setGlobalMenuPosition(isCollapsed: boolean) {
		this.globalMenuChangedSource.next(isCollapsed);
	}

	public setPropertyMenuPosition(isCollapsed: boolean) {
		this.propertyMenuChangedSource.next(isCollapsed);
	}

	public loadDashboard(dashboardId: number) {
		this.clickedDBId = dashboardId;
		var dashboard = _.find(this.dashboardDataService.dashboards, db => db.Id === dashboardId);

		if (dashboard) {
			this.loggingService.log('loadDashboard');
			this.setCurrentDashboard(dashboard);
		}
	}

	public raiseSelectedObjectChanged(selectedObject: IEditable) {
		this.selectedObjectChangedSource.next(selectedObject);
	}
	public raiseSelectedObjectMaxSize(selectedObject: Model) {
		selectedObject.IsDirty = true;
		this.selectedObjectMaxEvntSource.next(selectedObject);
	}

	public raiseContainerAutoMode(model: Model) {
		model.IsDirty = true;
		this.containerAutoModeSource.next(model);
	}

	public selectedObjectChanged(isSelected: boolean) {
		this.objectSelectedSource.next(isSelected);
	}

	public containerZIndexChanged(res: IObjectPlotMenu) {
		this.containerZIndexChangedSource.next(res);
	}

	public addNewObject(objectTypeName: string) {
		this.addObjectSource.next(objectTypeName);
	}

	public addNewObjectToContainer(containerModel: DashboardContainerModel) {
		this.addObjectToContainerSource.next(containerModel);
	}

	public isLoggedIn(error: any): boolean {
		if (error.status !== 401) {
			return true;
		}
		var errorString: string = 'Internal Server Error.';
		if (error.status !== 500) {
			if (error.text() !== null) {
				var errorStringArray = error.text().split(':');
				errorString = errorStringArray[0];
			}
		}
		this.dialogService.alert(this.resource.UserUnauthorizedDialog, errorString)
			.then(dialog => {
				this.keepAliveService.StopKeepAlive();
				dialog.result
					.catch(() => {
						if(this.currentDashboard)
							this.currentDashboard.IsDirty = false;
						this.dialogService.dismissDialog();
						this.router.navigate(['/'])
							.then(() => {
								this.sessionService.end();
							});
					});
			});
		return false;
	}

	/**
	 * Creates a new dashboard or copies an existing dashboard
	 *
	 * @param {DashboardModel} [dashboardToCopy] null or undefined to create a new dashboard, otherwise the dashboard to copy
	 * @returns an `Observable<DashboardModel>`
	 */
	public createDashboard(dashboardToCopy?: DashboardModel, isCopy = false) {
		return new Observable<DashboardModel>((observer: Subscriber<DashboardModel>) => {
			this.dialogService.openModalDialog(CreateDashboardWindowComponent,
				new CreateDashboardWindowParams(this.serializerService, dashboardToCopy, _.map(this.dashboardDataService.dashboards, db => db.Name)))
				.then(dialog => {
					dialog.result
						.then((dashboard: DashboardModel) => {
							this.dialogService.wait(`Saving dashboard ${dashboard.Name}`)
								.then(waitDialog => {
									dashboard = this.serializerService.deserialize(dashboard);
									this.dashboardDataService.saveDashboard(dashboard)
										.subscribe(
										db => {
											db.Objects.forEach(function (container: DashboardContainerModel) {
												container.Objects.forEach(function (object) {
													if (object.Type.indexOf('Plot') !== -1 ||
														object.Type === 'Table') {
														object.isCopied = isCopy;
													}
												});
											});
											this.dashboardDataService.dashboards.push(db);
											// this.currentDashboard = db;
											waitDialog.close();
											observer.next(db);
											observer.complete();
										},
										error => {
											observer.error(error);
											waitDialog.close();
											if (this.isLoggedIn(error)) {
												this.dialogService.alert(this.resource.ApplicationErrorDialog,
													this.dashboardDataService.parseErrorMessage(error));
											}
											// this.dialogService.alert(this.resource.ApplicationErrorDialog,
											// 	this.dashboardDataService.parseErrorMessage(error));
										});
								});
						})
						.catch(() => {
							// Do nothing on cancel
						});
				});

		});
	}

}

