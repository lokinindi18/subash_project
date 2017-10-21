import {
	Component, AfterViewInit, ReflectiveInjector, ComponentFactoryResolver, ComponentRef,
	ViewChild, ViewContainerRef, OnInit, OnDestroy, Type
} from '@angular/core';
import { DashboardManagerService, IEditable } from './../../core/core';
import { Subscription } from 'rxjs/Subscription';

import { Model } from './../../core/core';

@Component({
	selector: 'iw-property-menu',
	moduleId: module.id,
	templateUrl: './property-menu.component.html',
	styleUrls: ['./property-menu.component.css'],
})
export class PropertyMenuComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild('menuContainer', { read: ViewContainerRef }) menuContainer: ViewContainerRef;

	private isMenuReady = false;
	private editingComponent: IEditable;
	private propertiesEditorRef: ComponentRef<any>;
	private selectedObjectChangedSubscription: Subscription;
	private editModeChangedSubscription: Subscription;

	private isCollapsed = false;
	private propertyType: string;

	constructor(private dashboardManagerService: DashboardManagerService,
		private componentFactoryResolver: ComponentFactoryResolver) {
	}

	ngOnInit() {
		this.selectedObjectChangedSubscription = this.dashboardManagerService.selectedObjectChangedEvent
			.subscribe((component: IEditable) => {
				this.editingComponent = component;
				this.loadPropertyEditor();
			});
		this.editModeChangedSubscription = this.dashboardManagerService.editModeChangedEvent
			.subscribe(isInEditMode => {
				this.isCollapsed = !isInEditMode;
			});

	}

	ngOnDestroy() {
		if (this.selectedObjectChangedSubscription) {
			this.selectedObjectChangedSubscription.unsubscribe();
		}
		if (this.editModeChangedSubscription) {
			this.editModeChangedSubscription.unsubscribe();
		}
	}

	ngAfterViewInit() {
		this.isMenuReady = true;
		this.loadPropertyEditor();
	}

	public toggleMenu() {
		this.isCollapsed = !this.isCollapsed;
		this.dashboardManagerService.setPropertyMenuPosition(this.isCollapsed);
	}

	loadPropertyEditor() {
		if (!this.isMenuReady || !this.editingComponent) {
			return;
		}

		this.propertyType = this.editingComponent.Model.Type + ' Properties';

		if (this.propertiesEditorRef) {
			this.propertiesEditorRef.destroy();
		}

		const providers = ReflectiveInjector.resolve([
			{provide: Model, useValue: this.editingComponent.Model},
			{ provide: Type, useValue: this.editingComponent}]);

		const injector = ReflectiveInjector.fromResolvedProviders(providers, this.menuContainer.parentInjector);

		let propertyComponentFactory = this.componentFactoryResolver.resolveComponentFactory(this.editingComponent.PropertiesEditorType);
		this.propertiesEditorRef = this.menuContainer.createComponent(propertyComponentFactory, this.menuContainer.length, injector);

		if (this.propertiesEditorRef.instance.close) {
			this.propertiesEditorRef.instance.close.subscribe(() => {
				this.propertiesEditorRef.destroy();
			});
		}
	}
}
