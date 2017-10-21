// import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import {
	Component, Inject,
	OnInit, OnDestroy, AfterViewInit, ComponentFactoryResolver, ViewContainerRef, ComponentRef
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { SessionService, DialogService, LoggingService } from '../../../shared/services/services';
import { Subscription } from 'rxjs/Subscription';
import { DashboardPropertiesComponent } from '../dashboard-properties/dashboard-properties.component';
import {
	DashboardDataService, DashboardManagerService, ViewFactoryService,
	Model, DashboardModel, IEditable, SerializerService, UIService
} from './../../core/core';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import { DashboardContainerModel } from './../dashboard-containers/dashboard-container.model';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Location } from '@angular/common';

import * as _ from 'lodash';

class ComponentInstruction {
	public next: any;
	public params: any;
}


@Component({
	selector: 'iw-dashboard-canvas',
	moduleId: module.id,
	templateUrl: './dashboard-canvas.component.html',
	styleUrls: ['./dashboard-canvas.component.css'],
})

export class DashboardCanvasComponent implements OnInit, OnDestroy, AfterViewInit, IEditable {
	protected containerLocation: ViewContainerRef;
	public PropertiesEditorType = DashboardPropertiesComponent;
	public Model: DashboardModel;
	public currentDashBoard: DashboardModel;
	public isDragEnabled: boolean = false;
	public isObjectSelected: boolean = false;
	private viewInitialized = false;
	private isCollapsed = false;

	private dashboardChangedSubscription: Subscription;
	private deleteContainerSubscription: Subscription;
	private addObjectSubscription: Subscription;
	private dashboardsLoadedSubscription: Subscription;
	private editModeSubscription: Subscription;
	private propertyMenuChangedSubscription: Subscription;
	private objectSelectChangedSubsciption: Subscription;
	private containers: ComponentRef<IEditable>[] = [];
	constructor(
		@Inject(APP_RESOURCE) private resource: IResource,
		private route: ActivatedRoute,
		private location: Location,
		private dialogService: DialogService,
		private uiService: UIService,
		private sessionService: SessionService,
		private componentFactoryResolver: ComponentFactoryResolver,
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService,
		private serializerService: SerializerService,
		private router: Router,
		private viewFactory: ViewFactoryService,
		private loggingService: LoggingService) {

		this.uiService.setDropSubscription().subscribe(() => {
			this.onDrop();
		});
	}

	ngOnInit() {
		this.deleteContainerSubscription = this.dashboardManagerService.deleteObjectEvent
			.subscribe(model => this.deleteSelectedContainer(model));
		this.dashboardChangedSubscription = this.dashboardManagerService.dashboardChangedEvent.subscribe(dashboard => {
			this.loggingService.log(dashboard);
			this.loadDashboard(dashboard);
		});
		this.editModeSubscription = this.dashboardManagerService.editModeChangedEvent
			.subscribe(isInEditMode => {
				this.isDragEnabled = isInEditMode;
				this.uiService.setEditMode(isInEditMode);
			});
		this.objectSelectChangedSubsciption = this.dashboardManagerService.objectSelectedEvent
			.subscribe(isSelected => {
				this.isObjectSelected = isSelected;
			});

		this.addObjectSubscription = this.dashboardManagerService.addObjectEvent.subscribe(
			objectTypeName => this.loadContainers(this.serializerService.deserialize({ Type: 'Container', ContainsType: objectTypeName }), true));
		this.dashboardsLoadedSubscription = this.dashboardDataService.dashboardsLoadedEvent
			.subscribe(dashboards => {
				this.loggingService.log(dashboards);
				if (dashboards.length) {
					this.route.params.subscribe(params => {
						this.loggingService.log(params['dashboardId']);
						this.dashboardManagerService.loadDashboard(+params['dashboardId']);
					});
				}
			},
			error => {
				// Do nothing
				if (this.dashboardManagerService.isLoggedIn(error)) {
					this.dialogService.alert(this.resource.ApplicationErrorDialog,
						this.dashboardDataService.parseErrorMessage(error));
				}
			}
			);
		this.route.params.subscribe(params => {
			this.loggingService.log(params['dashboardId']);
			this.dashboardManagerService.loadDashboard(+params['dashboardId']);
		});

	}

	ngAfterViewInit() {
		this.viewInitialized = true;
		if (this.currentDashBoard) {
			_.forEach(this.currentDashBoard.Objects, (m: DashboardContainerModel) => this.loadContainers(m));
		}
		this.propertyMenuChangedSubscription = this.dashboardManagerService.propertyMenuChangedEvent
			.subscribe(isCollapsed =>
				this.isCollapsed = isCollapsed);
	}

	ngOnDestroy() {
		if (this.dashboardChangedSubscription) {
			this.dashboardChangedSubscription.unsubscribe();
		}
		if (this.deleteContainerSubscription) {
			this.deleteContainerSubscription.unsubscribe();
		}
		if (this.addObjectSubscription) {
			this.addObjectSubscription.unsubscribe();
		}
		if (this.dashboardsLoadedSubscription) {
			this.dashboardsLoadedSubscription.unsubscribe();
		}
		if (this.editModeSubscription) {
			this.editModeSubscription.unsubscribe();
		}
		if (this.objectSelectChangedSubsciption) {
			this.objectSelectChangedSubsciption.unsubscribe();
		}
		if (this.propertyMenuChangedSubscription) {
			this.propertyMenuChangedSubscription.unsubscribe();
		}
		_.each(this.containers, container => {
			container.destroy();
		});
		this.containers = [];
	}

	canDeactivate(): any {
		if (!this.dashboardManagerService.isDashboardInEditMode || this.dashboardManagerService.isCancelPressed) {
			this.dashboardDataService.isDashboardDelete = false;
			return true;
		}
		if (!this.dashboardManagerService.isDBChangedFromGM) {
			this.dashboardManagerService.revertDashboard();
			this.dashboardDataService.isDashboardDelete = false;
			return true;
		}
		// if (next) {
		// 	if (next.params['dashboardId']) {
		// 		if (next.params['dashboardId'].toString() !== this.dashboardManagerService.clickedDBId.toString()) {
		// 			this.dashboardManagerService.revertDashboard();
		// 			return true;
		// 		}
		// 	}
		// }

		var isDBDeleted = this.dashboardDataService.isDashboardDelete;
		if (!(this.currentDashBoard && this.currentDashBoard.IsDirty) || !this.sessionService.isValidSession() || isDBDeleted) {
			this.dashboardDataService.isDashboardDelete = false;
			return true;
		}

		return new Observable((subscriber: Subscriber<boolean>) => {
			this.dialogService.yesNoCancel(this.resource.UnSavedChangesDialog)
				.then(dialog => {
					this.loggingService.log(dialog.result);
					this.dashboardManagerService.isDBChangedFromGM = false;
					dialog.result
						.then((result: any) => {
							if (result === true) {
								// If dashboard is invalid, do nothing
								if (!this.currentDashBoard.IsValid) {
									if (this.currentDashBoard.newName.length === 0) {
										this.dashboardManagerService.isCancelPressed = true;
									}
									subscriber.next(false);
									subscriber.complete();
									this.router.navigate([this.router.url]);
									return false;

								}
								this.dialogService.wait('Saving dashboard...')
									.then(d => {
										// to set non edit mode when going to another job in dirty dashbaord scenario
										this.dashboardManagerService.setDashboardMode(false);
										if (this.currentDashBoard.newName) {
											this.currentDashBoard.Name = this.currentDashBoard.newName;
										}
										this.dashboardDataService.saveDashboard(this.currentDashBoard)
											.subscribe(
											response => {
												d.close();
												subscriber.next(true);
												subscriber.complete();
											},
											error => {
												d.close();
												if (this.dashboardManagerService.isLoggedIn(error)) {
													this.dialogService.alert(this.resource.ApplicationErrorDialog, this.dashboardDataService.parseErrorMessage(error))
														.then(d => {
															subscriber.next(false);
															subscriber.complete();
														});
												} else {
													// to allow to navigate to home screen when token is invalid
													subscriber.complete();
												}
											});
									});
								return true;
							} else if (result === false) {
								// to set non edit mode when going to another job in dirty dashboard scenario
								this.dashboardManagerService.setDashboardMode(false);
								dialog.close();
								this.dashboardManagerService.revertDashboard();
								subscriber.next(true);
								subscriber.complete();
								return true;
							} else {//Cancel button handle
								this.loggingService.log(result);
								if (this.location.path().toUpperCase().indexOf(this.dashboardDataService.currentJob.JobName.toUpperCase()) === -1) {
									subscriber.next(true);
									subscriber.complete();
								} else {
									subscriber.next(false);
									subscriber.complete();
									this.dashboardManagerService.isCancelPressed = true;
									this.dashboardManagerService.refreshGlobalMenu(this.currentDashBoard);
								}
								// dialog.dismiss();
								this.router.navigate([this.router.url]);
								return false;

							}

						})
						.catch((error: any) => {
							subscriber.next(false);
							subscriber.complete();
						}); // do nothing on cancel
				});
		});
	}

	routerCanDeactivate(next: ComponentInstruction, prev: ComponentInstruction): any {
		if (!this.dashboardManagerService.isDashboardInEditMode || this.dashboardManagerService.isCancelPressed) {
			return true;
		}
		if (!this.dashboardManagerService.isDBChangedFromGM) {
			this.dashboardManagerService.revertDashboard();
			return true;
		}
		if (next) {
			if (next.params['dashboardId']) {
				if (next.params['dashboardId'].toString() !== this.dashboardManagerService.clickedDBId.toString()) {
					this.dashboardManagerService.revertDashboard();
					return true;
				}
			}
		}

		var isDBDeleted = this.dashboardDataService.isDashboardDelete;
		if (!(this.currentDashBoard && this.currentDashBoard.IsDirty) || !this.sessionService.isValidSession() || isDBDeleted) {
			this.dashboardDataService.isDashboardDelete = false;
			return true;
		}

		return new Observable((subscriber: Subscriber<boolean>) => {
			this.dialogService.yesNoCancel(this.resource.UnSavedChangesDialog)
				.then(dialog => {
					this.loggingService.log(dialog.result);
					this.dashboardManagerService.isDBChangedFromGM = false;
					dialog.result
						.then((result: any) => {
							if (result === true) {
								// If dashboard is invalid, do nothing
								if (!this.currentDashBoard.IsValid) {
									subscriber.next(false);
									subscriber.complete();
									return;
								}
								this.dialogService.wait('Saving dashboard...')
									.then(d => {
										if (this.currentDashBoard.newName) {
											this.currentDashBoard.Name = this.currentDashBoard.newName;
										}
										this.dashboardDataService.saveDashboard(this.currentDashBoard)
											.subscribe(
											response => {
												d.close();
												subscriber.next(true);
												subscriber.complete();
											},
											error => {
												d.close();
												this.dialogService.alert(this.resource.ApplicationErrorDialog, this.dashboardDataService.parseErrorMessage(error))
													.then(d => {
														subscriber.next(false);
														subscriber.complete();
													});
											});
									});

							} else if (result === false) {
								dialog.close();
								this.dashboardManagerService.revertDashboard();
								subscriber.next(true);
								subscriber.complete();
							} else {//Cancel button handle
								this.loggingService.log(result);
								if (this.location.path().toUpperCase().indexOf(this.dashboardDataService.currentJob.JobName.toUpperCase()) === -1) {
									subscriber.next(true);
									subscriber.complete();
								} else {
									subscriber.next(false);
									subscriber.complete();
									this.dashboardManagerService.isCancelPressed = true;
								}
								dialog.dismiss();
							}

						})
						.catch((error: any) => {
							subscriber.next(false);
							subscriber.complete();
						}); // do nothing on cancel
				});
		});
	}

	OnModelChange() {
		// Model has changed from editor
	}

	onDropContainer() {
		this.currentDashBoard.IsDirty = true;
	}

	public onSelected(event: MouseEvent) {
		this.dashboardManagerService.raiseSelectedObjectChanged(this);
		event.stopPropagation();
	}
	private loadContainers(model: DashboardContainerModel, isNew = false) {
		this.loggingService.log('loading container %o', model);
		if (isNew) {
			model.Objects.push(this.serializerService.createModel(model.ContainsType));
			this.currentDashBoard.Objects.push(model);
			this.currentDashBoard.IsDirty = true;
		}
	}
	private onDrop() {
		this.currentDashBoard.IsDirty = true;
	}
	private loadDashboard(dashboard: DashboardModel) {
		this.Model = dashboard as DashboardModel;
		this.currentDashBoard = dashboard;
		this.dashboardManagerService.raiseSelectedObjectChanged(this);
		if (this.viewInitialized) {
			_.forEach(this.currentDashBoard.Objects, (m: DashboardContainerModel) => this.loadContainers(m));
		}
	}

	private deleteSelectedContainer(model: Model) {
		if (model.Type === 'Container') {
			_.pull(this.currentDashBoard.Objects, model);
			this.currentDashBoard.IsDirty = true;
			this.dashboardManagerService.raiseSelectedObjectChanged(this);
		}
	}
}
