import { QueryDashboardApi } from './../../../shared/services/web/insite-web.data';
import { Model } from './model';
import { Serialize } from './../services/serializer.service';
import * as _ from 'lodash';
@Serialize('Dashboard')
export class DashboardModel extends Model implements QueryDashboardApi.IDashboard {
	@Serialize() IsDefault: boolean = false;
	@Serialize() Objects: Model[] = [];
	@Serialize() Version: string;

	public newName: string;

	public static compare(a: DashboardModel, b: DashboardModel): number {
		if (a.IsDefault && !b.IsDefault) {
			return -1;
		}

		if (!a.IsDefault && b.IsDefault) {
			return 1;
		}

		if (a.Name.toLocaleLowerCase() < b.Name.toLocaleLowerCase()) {
			return -1;
		}

		if (a.Name.toLocaleLowerCase() > b.Name.toLocaleLowerCase()) {
			return 1;
		}

		return 0;
	}

	constructor() {
		super();
		this.Version = '3.0';
	}
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
	public resetDirty() {
		this._isDirty = false;

		this.Objects.forEach(o => o.resetDirty());
	}
}
