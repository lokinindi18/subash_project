import { Model, Serialize } from './../../core/core';

import * as _ from 'lodash';

@Serialize('Container')
export class DashboardContainerModel extends Model {
	@Serialize() Name: string = 'Container';
	@Serialize() Objects: Model[] = [];
	@Serialize() ContainsType: string = null;

	public get IsValid(): boolean {
		return this._isValid && _.every(this.Objects, o => o.IsValid);
	}

	public set IsValid(valid: boolean) {
		this._isValid = valid;
	}

	public get IsDirty(): boolean {
		return this._isDirty || !_.every(this.Objects, o => !o.IsDirty);
	}

	public set IsDirty(dirty: boolean) {
		this._isDirty = dirty;
	}

	constructor() {
		super();
	}

	public resetDirty() {
		this._isDirty = false;

		this.Objects.forEach(o => o.resetDirty());
	}

}
