import {
	Component, OnInit, Input, OnDestroy, AfterViewInit, ViewChild, ElementRef, Renderer
} from '@angular/core';
import { DashboardContainerModel } from './dashboard-container.model';
import { DashboardContainerPropertiesComponent } from './dashboard-container-properties.component';
import { Subscription } from 'rxjs/Subscription';
import {
	IEditable, DashboardManagerService,
	DashboardModel, Model, SerializerService, DashboardObject, UIService
} from './../../core/core';
import { LoggingService } from './../../../shared/services/services';
import { AddObjectCommand } from './../../commands/commands';

declare var $: any;
import * as _ from 'lodash';

@Component({
	selector: 'iw-dashboard-container',
	moduleId: module.id,
	templateUrl: './dashboard-container.component.html',
	styleUrls: ['./dashboard-container.component.css']
})

@DashboardObject({
	name: 'Container'
})
export class DashboardContainerComponent implements OnInit, OnDestroy, AfterViewInit, IEditable {
	// @ViewChild('objectContainer', { read: ViewContainerRef }) objectContainer: ViewContainerRef;
	@Input() public Model: DashboardContainerModel;

	public PropertiesEditorType = DashboardContainerPropertiesComponent;
	public isSelected: boolean = false;
	public isAutoMode: boolean = true;
	public isEditEnable: boolean = false;
	public isContainerEnlarged: boolean = false;
	public isPlotMinimized: boolean = false;
	public dashboardModel: DashboardModel;
	public currentDashBoard: DashboardModel;
	public objectPanelModel: Model;
	private addObjectSubscription: Subscription;
	private deleteObjectSubscription: Subscription;
	private manualResizeSubscription: Subscription;
	private editModeChangedSubscription: Subscription;
	private selectedContainerChangedSubscription: Subscription;
	private autoModeChangedSubscription: Subscription;
	private selectedObjectChangedSubscription: Subscription;
	private propertyMenuChangedSubscription: Subscription;
	private globalMenuChangedSubscription: Subscription;
	private containerZIndexChangedSubscription: Subscription;
	private plotResizeSubscription: Subscription;
	private globalListenFunc: Function;
	@ViewChild('panelBody') private panelElement: ElementRef;
	@ViewChild('containerParentBody') private containerParentElement: ElementRef;
	@ViewChild('containerBody') private containerElement: ElementRef;
	constructor(
		renderer: Renderer, public addCommand: AddObjectCommand,
		private uiService: UIService,
		private dashboardManagerService: DashboardManagerService,
		private serializerService: SerializerService,
		private loggingService: LoggingService) {
		this.isContainerEnlarged = !this.dashboardManagerService.isEditModeShown();
		this.deleteObjectSubscription = this.dashboardManagerService.deleteObjectEvent
			.subscribe(model => this.deleteSelectedObject(model));
		this.isEditEnable = this.dashboardManagerService.isDashboardInEditMode;
		this.selectedContainerChangedSubscription = this.dashboardManagerService.selectedObjectChangedEvent
			.subscribe((component: IEditable) => {
				this.isSelected = this === component;
			});
		this.globalListenFunc = renderer.listenGlobal('window', 'resize', (event: any) => {
			const onWindowResizing = 120;
			this.setContainerSize(onWindowResizing);
			// this.setContainerMax(this.Model);
		});
		this.autoModeChangedSubscription = this.dashboardManagerService.containerAutoModeEvent
			.subscribe(model => {
				if (model === this.Model.Objects[0]) {
					this.isAutoMode = model.isAutoResizeMode;
					this.Model.isAutoResizeMode = this.isAutoMode;
				}
			});
		this.editModeChangedSubscription = this.dashboardManagerService.editModeChangedEvent
			.subscribe(isChanged => {
				this.isContainerEnlarged = !isChanged;
				this.isEditEnable = isChanged;
				if (this.isEditEnable) {
					this.uiService.attachContainerResizing();
					this.uiService.attachPlotResizing();
					const onEditMode = 380;
					this.setContainerSize(onEditMode);
				} else {
					this.uiService.removeContainerResizing();
					this.uiService.removePlotResizing();
					const onEditModeChanged = 120;
					this.setContainerSize(onEditModeChanged, true, false);
				}
			});
		this.selectedObjectChangedSubscription = this.dashboardManagerService.selectedObjectChangedEvent
			.subscribe((component: IEditable) => {
				this.objectPanelModel = component.Model;
			});
	}

	ngOnInit() {
		this.addObjectSubscription = this.dashboardManagerService.addObjectToContainerEvent.subscribe(
			containerModel => {
				if (containerModel === this.Model) {
					this.loadObjectByModel(this.serializerService.deserialize({ Type: this.Model.ContainsType, Name: 'Undefined' }), true);
				}
			});
	}

	ngAfterViewInit() {
		_.forEach(this.Model.Objects, m => this.loadObjectByModel(m));

		this.addName(this.panelElement, `${this.Model.ContainsType}`);

		if (this.isEditEnable) {
			this.uiService.attachContainerResizing();
			this.uiService.attachPlotResizing();
		}
		this.propertyMenuChangedSubscription = this.dashboardManagerService.propertyMenuChangedEvent
			.subscribe(isCollapsed => {
				this.isContainerEnlarged = isCollapsed;
				if (isCollapsed) {
					const whenPropertyMenuCollapsed = 140;
					this.setContainerSize(whenPropertyMenuCollapsed, true, false);
				} else {
					const whenPropertyMenuOpen = 390;
					this.setContainerSize(whenPropertyMenuOpen);
				}
			});
		this.globalMenuChangedSubscription = this.dashboardManagerService.globalMenuChangedEvent
			.subscribe(isCollapsed => {
				this.isContainerEnlarged = isCollapsed;
				if (isCollapsed) {
					const whenGlobaledMenuCollapsed = 140;
					this.setContainerSize(whenGlobaledMenuCollapsed, false, true);
				} else {
					const whenGlobaledMenuOpen = 380;
					this.setContainerSize(whenGlobaledMenuOpen);
				}
			});

		this.manualResizeSubscription = this.uiService.containerResizeEvent
			.subscribe(target => {
				if ($(this.containerElement.nativeElement).closest('.resizeablediv').context ===
					target.context) {
					let iwDashboardWidth = document.body.clientWidth;

					let paddingSpace = 20;
					let globalmenuwidth = document.getElementById('globalmenu_width').offsetWidth;
					let propertiesPanelwidth = document.getElementById('properties_panel_width').offsetWidth;

					let total_width = iwDashboardWidth - (globalmenuwidth + propertiesPanelwidth + paddingSpace);
					let currentWidth = $(this.panelElement.nativeElement).width();
					let maxChildWidth = ($(this.panelElement.nativeElement).children().width()) * this.Model.Objects.length;
					if (maxChildWidth > total_width)
						maxChildWidth = total_width;
					if (currentWidth < maxChildWidth) {
						this.isAutoMode = false;
						this.Model.isAutoResizeMode = false;
						this.Model.Width = currentWidth;
					} else {
						this.Model.isAutoResizeMode = true;
						this.isAutoMode = true;
					}
				}
			});

		if (this.Model.ContainsType.indexOf('Plot') !== -1 && this.Model.ContainsType.indexOf('XY') === -1) {
			this.plotResizeSubscription = this.uiService.plotResizeEvent
				.subscribe((res) => {
					if ($(this.containerElement.nativeElement).closest('.resizableplot').context ===
						res.target.context) {
						this.isPlotMinimized = res.isPlotMinimized;
						this.Model.isObjectMinimized = this.isPlotMinimized;
					}
				});

			this.containerZIndexChangedSubscription = this.dashboardManagerService.containerZIndexChangedEvent
				.subscribe(res => {
					if (res.plotModel === this.Model.Objects[0]) {
						res.isOpen ? $(this.containerParentElement.nativeElement).closest('.iw-container-bringFront').css({ 'z-index': 1 }) :
							$(this.containerParentElement.nativeElement).closest('.iw-container-bringFront').css({ 'z-index': 0 });
					}
				});
			this.isPlotMinimized = this.Model.isObjectMinimized;
		}
		const loadFirstTimePadding = 120;
		this.setContainerSize(loadFirstTimePadding);
		this.isAutoMode = this.Model.isAutoResizeMode;
	}

	ngOnDestroy() {
		if (this.selectedContainerChangedSubscription) {
			this.selectedContainerChangedSubscription.unsubscribe();
		}
		if (this.selectedObjectChangedSubscription) {
			this.selectedObjectChangedSubscription.unsubscribe();
		}
		if (this.addObjectSubscription) {
			this.addObjectSubscription.unsubscribe();
		}
		if (this.editModeChangedSubscription) {
			this.editModeChangedSubscription.unsubscribe();
		}
		if (this.deleteObjectSubscription) {
			this.deleteObjectSubscription.unsubscribe();
		}
		if (this.autoModeChangedSubscription) {
			this.autoModeChangedSubscription.unsubscribe();
		}
		if (this.manualResizeSubscription) {
			this.autoModeChangedSubscription.unsubscribe();
		}
		if (this.plotResizeSubscription) {
			this.plotResizeSubscription.unsubscribe();
		}
		// _.each(this.Model.Objects, object => {
		//	 object = null;
		// });
		// this.Model.Objects = [];

		//for removing the attcaheventlistenner
		this.globalListenFunc();
	}

	isObjectSelected($event: any): boolean {
		if ($event.dragData.selectedModel) {
			return true;
		}
		return false;
	}

	OnModelChange() {
		this.loggingService.log('OnModelChange');
	}

	public showAddIcon(model: DashboardContainerModel) {
		if ((model.ContainsType === 'Table' || model.ContainsType.indexOf('Table') !== -1) && model.Objects.length !== 0) {
			return false;
		} else if ((model.ContainsType === 'XY Plot' || model.ContainsType.indexOf('XY Plot') !== -1) && model.Objects.length !== 0) {
			return false;
		} else if ((model.ContainsType === 'Plot' || model.ContainsType.indexOf('Plot') !== -1) && model.Objects.length !== 0) {
			return false;
		}
		return true;
	}

	public objectContainerSelected(event: MouseEvent) {
		this.dashboardManagerService.raiseSelectedObjectChanged(this);
		event.stopPropagation();
		this.dashboardManagerService.selectedObjectChanged(false);
	}

	public dataPanelSelected(event: MouseEvent) {
		this.dashboardManagerService.raiseSelectedObjectChanged(this);
		event.stopPropagation();
	}

	public setContainerMax(model: DashboardContainerModel) {
		this.isAutoMode = !this.isAutoMode;
		this.Model.isAutoResizeMode = this.isAutoMode;
		if (model.ContainsType.indexOf('XY Plot') !== -1 ||
			model.ContainsType.indexOf('Plot') !== -1 ||
			model.ContainsType.indexOf('Table') !== -1) {
			this.isPlotMinimized = false;
			this.Model.isObjectMinimized = this.isPlotMinimized;
			this.dashboardManagerService.raiseSelectedObjectMaxSize(model.Objects[0]);
		} else {
			this.uiService.setContainerAutoSizeMode(this.panelElement.nativeElement);
		}
	}

	private setContainerSize(paddingSpace, isGlobalMenuWidthRequired = true, isPropertyMenuWidthRequired = true) {
		let iwDashboardWidth = document.body.clientWidth;

		let globalmenuwidth = isGlobalMenuWidthRequired ?
			document.getElementById('globalmenu_width').offsetWidth : 0;

		let propertiesPanelwidth = isPropertyMenuWidthRequired ?
			document.getElementById('properties_panel_width').offsetWidth : 0;

		let total_width = iwDashboardWidth - (globalmenuwidth + propertiesPanelwidth + paddingSpace);

		if (this.Model.Width > total_width || this.Model.isAutoResizeMode) {
			this.uiService.setContainerAutoSizeMode(this.panelElement.nativeElement);
			this.Model.isAutoResizeMode = true;
		} else {
			$(this.panelElement.nativeElement).parent().width(this.Model.Width);
		}
	}

	private addName(el: ElementRef, name: string) {
		el.nativeElement.name = name;
	}

	private loadObjectByModel(model: Model, isNew = false, containerModel = this.Model) {
		if (isNew) {
			this.Model.Objects.push(model);
			this.Model.IsDirty = true;
		}
	}

	private deleteSelectedObject(model: Model) {
		if (model.Type === 'Container') {
			return;
		}
		_.pull(this.Model.Objects, model);
		this.Model.IsDirty = true;
		this.dashboardManagerService.raiseSelectedObjectChanged(this);
	}
}
