import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { DashboardManagerService, DashboardDataService, DashboardModel } from './../../core/core';
import { SessionService, AuthenticateApi, DialogService } from '../../../shared/services/services';
import { APP_RESOURCE, IResource } from '../../../app.resource';
import { NewDashboardCommand, EditDashboardCommand, CopyDashboardCommand, DeleteDashboardCommand } from './../../commands/commands';
// import { ShowSpacesPipe } from '../../../shared/pipes/show-spaces.pipe';

import * as _ from 'lodash';


@Component({
	selector: 'iw-global-menu',
	moduleId: module.id,
	templateUrl: './global-menu.component.html',
	styleUrls: ['./global-menu.component.css'],
	// directives: [AccordionComponent, AccordionGroupComponent, ROUTER_DIRECTIVES],
	// pipes: [ShowSpacesPipe] //TODO - Kunjan - no more pipes as properties
})
export class GlobalMenuComponent implements OnInit, OnDestroy {
	@Input() currentJob: AuthenticateApi.IJob;

	@Output() onGlobalMenuToggled = new EventEmitter<boolean>();
	public currentDashboard: DashboardModel;
	private _dashboardCollection: DashboardModel[];

	@Input() set dashboardCollection(dc: DashboardModel[]) {
		this._dashboardCollection = dc;
		if (this.selectedJob) {
			this.selectedJob.DashboardControl.Dashboards = this.dashboardCollection;
		}
	}
	get dashboardCollection(): DashboardModel[] {
		return this._dashboardCollection;
	}

	private deletedDB: DashboardModel;
	private selectedJob: Job;
	private isCollapsed = true;
	private jobGroupCollection: JobGroup[];
	private isExporterClicked: boolean = false;
	private isWellInfoClicked: boolean = false;

	private dashboardChangedSubscription: Subscription;
	private globalMenuChangedSubscription: Subscription;
	private globalMenuRefreshSubscription: Subscription;
	private dashboardDeletedSubscription: Subscription;
	private wellInfoRefreshSubscription: Subscription;

	public set selectedJobName(jobName: string) {
		this.expandSelectedJob(jobName);
	}

	constructor(
		@Inject(APP_RESOURCE) private resource: IResource,
		private newCommand: NewDashboardCommand,
		private editCommand: EditDashboardCommand,
		private copyCommand: CopyDashboardCommand,
		private deleteCommand: DeleteDashboardCommand,
		private router: Router,
		private dashboardManagerService: DashboardManagerService,
		private dashboardDataService: DashboardDataService,
		private sessionService: SessionService,
		private dialogService: DialogService) {
	}

	ngOnInit() {
		this.loadJobsFromSession();
		this.dashboardChangedSubscription = this.dashboardManagerService.dashboardChangedEvent
			.subscribe(dashboard => {
				if (this.deletedDB) {
					for (var i = 0; i < this._dashboardCollection.length; i++) {
						let tempDB: DashboardModel = this._dashboardCollection[i];
						if (tempDB.Name === this.deletedDB.Name) {
							this._dashboardCollection.splice(i, 1);
						}
					}
					this.deletedDB = null;
					this.dashboardCollection = this._dashboardCollection;
				}
				this.onDashboardChanged(dashboard);
			});

		this.globalMenuChangedSubscription = this.dashboardManagerService.globalMenuChangedEvent
			.subscribe(isCollapse => {
				this.isCollapsed = isCollapse;
			});
		this.globalMenuRefreshSubscription = this.dashboardManagerService.refreshGlobalMenuEvent
			.subscribe(dashboard => {
				//refresh global menu on cancel selection when dashboard dirty
				if (this.currentDashboard === dashboard && this.dashboardManagerService.isCancelPressed) {
					this.collapseAll();
					// this.dashboardManagerService.isCancelPressed = false;
					this.expandSelectedJob(this.currentJob.JobName);
				} else if (this.currentDashboard === null && this.dashboardManagerService.isCancelPressed &&
					(this.isExporterClicked || this.isWellInfoClicked)) {
					this.isExporterClicked = false;
					this.isWellInfoClicked = false;
					this.currentDashboard = dashboard;
				}
			});
		this.dashboardDeletedSubscription = this.dashboardDataService.dashboardDeletedEvent
			.subscribe(
			db => {
				this.deletedDB = db;
			});
		this.wellInfoRefreshSubscription = this.dashboardManagerService.wellInfoRefreshEvent
			.subscribe(isWellRefresh => {
				if (!this.isWellInfoClicked && !this.isExporterClicked) {
					this.expandSelectedJob(this.dashboardDataService.currentJob.JobName);
					this.currentDashboard = null;
					this.dashboardManagerService.isDBChangedFromGM = false;
					this.dashboardManagerService.setWellInfo(true);
					this.dashboardManagerService.setDashboardMode(false);
					if (isWellRefresh) {
						this.isWellInfoClicked = true;
					} else {
						this.isExporterClicked = true;
					}
				}
			});
	}

	ngOnDestroy() {
		if (this.wellInfoRefreshSubscription) {
			this.wellInfoRefreshSubscription.unsubscribe();
		}
		if (this.dashboardChangedSubscription) {
			this.dashboardChangedSubscription.unsubscribe();
		}
		if (this.dialogService) {
			this.dialogService.dismissDialog();
		}
		if (this.dashboardDeletedSubscription) {
			this.dashboardDeletedSubscription.unsubscribe();
		}
	}

	onJobOverViewClick() {
		this.dashboardManagerService.isDBChangedFromGM = true;
		this.router.navigate(['jobs']).then(() => {
			this.dashboardManagerService.isCancelPressed = false;
		});
	}

	onWellInfoClicked(pslIndex: number, jobIndex: number, job: AuthenticateApi.IJob) {
		//Well info have menu.
		this.dashboardManagerService.isDBChangedFromGM = true;
		this.router.navigate(['jobs/' + this.currentJob.JobName + '/dashboards', 'wellinformation']).then(() => {
			this.dashboardManagerService.isCancelPressed = false;
		});
		this.currentDashboard = null;
		this.isExporterClicked = false;
		this.isWellInfoClicked = true;
	}
	exporterClicked(pslIndex: number, jobIndex: number, job: AuthenticateApi.IJob) {
		this.dashboardManagerService.isDBChangedFromGM = true;
		this.router.navigate(['jobs/' + this.currentJob.JobName + '/dashboards', 'exporter']).then(() => {
			this.dashboardManagerService.isCancelPressed = false;
		});
		this.currentDashboard = null;
		this.isExporterClicked = true;
		this.isWellInfoClicked = false;
	}
	public onPslClick(pslIndex: number) {
		//get the current value of the psl group open status
		var isOpen: boolean = this.jobGroupCollection[pslIndex].IsOpen;
		//close all jobgroups and toggle the job group with the passed index
		this.jobGroupCollection.forEach((jobGroup: JobGroup) => {
			jobGroup.IsOpen = false;
			jobGroup.Jobs.forEach((job: Job) => {
				job.IsOpen = false;
			});
		});
		this.jobGroupCollection[pslIndex].IsOpen = !isOpen;
	}

	public onJobClick(pslIndex: number, jobIndex: number) {
		this.dashboardManagerService.isDBChangedFromGM = true;
		this.dashboardManagerService.isCancelPressed = false;
		if ((this.dashboardManagerService.currentDashboard &&
			!this.dashboardManagerService.currentDashboard.IsDirty) ||
			(this.jobGroupCollection[pslIndex].Jobs[jobIndex].Name === this.currentJob.JobName)) {
			//get the current value of the psl group open status
			var isOpen: boolean = this.jobGroupCollection[pslIndex].Jobs[jobIndex].IsOpen;
			//close all jobgroups and toggle the job group with the passed index
			this.jobGroupCollection[pslIndex].Jobs.forEach((job: Job) => {
				job.IsOpen = false;
			});
			this.jobGroupCollection[pslIndex].Jobs[jobIndex].IsOpen = !isOpen;
			if (this.jobGroupCollection[pslIndex].Jobs[jobIndex].IsOpen) {
				this.onJobExpanded(this.jobGroupCollection[pslIndex].Jobs[jobIndex].Name);
				if (this.selectedJob) {
					if (this.selectedJob.Name === this.jobGroupCollection[pslIndex].Jobs[jobIndex].Name) {
						_.forEach(this.selectedJob.DashboardControl.Dashboards, (m: DashboardModel) => {
							if (m === this.dashboardManagerService.currentDashboard) {
								this.onDashboardClick(m, true);
							}
						});
					}
				}
			}
		} else {
			//close all jobgroups
			this.jobGroupCollection[pslIndex].Jobs.forEach((job: Job) => {
				job.IsOpen = false;
			});
			this.onJobExpanded(this.jobGroupCollection[pslIndex].Jobs[jobIndex].Name);

		}
		//pending: call yes/no/cancel alert if dashboard dirty
	}

	public onDashboardControlClick(pslIndex: number, jobIndex: number) {
		//get the current value of the psl group open status
		var isOpen: boolean = this.jobGroupCollection[pslIndex].Jobs[jobIndex].DashboardControl.IsOpen;
		//close all jobs and toggle the job with the passed index
		this.jobGroupCollection[pslIndex].Jobs.forEach((job: Job) => {
			job.DashboardControl.IsOpen = false;
		});
		this.jobGroupCollection[pslIndex].Jobs[jobIndex].DashboardControl.IsOpen = !isOpen;
	}

	public sortedDashboards() {
		return this.dashboardCollection.sort(DashboardModel.compare);
	}

	public toggleMenu() {
		this.isCollapsed = !this.isCollapsed;
		this.onGlobalMenuToggled.emit(this.isCollapsed);
		this.dashboardManagerService.setGlobalMenuPosition(this.isCollapsed);
	}

	public onJobExpanded(jobName: string) {
		this.router.navigate(['jobs/' + jobName, 'dashboards']);
	}

	public onDashboardClick(dashboard: DashboardModel, fromJobClick: boolean = false) {
		if (this.currentDashboard !== dashboard || fromJobClick) {
			this.dashboardManagerService.setWellInfo(false);
			this.dashboardManagerService.clickedDBId = dashboard.Id;
			this.dashboardManagerService.isDBChangedFromGM = true;
			this.dashboardManagerService.isCancelPressed = false;
			this.router.navigate(['jobs/' + this.currentJob.JobName + '/dashboards', dashboard.Id])
				.then(() => {
					// To open the newly clicked dashboard in default mode
					if (this.dashboardManagerService.isCancelPressed) {
						this.dashboardManagerService.isCancelPressed = false;
						return;
					}
					if (!this.dashboardManagerService.currentDashboard.IsValid) {
						this.dashboardManagerService.setDashboardMode(true);
					} else {
						this.dashboardManagerService.setDashboardMode(false);
					}
				});
		}
	}

	public onMouseEnter(event) {
		const DASHBOARD_NAME_MAX_WIDTH = 150;
		const CURRENT_DASHBOARD_NAME_MAX_WIDTH = 195;
		const element = event.target;
		const isCurrentDashboard = element.className.indexOf('iw-dashboardname-bold') !== -1;
		if ((isCurrentDashboard && element.scrollWidth > CURRENT_DASHBOARD_NAME_MAX_WIDTH)
			|| (!isCurrentDashboard && element.scrollWidth >= DASHBOARD_NAME_MAX_WIDTH)) {
			element.children[0].className += ' tooltip-show';
		}
	}

	public onMouseLeave(event) {
		const tooltip = event.target.children[0];
		if (tooltip.className.indexOf('tooltip-show') !== -1) {
			tooltip.className = tooltip.className.split(' ').slice(0, -1).join(' ');
		}
	}

	private onDashboardChanged(dashboard: DashboardModel) {
		this.expandSelectedJob(this.currentJob.JobName);
		this.currentDashboard = dashboard;
		this.dashboardDataService.updateCurveList();
	}

	private loadJobsFromSession() {
		const jobs = this.sessionService.session.IWJob;
		this.jobGroupCollection = _.chain(jobs)
			.groupBy(j => j.PSLName)
			.map((jobs: AuthenticateApi.IJob[], key: string) => new JobGroup(
				key, _.map(jobs, j => new Job(j.JobName))
			))
			.value();
		this.jobGroupCollection.forEach((jobGroup: JobGroup) => {
			jobGroup.Jobs.forEach((job: Job) => { job.DashboardControl = new DashboardAccordion(); });
		});
	}

	private expandSelectedJob(jobName: string) {
		try {
			var jobs = _.chain(this.jobGroupCollection)
				.map((jgc: JobGroup) => jgc.Jobs)
				.flatten<Job>()
				.value();

			this.selectedJob = _.find(jobs, (j: Job) => j.Name === jobName);

			if (!this.selectedJob) {
				throw `Job "${jobName}" not found.`;
			}

			// open job accordion
			this.selectedJob.IsOpen = true;
			this.selectedJob.DashboardControl.Dashboards = this.dashboardCollection;

			const jobGroup = _.find(this.jobGroupCollection, (jgc: JobGroup) => _.find(jgc.Jobs, (j: Job) => j === this.selectedJob));
			jobGroup.IsOpen = true;
		} catch (e) {
			console.log(e);
		}
	}

	private collapseAll() {
		_.forEach(this.jobGroupCollection, (jobGroup: JobGroup) => {
			jobGroup.IsOpen = false;

			jobGroup.Jobs.forEach((job: Job) => {
				job.IsOpen = false;
			});
		});
	}
}

class JobGroup {
	public IsOpen = false;
	constructor(
		public Name: string,
		public Jobs: Job[]
	) { }
}

class Job {
	public IsOpen = false;
	public DashboardControl: DashboardAccordion;
	constructor(public Name: string) {
	}
}

class DashboardAccordion {
	public IsOpen = true;
	public Dashboards: DashboardModel[];
}
