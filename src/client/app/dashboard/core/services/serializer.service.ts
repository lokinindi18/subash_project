import { Injectable, Type } from '@angular/core';
import * as _ from 'lodash';
import { LoggingService } from './../../../shared/services/services';
const serializeMetadataKey = 'SerializeMetadata';
declare var Reflect: any;

export function Serialize(name: string = '@'): any {
	return Reflect.metadata(serializeMetadataKey, name);
}

export function getSerialize(target: any, propertyKey?: string) {
	return Reflect.getMetadata(serializeMetadataKey, target, propertyKey);
}

export interface IData {
	[key: string]: any;
	Type: string;
}

@Injectable()
export class SerializerService {
	private register: { [key: string]: Type<any> } = {};

	constructor(private loggingService: LoggingService) {
	}
	public deserialize(data: any) {
		let typeName: string = data.Type;
		if (!typeName) {
			this.loggingService.error('%o has no typeName!!', data);
			return data;
		}

		// TODO: This part ensures that we get a warning if we are using an old saved container
		// Must be removed before production release
		if (data['hasContainer'] && ((data['hasContainer'] === true)) || (data['hasContainer'] === 'true')) {
			this.loggingService.error('This container will soon be deprecated. Please re-save the dashboard.');
			data['ContainsType'] = data.Type;
			data.Type = 'Container';
			typeName = 'Container';
		}

		const model = this.createModel(typeName);

		_.forEach(data, (value, key) => {
			if (!getSerialize(model, key)) {
				return;
			}

			if (_.isArray(value)) {
				model[key] = [];
				_.forEach(value, v => {
					// TODO: remove this check later
					let dv = this.deserialize(v);
					if (dv['Type']) {
						model[key].push(dv);
					}
				});
				return;
			}

			model[key] = data[key];
		});

		return model;
	}

	public serialize(model: any) {
		const data: IData = { Type: '' };
		_.forEach(model, (value, key) => {
			if (!getSerialize(model, key)) {
				return;
			}

			if (_.isArray(value)) {
				data[key] = [];
				_.forEach(value, v => {
					data[key].push(this.serialize(v));
				});
				return;
			}
			data[key] = (<any>model)[key];
		});
		return data;
	}

	public registerModel(modelType: Type<any>) {
		const name = getSerialize(modelType);
		if (!name) {
			throw new Error('Please decorate model with @Serialize');
		}
		this.register[name] = modelType;
	}

	public createModel(typeName: string) {
		const modelType = this.getModelType(typeName.trim());// Trim is used as in IE sometimes leading blank space is coming
		const model = new (<any>modelType)();
		model['Type'] = typeName;
		this.setupPropertyChangeNotifiers(model);
		return model;
	}

	private getModelType(name: string) {
		const modelType = _.find(this.register, (o, n) => name === n);
		if (!modelType) {
			throw new Error(`Object type "${name}" not registered`);
		}

		return modelType;
	}

	/**
	 * This function ensures that any property change in the model can be notified
	 * For this to work, the properties should be assigned some value (even null or undefined would work) at the time of declaration
	 * @private
	 * @param {*} model The model on which property change notification would be setup
	 */
	private setupPropertyChangeNotifiers(model: any) {
		// Iterate through all the properties
		_.forEach(model, (value, key) => {

			// Ignore properties which are not to be serialized
			if (!getSerialize(model, key)) {
				return;
			}

			var obj = <any>model;

			// Delete the property
			delete (<any>obj)[key];

			// the backing property for getter setter
			obj[`__${key}__`] = value;

			// Add a getter/setter with the same name
			Object.defineProperty(obj, key, {
				get: () => {
					return obj[`__${key}__`];
				},
				set: v => {
					const eventArgs = {
						propertyName: key,
						oldValue: obj[`__${key}__`],
						newValue: v
					};

					obj[`__${key}__`] = v;

					// Raise property change notification
					if (eventArgs.oldValue !== eventArgs.newValue) {
						model.propertyChangedSource.next(eventArgs);
					}
				},
				enumerable: true,
				configurable: false
			});
		});
	}
}
