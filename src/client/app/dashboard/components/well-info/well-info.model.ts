import { WellsApi, LoggingService } from '../../../shared/services/services';

import * as _ from 'lodash';

export class WellInfoData {
	constructor(
		public Name: string
		, public UnitType: string
		, public UnitValue: any
	) { }
}

export class WellInfoModal {

	public customerName: string = '';
	public apiSN: string = '';
	public contractor: string = '';
	public jobNo: string = '';
	public wellID: string = '';
	public wellName: string = '';
	public rigName: string = '';
	public fieldName: string = '';
	public county: string = '';
	public state: string = '';
	public country: string = '';
	public district: string = '';
	public section: string = '';
	public latitude: string = '';
	public longitude: string = '';
	public spudDate: string = '';
	public startDate: string = '';
	public endDate: string = '';
	public startDepth: string = '';
	public endDepth: string = '';
	public permanentDatum: string = '';
	public elevation: string = '';
	public heightAbovePD: string = '';
	public kbElevation: string = '';
	public dfElevation: string = '';
	public glElevation: string = '';
	public wdElevation: string = '';
	public wellHeadNS: string = '';
	public wellHeadEW: string = '';
	public utmX: string = '';
	public utmyY: string = '';
	constructor(private loggingService: LoggingService) {
	}
	public mapValuesToModel(rawData: WellsApi.IWellRawData) {

		let variableList: string[] = rawData.variableList;
		let unitList: string[] = rawData.unitList;
		let dataList: any[] = rawData.data[0];
		let wellInfos: WellInfoData[] = [];
		if (variableList.length	=== unitList.length
			&& dataList && unitList.length === dataList.length) {
			_.forEach(variableList, (n: any, k: number) => {
				wellInfos.push(new WellInfoData(
					variableList[k]
					, unitList[k]
					, dataList[k]
				));
			});
		}
		this.loggingService.log(wellInfos);
		_.each(wellInfos, (variable: WellInfoData) => {
			let value = variable.UnitValue;
			let unit = variable.UnitType;
			switch (variable.Name) {
				case 'Customer Name':
					this.customerName = value;
					break;
				case 'API S/N':
					this.apiSN = value;
					break;
				case 'Contractor':
					this.contractor = value;
					break;
				case 'Job Number':
					this.jobNo = value;
					break;
				case 'Well Name':
					this.wellName = value;
					break;
				case 'Rig Name':
					this.rigName = value;
					break;
				case 'Field Name':
					this.fieldName = value;
					break;
				case 'County Name':
					this.county = value;
					break;
				case 'State Name':
					this.state = value;
					break;
				case 'Country Name':
					this.country = value;
					break;
				case 'District':
					this.district = value;
					break;
				case 'Section':
					this.section = value;
					break;
				case 'Latitude':
					this.latitude = this.formatdeg(value);
					break;
				case 'Longitude':
					this.longitude = this.formatdeg(value);
					break;
				case 'Spud Date':
					this.spudDate = this.formatDate(value);
					break;
				case 'Start Time':
					this.startDate = this.formatDate(value);
					break;
				case 'End Time':
					this.endDate = this.formatDate(value);
					break;
				case 'Start Depth':
					this.startDepth = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'End Depth':
					this.endDepth = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'Permanent Datum':
					this.permanentDatum = value;
					break;
				case 'Elevation':
					this.elevation = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'Height Above PD':
					this.heightAbovePD = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'GL Elev':
					this.glElevation = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'WD Elev':
					this.wdElevation = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'Well Head E/W':
					this.wellHeadEW = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'Well Head N/S':
					this.wellHeadNS = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'UTM X':
					this.utmX = this.formatNumber(value, 2) + ' ' + unit;
					break;
				case 'UTM Y':
					this.utmyY = this.formatNumber(value, 2) + ' ' + unit;
					break;
				default:
					break;
			}
		});
	}

	private formatNumber(value: number, precision: number) {
		var power = Math.pow(10, precision || 0);
		return String(Math.round(value * power) / power);
	}

	private formatDate(unformatedDate: any) {
		let d: any = new Date(unformatedDate);
		let formattedate: any = [
			d.getDate().padLeft(),
			(d.getMonth() + 1).padLeft(),
			d.getFullYear()].join('-') +
			' ' +
			[d.getHours().padLeft(),
			d.getMinutes().padLeft(),
			d.getSeconds().padLeft()].join(':');
		return formattedate;
	}

	private formatdeg(deg: number) {
		var d: number;
		var min: number;
		var s: number;
		var signText: string;

		if (deg < 0.0) {
			deg = -deg;
			signText = '-';
		} else {
			signText = '';
		}
		deg += 0.0000001;
		d = deg | 0;
		deg -= d;
		min = (deg * 60.0) | 0;
		deg -= min / 60.0;
		s = deg * 3600.0;
		return (signText + d + String.fromCharCode(176) + min + String.fromCharCode(39) + this.formatNumber(s, 2) + String.fromCharCode(34));
	}
}
