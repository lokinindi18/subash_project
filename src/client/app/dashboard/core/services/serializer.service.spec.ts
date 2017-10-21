import { SerializerService } from './serializer.service';
import * as models from '../../objects/models';
import { DashboardModel } from './../data/dashboard.model';
import * as _ from 'lodash';

export function main() {
	describe('Test cases for SerializerService', () => {
		let serializerService;
		beforeEach(() => {
			serializerService = new SerializerService();
			_.forEach(models, model => serializerService.registerModel(model));
		});

		it('should be able to deserialize and return the model', () => {
			let dbModel: DashboardModel = new DashboardModel();
			dbModel.Name = 'TestModel';
			dbModel.Objects = [];
			dbModel.newName = 'TestModel';
			dbModel.Type = 'Dashboard';
			const data = serializerService.serialize(dbModel);
			const model = serializerService.deserialize(data);
			expect(model).not.toBeNull();
			expect(model.Type).toEqual('Dashboard');
		});

		it('should be able to serialize the given model and return data ', () => {
			let dbModel: DashboardModel = new DashboardModel();
			dbModel.Name = 'TestModel';
			dbModel.Objects = [];
			dbModel.newName = 'TestModel';
			dbModel.Type = 'Dashboard';
			const data = serializerService.serialize(dbModel);
			expect(data).not.toBeNull();
		});

		it('should be able to register the model with the model type', () => {
			const model = models[0];
			expect(serializerService.register['DashboardModel']).toEqual(model);
		});

		it('should be able to create the model with the type name', () => {
			const model = serializerService.createModel('Trace');
			expect(model['Type']).toEqual('Trace');
		});

	});
}
