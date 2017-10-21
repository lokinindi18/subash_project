import {Serialize} from './../services/serializer.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export abstract class Model {
	@Serialize() Id: number = null;
	@Serialize() Name: string = null;
	@Serialize() Type: string = null;
	@Serialize() Width: number = null;
	@Serialize() Height: number = null;
	@Serialize() isAutoResizeMode: boolean = true;
	@Serialize() isObjectMinimized: boolean = false;
	@Serialize() isCopied: boolean = false;

	protected _isValid = true;
	protected _isDirty = false;

	public get IsValid(): boolean {
		return this._isValid;
	}

	public set IsValid(valid: boolean) {
		this._isValid = valid;
	}

	public get IsCurrentModelValid(): boolean {
		return this._isValid;
	}

	public get IsDirty(): boolean {
		return this._isDirty;
	}

	public set IsDirty(dirty: boolean) {
		this._isDirty = dirty;
	}

	public propertyChangedEvent: Observable<IPropertyChangedEventArgs>;
	private propertyChangedSource = new Subject<IPropertyChangedEventArgs>();

	constructor() {
		this.propertyChangedEvent = this.propertyChangedSource.asObservable();
	}

	public resetDirty() {
		this._isDirty = false;
	}
}

export interface IPropertyChangedEventArgs {
	propertyName: string;
	oldValue: any;
	newValue: any;
}
