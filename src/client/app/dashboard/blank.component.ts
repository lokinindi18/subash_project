import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardDataService } from './core/core';

import { Subscription } from 'rxjs/subscription';
import { Router } from '@angular/router';

@Component({
	moduleId: module.id,
	selector: 'iw-blank',
	template: ''
})
export class BlankComponent implements OnInit, OnDestroy {

	private dashboardsLoadedSubscription: Subscription;
	constructor(private dashboardDataService: DashboardDataService, private router: Router) { }

	ngOnInit() {
		this.dashboardDataService.restartDashboardObserver();
		this.dashboardsLoadedSubscription = this.dashboardDataService.dashboardsLoadedEvent
			.subscribe(dashboards => {
				if (dashboards.length) {
					this.router.navigate(['/jobs/' + this.dashboardDataService.currentJob.JobName +'/dashboards', dashboards[0].Id ]);
				}
			},
			error => {
				// Do nothing
			}
			);
	}

	ngOnDestroy() {
		if (this.dashboardsLoadedSubscription) {
			this.dashboardsLoadedSubscription.unsubscribe();
		}
	}
}
