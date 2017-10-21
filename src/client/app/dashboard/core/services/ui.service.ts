import { Injectable } from '@angular/core';
import { DragulaService } from 'ng2-dragula/ng2-dragula';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare var $: any;

interface IObjectResize {
	target: any;
	isPlotMinimized: boolean;
}

@Injectable()
export class UIService {
	public isEditModeEnabled: boolean = false;
	public plotResizeEvent: Observable<IObjectResize>;
	public containerResizeEvent: Observable<any>;

	private containerResizeSource = new Subject<any>();
	private plotResizeSource = new Subject<IObjectResize>();

	constructor(
		private dragulaService: DragulaService) {
		this.containerResizeEvent = this.containerResizeSource.asObservable();
		this.plotResizeEvent = this.plotResizeSource.asObservable();

		dragulaService.setOptions('container-bag', {
			revertOnSpill: true,
			removeOnSpill: false,
			moves: (el, container, handle) => {
				return this.isEditModeEnabled && ((handle.className === 'panel-heading')
					|| (handle.className === 'iw-model-name'));
			}
		});
		dragulaService.setOptions('object-bag', {
			revertOnSpill: true,
			removeOnSpill: false,
			moves: (el, container, handle) => {
				return this.isEditModeEnabled &&
					(handle.className.indexOf('iw-object-border dragdiv') !== -1);
			},
			accepts: (el, target, source, sibling) => {
				return this.isEditModeEnabled && target.name === source.name;
			}

		});
	}

	public setEditMode(editMode: boolean) {
		this.isEditModeEnabled = editMode;
	}
	public setDropSubscription() {
		return this.dragulaService.drop;
	}

	public attachContainerResizing() {
		$('.resizablediv').resizable({
			containment: '#maxwidth',
			handles: 'e, s',
			resize: (event: any, ui: any) => {
				if (event && event.target) {
					const target = event.target;
					if (ui.originalSize && ui.size) {
						if (ui.originalSize.height !== ui.size.height && (ui.originalSize.width >= ui.size.width)) {
							// When only height is decreased
							if (ui.size.height < ui.originalSize.height) {
								$('#maxwidth').width($('#maxwidth').width());//for giving width in pixel
								$(target).width($(target).width() + (ui.originalSize.height - ui.size.height));
								let currentWidth = $(target).children('.panel-body').width();
								if ($(target).width() >= $('#maxwidth').width() - 10) {
									currentWidth = $('#maxwidth').width() - 10;
								}
								$(target).width(currentWidth);
							} else {
								// When only height is increased
								$(target).width($(target).width() + (ui.originalSize.height - ui.size.height));
								$(target).width($(target).children('.panel-body').width());
							}
							// When width is changed (increased/decreased)
						} else if (ui.originalSize.width !== ui.size.width && (ui.originalSize.height >= ui.size.height)) {
							let currentWidth = $(target).children('.panel-body').width();
							$(target).width(currentWidth);
						}
						// In any of the case setting height as per height of panel body which holds all the inner objects
						let currentHeight = $(target).children('.panel-body').height() + 35;
						$(target).height(currentHeight);
					}
					this.containerResizeSource.next($(target));
				}
			},
			stop: (event: any, ui: any) => {
				if (event && event.target) {
					const target = event.target;
					// Setting height auto adjust so that next time object is added height is auto adjusted
					$(target).css({ 'height': 'auto' });
					// Resetting width to percentage as it was set in pixel while resizing
					$('#maxwidth').css('width', '98%');
				}
			}
		});
	}

	public removeContainerResizing() {
		if ($('.resizablediv').hasClass('ui-resizable')) {
			$('.resizablediv').resizable('destroy');
		}
	}

	public setContainerAutoSizeMode(currentElement?: any) {
		if (currentElement) {
			$(currentElement).closest('.resizablediv').css({ 'width': 'auto', 'height': 'auto' });
		}
	}

	public attachPlotResizing() {
		$('.resizableplot').resizable({
			aspectRatio: true,
			minWidth: 520,
			minHeight: 205,
			containment: '#maxwidth',
			handles: 'e, s',
			resize: (event: any, ui: any) => {
				if (event && event.target) {
					const target = event.target;
					let headerHeight = $(target).find('.header').height() + 65;
					$(target).find('.resizeplot').css({ 'width': ui.size.width - 20, 'height': ui.size.height - headerHeight });
				}
				this.plotResizeSource.next({
					target: $(event.target),
					isPlotMinimized: ui.size.width <= $('.resizableplot').resizable('option', 'minWidth')
					|| ui.size.height <= $('.resizableplot').resizable('option', 'minHeight')
				});
			}
		});
	}
	public removePlotResizing() {
		if ($('.resizableplot').hasClass('ui-resizable')) {
			$('.resizableplot').resizable('destroy');
		}
	}
	public setPlotContainerAutoSizeMode(currentElement?: any) {
		if (currentElement) {
			$(currentElement).closest('.resizableplot').css({ 'width': 'auto', 'height': 'auto' });
		}
	}
}
