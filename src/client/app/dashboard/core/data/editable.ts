import { Type } from '@angular/core';
import { Model } from './model';

export interface IEditable {
	PropertiesEditorType: Type<any>;
	Model: Model;
	OnModelChange(): void;
}
