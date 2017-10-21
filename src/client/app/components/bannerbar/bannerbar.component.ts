import { Component, Inject } from '@angular/core';
import { APP_RESOURCE, IResource } from '../../app.resource';

@Component({
  selector: 'iw-bannerbar',
  moduleId: module.id,
  templateUrl: './bannerbar.component.html',
  styleUrls: ['./bannerbar.component.css']
})
export class BannerbarComponent {
	public applicationTitle: string;

	constructor( @Inject(APP_RESOURCE) resource: IResource) {
		this.applicationTitle = resource.ApplicationTitle;
	}
}
