import { Injectable } from '@angular/core';
import { ApiWebService, RtDataHubService, IRealTimeData, ConfigService, TimeZoneService, UtilsService, LoggingService }
	from '../../../shared/services/services';
import { LogsApi, IGenericMeasure, QueryLogsApi } from '../../../shared/services/web/web';
import { DashboardDataService } from '../core';
import { Observable } from 'rxjs/Rx';
import { Subscriber } from 'rxjs/Subscriber';
import { IObjectData } from '../data/object-data';
import * as _ from 'lodash';

@Injectable()
export class ObjectDataService {
	public get availableCurves() {
		return this.dashboardDataService.variableList;
	}

	public get uomProfile() {
		return this.currentJob.UnitSet.split('|')[1];
	}

	public get currentJob() {
		return this.dashboardDataService.currentJob;
	}

	constructor(
		protected rtService: RtDataHubService,
		protected configService: ConfigService,
		protected apiService: ApiWebService,
		protected timezoneService: TimeZoneService,
		protected dashboardDataService: DashboardDataService,
		protected loggingService: LoggingService) {
	}

	protected getRealTimeData(ivType: LogsApi.LogIndexType, ...curves: string[]) {
		if (!curves.length) {
			return Observable.empty<IObjectData>();
		}

		return Observable.from(curves)
			.map(c => {
				const v = this.dashboardDataService.getRealTimeLogInfo(c, ivType);
				if (!v) {
					return Observable.empty<IRealTimeData>();
				}

				return this.rtService.join({
					logid: v.LogUid,
					mnemonic_alias: v.MnemonicAlias,
					uomprofile: this.uomProfile
				});
			})
			.mergeAll()
			.bufferTime(this.configService.configuration.RealTimeUpdateInterval) // Buffer the data until update
			.map(rtData => {
				const objectData: IObjectData = {};
				_.chain(rtData)
					.groupBy(data => data.mnemonic_alias)
					.forEach((data: IRealTimeData[], key: string) => {
						const v = _.find(this.availableCurves, ac => ac.MnemonicAlias === key);
						if (!v) {
							return;
						}

						//const timeZoneValueInMilliSecond = this.timezoneService.getTimeZoneValueInMilliSeconds();
						objectData[v.MnemonicAlias] = {
							ivList: _.map(data, v => {
								if (ivType === LogsApi.LogIndexType.DateTime) {
									return (v.time_index + (((new Date()).getTimezoneOffset()) * 60000) +
										(this.timezoneService.getTimeZoneValueInMilliSeconds())) / 1000;
								} else if (ivType === LogsApi.LogIndexType.TrueVerticalDepthSubSea) {
									return v.tvdss;
								} else if (ivType === LogsApi.LogIndexType.VerticalDepth) {
									return v.tvd;
								} else if (ivType === LogsApi.LogIndexType.ElapsedTime) {
									return v.elapsed_time / 1000;
								} else {
									return v.depth_index;
								}
							}),
							valueList: _.map(data, v => +v.mnemonic_value)
						};
					}).value();

				return objectData;
			});
	}

	//get log data between start and end time only
	protected getComplexLogDataWithCoercion(ivType: LogsApi.LogIndexType, start: number, end: number, ...curves:
		LogsApi.ICurveCoercionInfo[]) {
		if (!curves.length) {
			return Observable.empty<IObjectData>();
		}

		return new Observable<IObjectData>((subscriber: Subscriber<IObjectData>) => {
			const endIndex = ivType === LogsApi.LogIndexType.DateTime ? end - (((new Date()).getTimezoneOffset()) * 60000)
				: end;
			const startIndex = ivType === LogsApi.LogIndexType.DateTime ? start - (((new Date()).getTimezoneOffset()) * 60000)
				: start;

			const complexLogDataParams = this.getComplexLogDataParams(ivType, curves, 'l', startIndex, endIndex);
			const query = this.apiService.findComplexLogsData(complexLogDataParams);
			let logs: LogsApi.ILog[] = [];

			query.subscribe(
				data => {
					logs = data ? data.logs : [];
					this.loggingService.log('complex log data has arrived');
				},
				e => subscriber.error(e),
				() => {
					//let curveList = _.map(curves, v => v.CurveName);
					subscriber.next(this.extractDataFromComplexResponse(ivType, curves, logs));
					subscriber.complete();
				}
			);
		});
	}

	//get log data between start and end time only<TO BE Removed>
	protected getComplexLogData(ivType: LogsApi.LogIndexType, start: number, end: number, ...curves: string[]) {
		if (!curves.length) {
			return Observable.empty<IObjectData>();
		}

		return new Observable<IObjectData>((subscriber: Subscriber<IObjectData>) => {
			const endIndex = ivType === LogsApi.LogIndexType.DateTime ? end - (((new Date()).getTimezoneOffset()) * 60000)
				: end;
			const startIndex = ivType === LogsApi.LogIndexType.DateTime ? start - (((new Date()).getTimezoneOffset()) * 60000)
				: start;

			const complexLogDataParams = this.getComplexLogParams(ivType, curves, 'l', startIndex, endIndex);
			const query = this.apiService.findComplexLogsData(complexLogDataParams);
			let logs: LogsApi.ILog[] = [];

			query.subscribe(
				data => {
					logs = data.logs;
					this.loggingService.log('complex log data has arrived');
				},
				e => subscriber.error(e),
				() => {
					subscriber.next(this.extractDataFromComplexResponse(ivType, curves, logs));
					subscriber.complete();
				}
			);
		});
	}

	protected getComplexLogMinMax(ivType: LogsApi.LogIndexType, curves: string[]) {
		if (!curves.length) {
			return Observable.empty<LogsApi.IComplexMinMaxResponse>();
		}
		return new Observable<LogsApi.IComplexMinMaxResponse>((subscriber: Subscriber<LogsApi.IComplexMinMaxResponse>) => {
			const complexLogMinMaxParams = this.getComplexLogParams(ivType, curves, 'm', null, null);

			const query = this.apiService.findComplexLogsMinMax(complexLogMinMaxParams);
			let response: LogsApi.IComplexMinMaxResponse;

			query.subscribe(
				data => {
					response = data;
					this.loggingService.log('min max data has arrived');
				},
				e => subscriber.error(e),
				() => {
					if (response && response.maxIndex !== null &&
						response.minIndex !== null && response.minIndex !== response.maxIndex) {
						const endIndex = ivType === LogsApi.LogIndexType.DateTime ? this.timezoneService.getISOEpochFormat(response.maxIndex + 'Z') :
							response.maxIndex;
						const startIndex = ivType === LogsApi.LogIndexType.DateTime ? this.timezoneService.getISOEpochFormat(response.minIndex + 'Z') :
							response.minIndex;
						subscriber.next({ minIndex: startIndex, maxIndex: endIndex, activePass: response.activePass, logType: response.logType });
						subscriber.complete();
					} else {
						subscriber.error(new Error('No data in response.'));
						return;
					}
				});
		});
	}

	public getLogMinMax(ivType: LogsApi.LogIndexType, curves: string[], wliPassUid?: string) {
		if (!curves.length) {
			return Observable.empty<LogsApi.IComplexMinMaxResponse>();
		}
		return new Observable<LogsApi.IComplexMinMaxResponse>((subscriber: Subscriber<LogsApi.IComplexMinMaxResponse>) => {

			const logMinMaxParams = this.getLogParams(ivType, curves, 'm', null, null, wliPassUid);
			if (logMinMaxParams) {
				const query = this.apiService.findLogs(logMinMaxParams);
				let response: LogsApi.ILog[];

				query.subscribe(
					data => {
						response = data;
						console.log('min max data has arrived');
					},
					e => subscriber.error(e),
					() => {
						if (response && response.length > 0 && response[0].endDateTimeIndex !== null &&
							(ivType === LogsApi.LogIndexType.DateTime
								? (response[0].startDateTimeIndex !== null && response[0].endDateTimeIndex !== null &&
									response[0].startDateTimeIndex !== response[0].endDateTimeIndex)
								: (response[0].startIndex !== null && response[0].endIndex !== null && response[0].startIndex !== response[0].endIndex &&
									!isNaN(response[0].startIndex.value) && !isNaN(response[0].endIndex.value)))) {

							const endIndex = ivType === LogsApi.LogIndexType.DateTime ?
								this.timezoneService.getISOEpochFormat(response[0].endDateTimeIndex + 'Z') :
								response[0].endIndex.value;
							const startIndex = ivType === LogsApi.LogIndexType.DateTime ?
								this.timezoneService.getISOEpochFormat(response[0].startDateTimeIndex + 'Z') :
								response[0].startIndex.value;
							subscriber.next({
								minIndex: startIndex,
								maxIndex: endIndex,
								logType: response[0].direction === UtilsService.logType.DirectionUp ? UtilsService.logType.LogUp : '',
								activePass: ''
							});
							subscriber.complete();
						} else {
							subscriber.error(new Error('No data in response.'));
							return;
						}
					});
			}

		});
	}

	protected extractDataFromComplexResponse(ivType: LogsApi.LogIndexType, curves: any,
		logs: LogsApi.ILog[]) {
		var objectData: IObjectData = {};
		logs.forEach(log => {
			const logData = log.logData;
			const indexCurve = logData.mnemonicList.indexOf(log.indexCurve);

			if (indexCurve < 0) {
				return;
			}

			const ivs = _.map(logData.data, data => ivType === LogsApi.LogIndexType.DateTime
				? (new Date(data[indexCurve] + 'Z').getTime() + (new Date().getTimezoneOffset()
					* 60000)) : data[indexCurve]);

			const curvesLength = curves.length;
			for (let i = 0; i < curvesLength; i++) {
				var li: LogsApi.ILogCurveInfo = _.find(log.logCurveInfo, (loginfo: LogsApi.ILogCurveInfo) => {
					return loginfo.mnemAlias.value === curves[i].CurveName;
				});
				if (!li) {
					continue;
				}
				const curveIndex = logData.mnemonicList.indexOf(li.mnemonic.value);
				if (curveIndex < 0) {
					continue;
				}

				const valueData = logData.data;
				const dataCount = valueData.length;
				const values: number[] = [];
				for (let j = 0; j < dataCount; j++) {
					values.push(valueData[j][curveIndex]);
				}

				objectData[curves[i].CurveName] = {
					ivList: ivs,
					valueList: values
				};
			}
		});

		return objectData;
	}

	private getComplexLogParams(ivType: LogsApi.LogIndexType, curves: string[], size: 'm' | 'l' | 's' = 'm',
		startIndex: number = null, endIndex: number = null) {

		return {
			IndexType: ivType,
			RtsComplexLogQueryList: this.getRtsLogQueryRequestParams(ivType, curves, size, startIndex, endIndex),
			UidWell: this.currentJob.WellUid
		};
	}

	private getLogParams(ivType: LogsApi.LogIndexType, curves: string[], size: 'm' | 'l' | 's' = 'm',
		startIndex: number = null, endIndex: number = null, wliPassUid?: string) {
		const currentJob = this.dashboardDataService.currentJob;

		var matchingCurves = _.chain(curves)
			.map(curve => {
				let curveInfo: QueryLogsApi.ILog = _.cloneDeep(_.find(this.availableCurves, variable => {
					return (curve === variable.MnemonicAlias &&
						variable.IndexType === UtilsService.getLogIndexType(LogsApi.LogIndexType[ivType]));
				}));
				return curveInfo;
			}).value();
		if (!matchingCurves || matchingCurves.length < 0) {
			return void 0;
		}
		_.remove(matchingCurves, curve => curve === undefined);
		return {
			Uom: currentJob.UnitSet.split('|')[1],
			IndexType: ivType,
			Uid: wliPassUid,
			UidWell: currentJob.WellUid,
			MnemonicAliases: _.map(matchingCurves, v => v.MnemonicAlias),
			size: size,
			timeZone: '',
			startDateTimeIndex: startIndex && new Date(startIndex).toISOString(),
			endDateTimeIndex: endIndex && new Date(endIndex).toISOString(),
			ReturnMinMax: true
		};
	}

	private getComplexLogDataParams(ivType: LogsApi.LogIndexType, curves: LogsApi.ICurveCoercionInfo[], size: 'm' | 'l' | 's' = 'm',
		startIndex: number = null, endIndex: number = null) {

		return {
			IndexType: ivType,
			RtsComplexLogQueryList: this.getRtsLogDataQueryRequestParams(ivType, curves, size, startIndex, endIndex),
			UidWell: this.currentJob.WellUid
		};
	}

	private getRtsLogQueryRequestParams(ivType: LogsApi.LogIndexType, curves: string[],
		size: string, startIndex: number = null,
		endIndex: number = null): LogsApi.PostComplexLogsRequest[] {
		let params: LogsApi.PostComplexLogsRequest[] = [];
		let orderedMatchingVariables = _.chain(curves)
			.map(curve => {
				let curveInfo: any = _.cloneDeep(_.find(this.availableCurves, variable => {
					return (curve === variable.MnemonicAlias &&
						variable.IndexType === UtilsService.getLogIndexType(LogsApi.LogIndexType[ivType]));
				}));
				return curveInfo;
			})
			.groupBy('LogUid')
			.value();

		_.map(orderedMatchingVariables, (logGroupedVariables: any, logId: string) => {
			this.loggingService.log(logId);
			this.loggingService.log(logGroupedVariables);
			if (logId === 'undefined') {
				return;
			}
			let logGroupedCurves: any[] = _.map(logGroupedVariables, 'MnemonicAlias');

			if (ivType === LogsApi.LogIndexType.DateTime) {
				params.push(this.getTimeParamsForComplexLogData(logGroupedCurves, [], size, logId,
					ivType, startIndex, endIndex));
			} else {
				params.push(this.getDepthParamsForComplexLogData(logGroupedCurves, [], size, logId,
					ivType, startIndex, endIndex));
			}
		});
		return params;
	}

	private getRtsLogDataQueryRequestParams(ivType: LogsApi.LogIndexType, curves: LogsApi.ICurveCoercionInfo[],
		size: string, startIndex: number = null, endIndex: number = null): LogsApi.PostComplexLogsRequest[] {
		let params: LogsApi.PostComplexLogsRequest[] = [];
		_.chain(curves)
			.map(curve => {
				let curveInfoWithCoercion: any = _.cloneDeep(_.find(this.availableCurves, variable => {
					return (curve.CurveName === variable.MnemonicAlias &&
						variable.IndexType === UtilsService.getLogIndexType(LogsApi.LogIndexType[ivType]));
				}));
				if (curveInfoWithCoercion) {
					curveInfoWithCoercion.IntervalCoercion = curve.IntervalCoercion;
					curveInfoWithCoercion.Resolution = curve.Resolution;
					curveInfoWithCoercion.Distance = curve.Distance;
					curveInfoWithCoercion.Uom = curve.Uom;
					curveInfoWithCoercion.SampleIndex = curve.SampleIndex;
					curveInfoWithCoercion.TagLabel = curve.TagLabel;
					if (this.dashboardDataService.currentJob.PSLName === UtilsService.PSLNames.Wireline) {
						curveInfoWithCoercion.LogUid = curve.LogPassUid;
					}
				}
				return curveInfoWithCoercion;
			})
			.groupBy('LogUid')//grouping by loguid
			.map((groupedCurves: any) => {
				let groupedCoercion = _.chain(groupedCurves)
					.groupBy('IntervalCoercion')//grouping by interval coercion.
					.value();
				_.map(groupedCoercion, (curveInfo: any, key) => {
					this.loggingService.log('for key ' + key + 'curve is ' + curveInfo);
					//getting all curves with mnemonic alias
					let logGroupedCurves: any[] = _.map(curveInfo, 'MnemonicAlias');
					//getting loguid for group as we have already grouped by logId.
					let logUid: any = _.map(curveInfo, 'LogUid')[0];
					let IntervalCoercionOption: any = _.map(curveInfo, 'IntervalCoercion')[0];
					// if (IntervalCoercionOption === 'Even') {
					logGroupedCurves = [];
					//if duplicate logGroupedCurves=curveinfo
					var uniqueCurveInfo: any = [];

					for (let i = 0; i <= curveInfo.length - 1; i++) {
						//if duplicate logGroupedCurves=curveinfo
						if (curveInfo[i]) {
							let curveCount = _.filter((_.map(curveInfo, 'MnemonicAlias')), curve => {
								return curve === curveInfo[i].MnemonicAlias;
							}).length;
							if (curveCount > 1) {
								params.push(this.createGroupedCoercion(ivType, IntervalCoercionOption, [curveInfo[i]], key,
									[curveInfo[i].MnemonicAlias], startIndex, endIndex, size, logUid, curveInfo[i].TagLabel));
							} else {
								if (!IntervalCoercionOption || IntervalCoercionOption === 'None') {
									params.push(this.createGroupedCoercion(ivType, IntervalCoercionOption, [curveInfo[i]], key,
										[curveInfo[i].MnemonicAlias], startIndex, endIndex, size, logUid, curveInfo[i].TagLabel));
								} else {
									logGroupedCurves.push(curveInfo[i].MnemonicAlias);
									uniqueCurveInfo.push(curveInfo[i]);
								}
							}
						}
					}
					if (uniqueCurveInfo.length > 0) {
						params.push(this.createGroupedCoercion(ivType, IntervalCoercionOption, uniqueCurveInfo, key,
							logGroupedCurves, startIndex, endIndex, size, logUid, uniqueCurveInfo[0].TagLabel));
					}
					// } else {
					// 	params.push(this.createGroupedCoercion(ivType, IntervalCoercionOption, curveInfo, key,
					// 		logGroupedCurves, startIndex, endIndex, size, logUid));
					// }
				});
				return groupedCoercion;
			}).value();
		return params;
	}

	private createGroupedCoercion(ivType: LogsApi.LogIndexType, IntervalCoercionOption, curveInfo, key,
		logGroupedCurves, startIndex, endIndex, size: string, logUid: string, tagLabel?: string): any {
		if (ivType === LogsApi.LogIndexType.DateTime) {
			let coercionTimeSetting: LogsApi.CoercionSettingTypeTime = null;
			if (IntervalCoercionOption && IntervalCoercionOption !== 'None') {
				coercionTimeSetting = this.fillTimeCoercionInfo(curveInfo, key);
				return (this.getTimeParamsForComplexLogData(logGroupedCurves, [], size, logUid,
					ivType, startIndex, endIndex, coercionTimeSetting, tagLabel));
			} else {
				return (this.getTimeParamsForComplexLogData([], logGroupedCurves, size, logUid,
					ivType, startIndex, endIndex, coercionTimeSetting, tagLabel));
			}
		} else if (ivType === LogsApi.LogIndexType.ElapsedTime) {
			let coercionTimeSetting: LogsApi.CoercionSettingTypeTime = null;
			if (IntervalCoercionOption && IntervalCoercionOption !== 'None') {
				coercionTimeSetting = this.fillTimeCoercionInfo(curveInfo, key);
				return (this.getElapseTimeParamsForComplexLogData(logGroupedCurves, [], size, logUid,
					ivType, startIndex, endIndex, coercionTimeSetting, tagLabel));
			} else {
				return (this.getElapseTimeParamsForComplexLogData([], logGroupedCurves, size, logUid,
					ivType, startIndex, endIndex, coercionTimeSetting, tagLabel));
			}
		} else {
			let coercionDepthSetting: LogsApi.CoercionSettingTypeDepth = null;
			if (IntervalCoercionOption && IntervalCoercionOption !== 'None') {
				coercionDepthSetting = this.fillDepthCoercionInfo(curveInfo, key);
				return (this.getDepthParamsForComplexLogData(logGroupedCurves, [], size, logUid, ivType,
					startIndex, endIndex, coercionDepthSetting, curveInfo[0].Uom, tagLabel));
			} else {
				return (this.getDepthParamsForComplexLogData([], logGroupedCurves, size, logUid, ivType,
					startIndex, endIndex, coercionDepthSetting, curveInfo[0].Uom, tagLabel));
			}
		}
	}

	private getTimeParamsForComplexLogData(curveList: string[], nonCoercionCurveList: string[], size: string, logId: string,
		ivType: LogsApi.LogIndexType, startDateTime: number = null, endDateTime: number = null,
		coercionTimeSetting: LogsApi.CoercionSettingTypeTime = null, tagLabel?): LogsApi.PostComplexLogsRequestForTime {

		let timeZone = '';
		if (size === 'l') {
			timeZone = this.timezoneService.getCurrentJobTimeZone();
			const timeZoneValueInMilliSecond = this.timezoneService.getTimeZoneValueInMilliSeconds();
			endDateTime = endDateTime - (timeZoneValueInMilliSecond);
			startDateTime = startDateTime - (timeZoneValueInMilliSecond);
		}
		return {
			Uom: this.uomProfile,
			IndexType: ivType,
			Uid: logId,
			UidWell: this.currentJob.WellUid,
			MnemonicAliases: curveList,
			NonCoercionMnemonicAliases: nonCoercionCurveList,
			Size: size,
			startDateTimeIndex: size === 'l' ? new Date(startDateTime).toISOString() : null,
			endDateTimeIndex: size === 'l' ? new Date(endDateTime).toISOString() : null,
			timeZone: timeZone,
			CoercionSetting: coercionTimeSetting,
			tagLabel: tagLabel// {
			// 	EvenIntervalCoercionEnable: true,
			// 	TimeIndexSampleInterval: PlotManager.Instance.getPlotParameters().PlottingInterval,
			// 	TimeIndexCoercionTypeForAllVars: Utils.CoercionSetting.Type.SMOOTH,
			// 	TimeIndexCoercionParameterForAllVars: PlotManager.Instance.getPlotParameters().CoercionDistance,
			// 	TimeIndexGapDistanceForAllVars: Utils.CoercionSetting.TimeIndexGapDistance,
			//TODO:have to check the equivalent value of 1 as given in depth case
			// 	LogCurvesCoercionInfo: void 0
			// }
		};
	}
	private getElapseTimeParamsForComplexLogData(curveList: string[], nonCoercionCurveList: string[], size: string, logId: string,
		ivType: LogsApi.LogIndexType, startIndex: number = null, endIndex: number = null,
		coercionTimeSetting: LogsApi.CoercionSettingTypeTime = null, tagLabel?): LogsApi.PostComplexLogsRequestForElapseTime {
		return {
			Uom: this.uomProfile,
			IndexType: ivType,
			Uid: logId,
			UidWell: this.currentJob.WellUid,
			MnemonicAliases: curveList,
			NonCoercionMnemonicAliases: nonCoercionCurveList,
			Size: size,
			startIndex: size === 'l' ? {
				uom: '',
				value: startIndex
			} : null,
			endIndex: size === 'l' ? {
				uom: '',
				value: endIndex
			} : null,
			CoercionSetting: coercionTimeSetting,
			tagLabel: tagLabel
		};
	}
	private getDepthParamsForComplexLogData(curveList: string[], nonCoercionCurveList: string[], size: string, logId: string,
		ivType: LogsApi.LogIndexType, startIndex: number = null, endIndex: number = null,
		coercionDepthSetting: LogsApi.CoercionSettingTypeDepth = null, uom?: string, tagLabel?): LogsApi.PostComplexLogsRequestForDepth {

		return {
			Uom: this.uomProfile,
			IndexType: ivType,
			Uid: logId,
			UidWell: this.currentJob.WellUid,
			MnemonicAliases: curveList,
			NonCoercionMnemonicAliases: nonCoercionCurveList,
			Size: size,
			startIndex: size === 'l' ? {
				uom: uom,//TODONV this might change
				value: startIndex//TODONV this might change
			} : null,
			endIndex: size === 'l' ? {
				uom: uom,//TODONV this might change
				value: endIndex //TODONV this might change
			} : null,
			CoercionSetting: coercionDepthSetting,
			tagLabel: tagLabel
			//     EvenIntervalCoercionEnable: true,
			//     DepthIndexSampleInterval: { uom: 'ft', value: 2 },
			//     DepthIndexCoercionTypeForAllVars: 'RTS_CT_SMOOTH',
			//     DepthIndexCoercionParameterForAllVars: { uom: 'ft', value: 1000 },
			//     DepthIndexGapDistanceForAllVars: { uom: 'ft', value: 2 }
			// }
		};
	}

	private fillDepthCoercionInfo(logGroupedCurves: any[], key: string): LogsApi.CoercionSettingTypeDepth {
		let EvenIntervalCoercion: boolean = false;
		let DepthIndexCoercionType = UtilsService.DepthIndexCoercionType;
		let coercionData: LogsApi.LogCurveCoercionTypeDepth[] = [];
		let DepthIndexSampleInterval: IGenericMeasure = { uom: 'ft', value: 2 };
		let DepthIndexCoercionParameterForAllVars: IGenericMeasure = { uom: 'ft', value: 2 };
		let DepthIndexGapDistanceForAllVars: IGenericMeasure = { uom: 'ft', value: 2 };
		if (key === 'Even' || key === 'Automatic') {
			EvenIntervalCoercion = true;
		} else {
			return null;
		}
		_.forEach(logGroupedCurves, (element: any) => {
			DepthIndexSampleInterval = { uom: element.Uom, value: element.SampleIndex };
			DepthIndexCoercionParameterForAllVars = { uom: element.Uom, value: 2 };
			DepthIndexGapDistanceForAllVars = { uom: element.Uom, value: 2 };
			coercionData.push({
				LogCurveMnemonic: element.MnemonicAlias,
				DepthIndexCoercionType: DepthIndexCoercionType,
				DepthIndexCoercionParameter: { uom: element.Uom, value: element.Resolution },
				DepthIndexGapDepthDistance: { uom: element.Uom, value: element.Distance }
			});
		});
		return {
			EvenIntervalCoercionEnable: EvenIntervalCoercion,
			DepthIndexSampleInterval: DepthIndexSampleInterval,
			DepthIndexCoercionTypeForAllVars: DepthIndexCoercionType,
			DepthIndexCoercionParameterForAllVars: DepthIndexCoercionParameterForAllVars,
			DepthIndexGapDistanceForAllVars: DepthIndexGapDistanceForAllVars,
			LogCurvesCoercionInfo: coercionData
		};
	}

	private fillTimeCoercionInfo(logGroupedCurves: any[], key: string): LogsApi.CoercionSettingTypeTime {
		let EvenIntervalCoercion: boolean = false;
		let coercionData: LogsApi.LogCurveCoercionTypeTime[] = [];
		let timeIndexCoercionTypeValue = UtilsService.DepthIndexCoercionType;
		let timeindexSampleInterval: string = '00:00:15';
		let timeIndexCoercionParameterForAllVars: string = '00:00:02';
		let timeIndexGapDistanceForAllVars: string = '00:00:02';
		if (key === 'Even' || key === 'Automatic') {
			EvenIntervalCoercion = true;
		} else {
			return null;
		}
		logGroupedCurves.forEach(element => {
			timeindexSampleInterval = element.SampleIndex;
			coercionData.push({
				LogCurveMnemonic: element.MnemonicAlias,
				TimeIndexCoercionType: timeIndexCoercionTypeValue,
				TimeIndexCoercionParameter: element.Resolution,
				TimeIndexGapTimeDistance: element.Distance
			});
		});
		return {
			EvenIntervalCoercionEnable: EvenIntervalCoercion,
			TimeIndexSampleInterval: timeindexSampleInterval,
			TimeIndexCoercionTypeForAllVars: timeIndexCoercionTypeValue,
			TimeIndexCoercionParameterForAllVars: timeIndexCoercionParameterForAllVars,
			TimeIndexGapDistanceForAllVars: timeIndexGapDistanceForAllVars,
			LogCurvesCoercionInfo: coercionData
		};
	}
}
