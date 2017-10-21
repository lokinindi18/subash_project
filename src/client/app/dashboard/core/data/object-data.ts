import { Model } from './model';

export interface ITraceData {
	ivList: number[];
	valueList: number[];
}

export interface IObjectData {
	[key: string]: ITraceData;
}

export interface IObjectPlotMenu {
	plotModel: Model;
	isOpen: boolean;
}
