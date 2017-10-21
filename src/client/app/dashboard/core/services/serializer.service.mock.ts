import { SerializerService } from './serializer.service';

export class MockSerializerService extends SerializerService {
	// public register: { [key: string]: Type<any> } = {};

	public deserialize(data: any) {
		return data;
	}

	// public serialize(model: any): any {
	// 	// return data;
	// }

	// public registerModel(modelType: any) {
	// 	//this.register[name] = modelType;
	// }

	public createModel(typeName: string): any {
		if (typeName === 'Trace') {
			let traceModel: any = { CurveName: 'testTrace', Index: 0, LineColor: 'Red', LineStyle: 'Solid' };
			return traceModel;
		} else if (typeName === 'Variable') {
			let variableModel: any = { CurveName: 'testVariable', Index: 0 };
			return variableModel;
		} else if (typeName === 'Track') {
			let variableModel: any = {
				Type: 'Track',
				Id: null,
				Name: 'Track 1',
				IsAuto: true,
				IsTrackEnabled: true,
				TrackType: 'Linear',
				StartCycle: 0,
				CycleCount: 0,
				Index: 1,
				Traces: [
					{
						Type: 'Point to Point',
						Id: null,
						Name: null,
						IsAuto: true,
						IsTraceEnabled: true,
						AssignTrackName: 'Track 1',
						TraceType: 'Point to Point',
						CurveName: 'Acou PorLime',
						Index: 0,
						IntervalCoercion: 'None',
						LeftLimit: 0,
						RightLimit: 400,
						ShowMidLimit: true,
						FillGapDistance: 60,
						OffScaleHandling: 'Clamp',
						LineColor: 'Red',
						LineStyle: 'Solid',
						AreaFill: true,
						AreaFillType: 'Left Constant',
						FillValue: 10,
						FillLineColor: 'DarkBlue',
						FillColor: 'Yellow',
						FillPattern: 'None'
					}]
			};
			return variableModel;
		} else if (typeName === 'PlotTrace') {
			let plotTraceModel: any = {
				Type: 'Point to Point',
				Id: null,
				Name: null,
				IsAuto: true,
				IsTraceEnabled: true,
				AssignTrackName: 'Track 1',
				TraceType: 'Point to Point',
				CurveName: 'Acou PorLime',
				Index: 0,
				IntervalCoercion: 'None',
				LeftLimit: 0,
				RightLimit: 400,
				ShowMidLimit: true,
				FillGapDistance: 60,
				OffScaleHandling: 'Clamp',
				LineColor: 'Red',
				LineStyle: 'Solid',
				AreaFill: true,
				AreaFillType: 'Left Constant',
				FillValue: 10,
				FillLineColor: 'DarkBlue',
				FillColor: 'Yellow',
				FillPattern: 'None'
			};
			return plotTraceModel;
		}
	}

	// private getModelType(name: string): any {
	// 	// return modelType;
	// }

	// private setupPropertyChangeNotifiers(model: any) {

	// }
}
