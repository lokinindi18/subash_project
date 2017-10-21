import { UtilsService } from '../../../shared/services/services';
import { AuthenticateApi, ExporterInfo, QueryLogsApi, LogsApi } from './../../../shared/services/services';
import { ExportDataApi } from './../../../shared/services/web/insite-web.data';
import * as _ from 'lodash';


export class ExporterInfoData {
	constructor(
		public Name: string
		, public UnitType: string
		, public UnitValue: any
	) { }
}

export class ExporterModel {
	public pslName: string = '';
	public WellName: string = '';
	public WellId: string = '';
	public IVType: string = '';
	public StartDepth: number = void 0;
	public EndDepth: number = void 0;
	public StartDepthRange: number;
	public EndDepthRange: number;
	public StartDepthUnit: string = '';
	public EndDepthUnit: string = '';
	public StartDate: string = '';
	public EndDate: string = '';
	public StartTimeRange: Date;
	public EndTimeRange: Date;
	public StartTime: string = '12:00:00';
	public EndTime: string = '12:00:00';
	public StartTimePeriod: string = 'AM';
	public EndTimePeriod: string = 'AM';
	public TimeFormat: string = 'Seconds';
	public DataPoint: boolean = true;
	public EvenIntervalValue: number = 1;
	public EvenIntervalUnit: string = 'ft';
	public FileFormat: string = 'Select File Format';
	public UseFixedWidth: boolean = false;
	public IncludeHeader: boolean = false;
	public FixedWidth: number;
	public DelimitedValue: string = 'Tab';
	public DelimitedCharacter: string = '\t';
	public Wrap: boolean = false;
	public LISType: string = 'TIF';
	public MissingFloat: number = -999.25;
	public MissingInteger: number = -999;
	public MissingASCII: string = '';
	public Comment: string = '';
	public CurrentJob: AuthenticateApi.IJob;
	public VariableList: QueryLogsApi.ILog[];
	public IndexType: string = '';
	public exportTableArray: ExporterInfo.ExportTableDetails[] = [];
	public pass: LogsApi.WLIPassInfo;

	public errMsg = {
		startDepthEmpty: 'Start Depth should not be empty',
		startDepthOutofRange: 'Start Depth is out of Range',
		startDepthError: 'Start Depth must be lesser than End Depth',
		endDepthEmpty: 'End Depth should not be empty',
		endDepthOutofRange: 'End Depth is out of Range',
		endDepthError: 'End Depth must be greater than Start Depth',
		startTimeFormatError: 'Invalid Start Time format',
		startTimeOutofRange: 'Start Time is out of Range',
		startTimeError: 'Start Time must be lesser than End Time',
		endTimeFormatError: 'Invalid End Time format',
		endTimeOutofRange: 'End Time is out of Range',
		endTimeError: 'End Time must be greater than Start Time'
	};
	private validTimeRegex = /^(0[1-9]|1[0-2])(\:)([0-5][0-9])(\:)([0-5][0-9])$/;

	public get indexType(): number {
		return UtilsService.getIVIndex(this.IVType);
	}
	public get exportType(): number {
		return UtilsService.getImportExportIndex(this.FileFormat, this.LISType);
	}
	public get wrapMode(): number {
		return UtilsService.getWrapMode(this.Wrap);
	}
	public get startDateTimeIndex(): string {
		return this.generateISOTimeFormat(this.StartDate, this.StartTime, this.StartTimePeriod);
	}
	public get endDateTimeIndex(): string {
		return this.generateISOTimeFormat(this.EndDate, this.EndTime, this.EndTimePeriod);
	}
	public get startIndex(): ExportDataApi.StartEndIndexTemplate {
		if (this.StartDepth === undefined || this.StartDepth === null) {
			return undefined;
		}
		let startIndex: ExportDataApi.StartEndIndexTemplate = {
			uom: this.StartDepthUnit,
			value: this.StartDepth
		};
		return startIndex;
	}
	public get endIndex(): ExportDataApi.StartEndIndexTemplate {
		if (this.EndDepth === undefined || this.EndDepth === null) {
			return undefined;
		}
		let endIndex: ExportDataApi.StartEndIndexTemplate = {
			uom: this.EndDepthUnit,
			value: this.EndDepth
		};
		return endIndex;
	}

	public get coercionMnemonicList(): ExportDataApi.CoercionMnemonicListTemplate[] {
		var exporterArray = this.Wrap ? this.exportTableArray : this.exportTableArray.slice(0, 20);
		if (UtilsService.isFileFormatLAS2(this.FileFormat)) {
			exporterArray = _.filter(exporterArray, variable => variable.dataType !== 'string');
		}
		var groups = _.groupBy(_.sortBy(exporterArray, 'logUid'), 'logUid');
		var finalArray: ExportDataApi.CoercionMnemonicListTemplate[] = [];
		_.forEach(groups, (variableGroup, key) => {
			let mAliasDetails: ExportDataApi.MnemonicListTemplate[] = _.map(variableGroup, item => {
				return {
					Mnemonic: item.mnemonic,
					DataType: item.dataType,
					SpecialHandling: item.specialHandling,
					TraceLabel: item.traceLabel
				};
			});
			let depthIndexSampleInterval: ExportDataApi.StartEndIndexTemplate = {
				uom: this.EvenIntervalUnit,
				value: this.EvenIntervalValue
			};
			let depthIndexGapDistanceForAllVarsInterval: ExportDataApi.StartEndIndexTemplate = {
				uom: this.EvenIntervalUnit,
				value: 0
			};
			let timeIndexSampleInterval: string = '';
			if (UtilsService.isTDBasedIV(this.IVType)) {
				depthIndexSampleInterval = null;
				timeIndexSampleInterval = this.secondsTohhmmss(this.EvenIntervalValue);
			}
			let logCurvesCoercionInfo: ExportDataApi.LogCurvesCoercionInfoTemplate[] = _.map(
				_.filter(variableGroup, variable => variable.dataType !== 'string' || variable.dataType !== 'array'), item => {
					return {
						LogCurveMnemonic: item.mnemonic,
						DepthIndexCoercionType: LogsApi.CoercionType.RTS_CT_SMOOTH,
						DepthIndexCoercionParameter: {
							uom: item.unit,
							value: parseFloat(item.smoothingDistance),
						},
						DepthIndexGapDepthDistance: {
							uom: item.unit,
							value: 0,
						},
						TimeIndexCoercionType: LogsApi.CoercionType.RTS_CT_SMOOTH,
						TimeIndexCoercionParameter: this.secondsTohhmmss(item.smoothingDistance),
						TimeIndexGapTimeDistance: '0',
					};
				});

			let coercionSetting: ExportDataApi.CoercionSettingTemplate = {
				evenIntervalCoercionEnable: true,
				depthIndexSampleInterval: depthIndexSampleInterval,
				depthIndexCoercionTypeForAllVars: LogsApi.CoercionType.RTS_CT_SMOOTH,
				depthIndexCoercionParameterForAllVars: depthIndexSampleInterval,
				depthIndexGapDistanceForAllVars: depthIndexGapDistanceForAllVarsInterval,
				timeIndexSampleInterval: timeIndexSampleInterval,
				timeIndexCoercionTypeForAllVars: LogsApi.CoercionType.RTS_CT_SMOOTH,
				timeIndexCoercionParameterForAllVars: timeIndexSampleInterval,
				timeIndexGapDistanceForAllVars: '0',
				logCurvesCoercionInfo: logCurvesCoercionInfo,
			};
			if (this.DataPoint) {
				finalArray.push({ LogId: key, MnemonicList: mAliasDetails, CoercionSetting: null });
			} else {
				finalArray.push({ LogId: key, MnemonicList: mAliasDetails, CoercionSetting: coercionSetting });
			}
		});
		return finalArray;
	}
	private isValid = true;

	constructor(currentJob: AuthenticateApi.IJob, variableList: QueryLogsApi.ILog[]) {
		this.CurrentJob = currentJob;
		this.VariableList = variableList;
		this.pslName = currentJob.PSLName;
		this.WellName = currentJob.WellName;
		this.WellId = currentJob.WellUid;
		this.IVType = this.getDefaultIVType(this.pslName);
		this.setIVUnit();
	}
	public clearFormInputValues() {
		this.IVType = this.getDefaultIVType(this.pslName);
		this.StartDepth = void 0;
		this.EndDepth = void 0;
		this.StartDate = '';
		this.EndDate = '';
		this.StartTime = '12:00:00';
		this.EndTime = '12:00:00';
		this.StartTimePeriod = 'AM';
		this.EndTimePeriod = 'AM';
		this.TimeFormat = 'Seconds';
		this.DataPoint = true;
		this.EvenIntervalValue = 1;
		this.FileFormat = 'Select File Format';
		this.UseFixedWidth = false;
		this.IncludeHeader = false;
		this.FixedWidth = void 0;
		this.DelimitedValue = 'Tab';
		this.DelimitedCharacter = '|';
		this.Wrap = false;
		this.LISType = 'TIF';
		this.MissingFloat = -999.25;
		this.MissingInteger = -999;
		this.MissingASCII = '';
		this.Comment = '';
	}
	public clearDataSettings() {
		this.StartDepth = void 0;
		this.EndDepth = void 0;
		this.StartDate = '';
		this.EndDate = '';
		this.StartTime = '12:00:00';
		this.EndTime = '12:00:00';
		this.StartTimePeriod = 'AM';
		this.EndTimePeriod = 'AM';
		this.TimeFormat = 'Seconds';
		this.DataPoint = true;
		this.EvenIntervalValue = 1;
		this.setIVUnit();
	}
	public validateStartDepth(): string {
		let error;
		let startDepth = +this.StartDepth;
		if (UtilsService.isNullOrUndefined(this.StartDepth)) {
			error = this.errMsg.startDepthEmpty;
		} else if (startDepth < this.StartDepthRange || startDepth > this.EndDepthRange) {
			error = this.errMsg.startDepthOutofRange;
		} else if (this.pslName !== UtilsService.PSLNames.Wireline
			&& !UtilsService.isNullOrUndefined(this.EndDepth) && startDepth >= +this.EndDepth) {
			error = this.errMsg.startDepthError;
		}
		return error;
	}
	public validateEndDepth(): string {
		let error;
		let endDepth = +this.EndDepth;
		if (UtilsService.isNullOrUndefined(this.EndDepth)) {
			error = this.errMsg.endDepthEmpty;
		} else if (endDepth < this.StartDepthRange || endDepth > this.EndDepthRange) {
			error = this.errMsg.endDepthOutofRange;
		} else if (this.pslName !== UtilsService.PSLNames.Wireline
			&& !UtilsService.isNullOrUndefined(this.StartDepth) && +this.StartDepth >= endDepth) {
			error = this.errMsg.endDepthError;
		}
		return error;
	}
	public validateStartTime(): string {
		let error;
		let startTime;
		if (!this.validTimeRegex.test(this.StartTime) || this.StartDate === '') {
			error = this.errMsg.startTimeFormatError;
		} else {
			startTime = this.generateStandardTimeFormat(this.StartDate, this.StartTime, this.StartTimePeriod);
			if (startTime < this.StartTimeRange || startTime > this.EndTimeRange) {
				error = this.errMsg.startTimeOutofRange;
			} else if (this.EndDate !== ''
				&& startTime >= this.generateStandardTimeFormat(this.EndDate, this.EndTime, this.EndTimePeriod)) {
				error = this.errMsg.startTimeError;
			}
		}
		return error;
	}
	public validateEndTime(): string {
		let error;
		let endTime;
		if (!this.validTimeRegex.test(this.EndTime) || this.EndDate === '') {
			error = this.errMsg.endTimeFormatError;
		} else {
			endTime = this.generateStandardTimeFormat(this.EndDate, this.EndTime, this.EndTimePeriod);
			if (endTime < this.StartTimeRange || endTime > this.EndTimeRange) {
				error = this.errMsg.endTimeOutofRange;
			} else if (this.StartDate !== ''
				&& endTime <= this.generateStandardTimeFormat(this.StartDate, this.StartTime, this.StartTimePeriod)) {
				error = this.errMsg.endTimeError;
			}
		}
		return error;
	}

	public mapValuesToModel(response: LogsApi.IComplexMinMaxResponse, ivType: LogsApi.LogIndexType) {
		if (ivType) {
			this.StartDepthRange = this.formatNumber(response.minIndex, 2);
			this.StartDepthUnit = this.EvenIntervalUnit;
			this.EndDepthRange = this.formatNumber(response.maxIndex, 2);
			this.EndDepthUnit = this.EvenIntervalUnit;

		} else {
			this.StartTimeRange = this.formatDate(response.minIndex);
			this.EndTimeRange = this.formatDate(response.maxIndex);
		}
	}

	public get IsModelValid(): boolean {
		if (this.WellName === '' || this.WellId === ''
			|| !this.exportTableArray.length
			|| (!this.DataPoint
				&& (UtilsService.isNullOrUndefined(this.EvenIntervalValue) || this.EvenIntervalValue < 0 || this.EvenIntervalValue > 9999))
			|| this.FileFormat === 'Select File Format'
			|| (UtilsService.isFileFormatASCII(this.IVType)
				&& ((this.UseFixedWidth
					&& (UtilsService.isNullOrUndefined(this.FixedWidth) || this.FixedWidth < 19 || this.FixedWidth > 999))
					|| (!this.UseFixedWidth && this.DelimitedCharacter === '')))
			|| ((UtilsService.isTimeBasedIV(this.IVType))
				&& (this.validateStartTime() || this.validateEndTime()))
			|| ((this.IVType !== 'T&D' && this.IVType !== 'ET')
				&& (this.validateStartDepth() || this.validateEndDepth()))
			|| (UtilsService.isNullOrUndefined(this.MissingFloat) || this.MissingFloat < -99999999 || this.MissingFloat > 99999999)
			|| (UtilsService.isNullOrUndefined(this.MissingInteger) || this.MissingInteger < -99999999 || this.MissingInteger > 99999999)) {
			return false;
		}
		return this.isValid;
	}
	public set IsValid(valid: boolean) {
		this.isValid = valid;
	}

	private getDefaultIVType(pslName: string): string {
		let ivType: string = 'MD';
		if (pslName === UtilsService.PSLNames.PEGel || pslName ===
			UtilsService.PSLNames.PEFoam || pslName === UtilsService.PSLNames.PEStandard ||
			pslName === UtilsService.PSLNames.CementingConventional || pslName === UtilsService.PSLNames.CementingFoam ||
			pslName === UtilsService.PSLNames.TSS || pslName === UtilsService.PSLNames.TSSGeoBalance) {
			ivType = 'T&D';
		}
		return ivType;
	}

	private setIVUnit() {
		let unit: string = 'ft';
		let curveForUnit;
		if (UtilsService.isTimeBasedIV(this.IVType)) {
			unit = 's';
		} else if (this.CurrentJob.PSLName === UtilsService.PSLNames.Wireline) {
			curveForUnit = this.VariableList.find(variable => variable.MnemonicAlias === 'Tool Depth');
		} else if (UtilsService.isMDBasedIV(this.IVType)) {
			curveForUnit = this.VariableList.find(variable => variable.MnemonicAlias === 'Bit Depth');
		} else {
			curveForUnit = (this.CurrentJob.PSLName === UtilsService.PSLNames.Baroid) ?
				this.VariableList.find(variable => variable.MnemonicAlias === 'TVD') :
				this.VariableList.find(variable => variable.MnemonicAlias === 'Hole Depth TVD');
		}
		if (curveForUnit) {
			unit = curveForUnit.Unit;
		}
		this.EvenIntervalUnit = unit;
	}

	private formatNumber(value: number, precision: number) {
		var power = Math.pow(10, precision || 0);
		return (Math.round(value * power) / power);
	}

	private formatDate(date: any): Date {
		date = date.slice(0, -4);
		let splitField = date.split('T');
		let partDate = splitField[0];
		let partTime = splitField[1];
		let splitDate = partDate.split('-');
		let localYear = Number(splitDate[0]);
		let localMonth = Number(splitDate[1]) - 1;
		let localDate = Number(splitDate[2]);
		let splitTime = partTime.split(':');
		let localhr = Number(splitTime[0]);
		let localMin = Number(splitTime[1]);
		let localSec = Number(splitTime[2]);
		let newDate = new Date(localYear, localMonth, localDate, localhr, localMin, localSec);
		let offsetInMsec: number = 0;
		if (this.CurrentJob.TimeZone) {
			let parts = this.CurrentJob.TimeZone.split(':');
			offsetInMsec = (Number(parts[0]) * 60 + (Number(parts[1]) * (Number(parts[0]) < 0 ? -1 : 1))) * 60000;
		}
		return new Date(newDate.getTime() + offsetInMsec);
	}

	private generateStandardTimeFormat(date: string, time: string, period: string): Date {
		date = date.replace(/\:/g, ' ');
		return new Date(date + ' ' + time + ' ' + period);
	}

	private generateISOTimeFormat(day: string, time: string, period: string): string {
		if (!day) return '';
		let date = this.generateStandardTimeFormat(day, time, period);
		let offsetInMsec: number = 0;
		if (this.CurrentJob.TimeZone) {
			let parts = this.CurrentJob.TimeZone.split(':');
			offsetInMsec = (Number(parts[0]) * 60 + (Number(parts[1]) * (Number(parts[0]) < 0 ? -1 : 1))) * 60000;
		}
		let finalDate = new Date(date.getTime() - offsetInMsec);
		return finalDate.format('Y-m-d') + 'T' + finalDate.format('H:i:s.u');
	}

	private secondsTohhmmss(totalSeconds): string {
		var hours = Math.floor(totalSeconds / 3600);
		var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
		var seconds = totalSeconds - (hours * 3600) - (minutes * 60);
		// round seconds
		seconds = Math.round(seconds * 100) / 100;
		var result = (hours < 10 ? '0' + hours : hours);
		result += ':' + (minutes < 10 ? '0' + minutes : minutes);
		result += ':' + (seconds < 10 ? '0' + seconds : seconds);
		return result.toString();
	}

}
