import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
// import { HttpModule } from '@angular/http';
import { WaiWebService, SessionService, SignoutApi, DialogService, ConfigService, KeepAliveService, LoggingService}
	from '../../shared/services/services';
import { Subscription } from 'rxjs/Subscription';
import { APP_RESOURCE, IResource } from '../../app.resource';

@Component({
	selector: 'iw-navbar',
	moduleId: module.id,
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css'],
	// directives: [ROUTER_DIRECTIVES],
	// providers: [HttpModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
	public applicationTitle: string;
	public isLoggedIn: boolean = false;

	private sessionSubscription: Subscription;
	private emailID: string;
	private helpGuideLink: string;
	constructor(
		@Inject(APP_RESOURCE) private resource: IResource,
		private router: Router,
		private waiWebService: WaiWebService,
		private sessionService: SessionService,
		private dialogService: DialogService,
		private configService: ConfigService,
		private keepAliveService: KeepAliveService,
		private loggingService: LoggingService) {
		this.applicationTitle = resource.ApplicationTitle;
	}

	public ngOnInit() {
		this.isLoggedIn = !!this.sessionService.session;
		this.sessionSubscription = this.sessionService.sessionChangedEvent
			.subscribe(session => this.isLoggedIn = !!session);
		if (this.configService.configuration) {
			this.emailID = this.configService.configuration.EmailID;
			this.helpGuideLink = this.configService.configuration.HelpGuideLink;
		} else {
			this.configService.load().add(() => {
				this.emailID = this.configService.configuration.EmailID;
				this.helpGuideLink = this.configService.configuration.HelpGuideLink;
			});
		}
	}
	public ngOnDestroy() {
		if (this.sessionSubscription) {
			this.sessionSubscription.unsubscribe();
		}
	}

	public setLogoutButton(loginStatus: boolean): void {
		this.isLoggedIn = loginStatus;
	}

	public confirmSignout(): void {
		this.dialogService.confirm(this.resource.SignOutDialog)
			.then(dialog => {
				dialog.result.then((confirmed:any) => {
					this.dialogService.wait('Signing Out...')
						.then(d => {
							this.waiWebService.signout()
								.subscribe(
								response => {
									d.close();
									this.onSignout(response);
								},
								error => {
									d.close();
									this.onSignout(error);
								});
						});
				})
					.catch( (error:any) => this.loggingService.error(error));
			});
	}

	private onSignout(response: SignoutApi.IResponse) {
		this.keepAliveService.StopKeepAlive();
		this.sessionService.end();
		this.router.navigate(['/']);
	}
}
