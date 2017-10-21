import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { LithPaletteAPI, LoggingService } from './../../../shared/services/services';
import { ImageContainer } from 'gtk/attributes';

import * as _ from 'lodash';

@Injectable()
export class GTKManagerService {
	public lithPatternReceivedEvent: Observable<boolean>;
	public lithPatternOrder: LithPaletteAPI.ILithPalette[] = [];
	private lithPatternReceivedSource = new Subject<boolean>();
	constructor(private loggingService: LoggingService) {
		this.loggingService.log('GTK Manager service initialized');
		this.lithPatternReceivedEvent = this.lithPatternReceivedSource.asObservable();
	}

	public setLithPatterns(lithPatternResponse:LithPaletteAPI.ILithPaletteResponse) {
		this.loggingService.log('lithPatterns');
		//an application wide pattern dictionary name for lithology
		const containerName = 'lithPatterns';

		if (lithPatternResponse && lithPatternResponse.response &&
			lithPatternResponse.response.lithElements && lithPatternResponse.response.lithElements.length > 0) {
			this.lithPatternOrder = [];
			let image, paletteInfo:LithPaletteAPI.ILithPalette;
			const sources = _.sortBy(lithPatternResponse.response.lithElements,'orderIndex');
			//register all images here
			let imageContainer = new ImageContainer(containerName);

			for (let i = 0; i < sources.length; i++) {
				paletteInfo = sources[i];
				image = new Image();
				image.src = 'data:image/png;base64,' + paletteInfo.lithPatternImage;
				image.name = paletteInfo.lithName;
				this.lithPatternOrder.push(paletteInfo);
				imageContainer.register(image.name, image);
			}
		}
		this.lithPatternReceivedSource.next();
	}
}
