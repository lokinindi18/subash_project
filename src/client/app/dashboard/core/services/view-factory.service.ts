import { Type, Injectable } from '@angular/core';
import { getDashboardObjectMetaData } from './../dashboard-object.decorator';
import { LoggingService } from './../../../shared/services/services';

import * as _ from 'lodash';

@Injectable()
export class ViewFactoryService {
	private register: { [key: string]: Type<any> } = {};

	constructor(private loggingService: LoggingService) {
	}
	public registerView(component: Type<any>) {
		const metadata = getDashboardObjectMetaData(component);
		if (!metadata) {
			throw new Error('Please decorate component with @DashboardObject');
		}
		this.loggingService.log('registering: ' + metadata.name);
		this.register[metadata.name] = component;
	}

	public getViewType(name: string) {
		name= name.trim();// Trim is used as in IE sometimes leading blank space is coming
		const object = _.find(this.register, (o, n) => name === n);
		if (!object) {
			throw new Error(`Object type "${name}" not registered`);
		}

		return object;
	}

	public getRegisteredViewNames() {
		return _.map(this.register, (object, name) => name);
	}
}
