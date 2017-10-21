import { OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { Router } from '@angular/router';
import { DialogService, SessionService, KeepAliveService } from './../shared/services/services';
import { IResource } from './../app.resource';

export abstract class BaseComponent implements OnInit {
	constructor(
		protected resource: IResource,
		protected dialogService: DialogService,
		protected sessionService: SessionService,
		protected keepAliveService: KeepAliveService,
		protected router: Router) {
	}

	public ngOnInit() {
		if (!this.sessionService.isValidSession()) {
			this.dialogService.alert(this.resource.SessionExpiredDialog);
			this.keepAliveService.StopKeepAlive();
			this.router.navigate(['/']);
			throw new Error('User session invalid');
		} else {
			if (!this.keepAliveService.keepAliveSubscription) {
				this.keepAliveService.StartKeepAlive();
			}
		}
	}

	protected isLoggedIn(error: Response): boolean {
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
						this.dialogService.dismissDialog();
						this.router.navigate(['/'])
							.then(() => {
								this.sessionService.end();
							});
					});
			});
		return false;
	}
}
