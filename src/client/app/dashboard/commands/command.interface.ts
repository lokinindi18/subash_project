import { Observable } from 'rxjs/Observable';

export interface ICommand<TParam>{
	execute(param?: TParam): boolean | Observable<any>;
	canExecute(param?: TParam): boolean;
}
