import { ViewFactoryService } from './view-factory.service';
import { DashboardContainerComponent } from '../../components/dashboard-containers/dashboard-container.component';

export function main() {
	describe('Test cases for ViewFactoryService', () => {
		let viewFactoryService: any = new ViewFactoryService();
		let component = DashboardContainerComponent;

		it('should be able to register the component View', () => {
			viewFactoryService.registerView(DashboardContainerComponent);
			expect(viewFactoryService.register['Container']).toEqual(component);
		});

		it('should be able to retrive the component View for the given View Name', () => {
			let viewType = viewFactoryService.getViewType('Container');
			expect(viewType).toEqual(component);
		});

		it('should be able to retrive the registered component View Names', () => {
			let registerViewNames = viewFactoryService.getRegisteredViewNames();
			expect(registerViewNames[0]).toEqual('Container');
		});
	});
}
