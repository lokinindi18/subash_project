import { Injectable } from '@angular/core';
import { ApiWebService, RtDataHubService, ConfigService, TimeZoneService, LoggingService }
	from '../../../shared/services/services';
import { LogsApi } from '../../../shared/services/web/web';
import { DashboardDataService } from '../core';
import { Observable } from 'rxjs/Observable';
import { IObjectData } from '../data/object-data';
import { ObjectDataService } from './object-data-service';

import * as _ from 'lodash';

@Injectable()
export class ObjectDataServiceMock extends ObjectDataService {
	constructor(
		protected rtService: RtDataHubService,
		protected configService: ConfigService,
		protected apiService: ApiWebService,
		protected timezoneService: TimeZoneService,
		protected dashboardDataService: DashboardDataService,
		protected loggingService: LoggingService) {
		super(rtService, configService, apiService, timezoneService, dashboardDataService, loggingService);
	}

	protected getRealTimeData(ivType: LogsApi.LogIndexType, ...curves: string[]) {
		return super.getRealTimeData(ivType, ...curves);
	}

	//get log data between start and end time only
	// protected getComplexLogData(ivType: LogsApi.LogIndexType, start: number, end: number, ...curves: LogsApi.CurveCoercionInfo[]) {
	// 	return Observable.timer(_.random(1000, 5000))
	// 		.map<IObjectData>(() => {
	// 			const objectData: IObjectData = {};
	// 			//const now = Date.now() / 1000;
	// 			const duration = end - start;
	// 			const ivs = _.times(duration, n => end - duration + n);

	// 			curves.forEach(c => {
	// 				objectData[c.CurveName] = {
	// 					ivList: ivs,
	// 					valueList: _.times(duration, n => n % 60)//_.random(0, 300))
	// 				};
	// 			});
	// 			return objectData;
	// 		});
	// }
	// TO be Removed.
	protected getComplexLogData(ivType: LogsApi.LogIndexType, start: number, end: number, ...curves: string[]) {
		return Observable.timer(_.random(1000, 5000))
			.map<IObjectData>(() => {
				const objectData: IObjectData = {};
				//const now = Date.now() / 1000;
				const duration = end - start;
				const ivs = _.times(duration, n => end - duration + n);
				curves.forEach(c => {
					objectData[c] = {
						ivList: ivs,
						valueList: _.times(duration, n => n % 60)//_.random(0, 300))
					};
				});
				return objectData;
			});
	}

	protected getComplexLogMinMax(ivType: LogsApi.LogIndexType, curves: string[]) {
		return Observable.timer(_.random(1000, 5000))
			.map<LogsApi.IComplexMinMaxResponse>(() => {
				let data: LogsApi.IComplexMinMaxResponse = { minIndex: 4000, maxIndex: 5000, activePass: undefined, logType: undefined };
				return (data);
			});
	}
}
