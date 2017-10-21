import { DashboardManagerService } from './dashboard-manager.service';
import { DashboardContainerModel } from '../../components/dashboard-containers/dashboard-container.model';
import { MockSerializerService } from './serializer.service.mock';
import { MockDialogService } from './../../../shared/services/services';
import { MockDashboardDataService } from './dashboard-data.service.mock';
import { DashboardModel } from './../data/dashboard.model';
import { PlotModel } from '../../objects/plot/plot.model';

export function main() {
	describe('Test cases for DashboardManagerService', () => {
		let dashboardManagerService: DashboardManagerService;
		let resource: any = { ApplicationErrorDialog: 'Dummy Test Dialog' };

		beforeEach(() => {
			const mockSerializerService = new MockSerializerService();
			const mockDashboardDataService = new MockDashboardDataService();
			const mockDialogService = new MockDialogService();
			dashboardManagerService = new DashboardManagerService(
				mockSerializerService,
				mockDashboardDataService,
				mockDialogService,
				resource
			);
		});

		it('should set currentDashboard and trigger dashboardChangedSource Event ', () => {
			let dashboardModel: any = { name: 'testDashboard' };
			let returnSourceValue = {};

			dashboardManagerService.dashboardChangedEvent.subscribe(
				(param => {
					returnSourceValue = param;
				})
			);

			dashboardManagerService.setCurrentDashboard(dashboardModel);
			expect(dashboardManagerService.currentDashboard).toEqual(dashboardModel);
			expect(dashboardModel).toEqual(returnSourceValue);
		});

		it('should delete the object and trigger deleteObjectSource Event ', () => {
			let deleteModel: DashboardModel = new DashboardModel();
			deleteModel.Name = 'TestModel';
			deleteModel.Objects = [];
			deleteModel.newName = 'TestModel';
			deleteModel.Type = 'Dashboard';
			dashboardManagerService.deleteObjectEvent
				.subscribe(model => {
					expect(model.Name).toEqual('TestModel');
					expect(model).toEqual(deleteModel);
				});
			dashboardManagerService.deleteObject(deleteModel);
		});

		it('should return the Dashboard Edit status either true or false ', () => {
			dashboardManagerService.isDashboardInEditMode = true;
			expect(dashboardManagerService.isDashboardInEditMode).toEqual(true);
		});

		it('should set the Dashboard Edit mode to true/false and trigger editModeChangedSource Event ', () => {
			dashboardManagerService.setDashboardMode(true);
			expect(dashboardManagerService.isDashboardInEditMode).toEqual(true);
			dashboardManagerService.editModeChangedEvent
				.subscribe(result => {
					expect(result).toEqual(true);
				});
		});

		it('should trigger wellInfoClickedSource Event ', () => {
			dashboardManagerService.setWellInfo(true);
			dashboardManagerService.wellInfoClickedEvent
				.subscribe(result => {
					expect(result).toEqual(true);
				});
		});

		it('should trigger objectPanelChangedSource Event ', () => {
			dashboardManagerService.objectPanelChanged('Gauge');
			dashboardManagerService.objectPanelChangedEvent
				.subscribe(result => {
					expect(result).toEqual('Gauge');
				});
		});

		it('should trigger globalMenuChangedSource Event ', () => {
			dashboardManagerService.setGlobalMenuPosition(false);
			dashboardManagerService.globalMenuChangedEvent
				.subscribe(result => {
					expect(result).toEqual(false);
				});
		});

		it('should trigger propertyMenuChangedSource Event ', () => {
			dashboardManagerService.setPropertyMenuPosition(true);
			dashboardManagerService.propertyMenuChangedEvent
				.subscribe(result => {
					expect(result).toEqual(true);
				});
		});

		it('should trigger wellInfoRefreshSource Event ', () => {
			dashboardManagerService.wellInfoRefresh(true);
			dashboardManagerService.wellInfoRefreshEvent
				.subscribe(result => {
					expect(result).toEqual(true);
				});
		});
		it('should set the clickedDBId and set the currentdashboard ', () => {
			dashboardManagerService.loadDashboard(0);
			expect(dashboardManagerService.clickedDBId).toEqual(0);
			expect(dashboardManagerService.currentDashboard).toBeNull();
		});

		it('should trigger selectedObjectMaxEvntSource Event ', () => {
			var plotModel: PlotModel = new PlotModel();
			plotModel.Tracks = [];
			plotModel.Name = 'TestPlot';
			dashboardManagerService.raiseSelectedObjectMaxSize(plotModel);
			dashboardManagerService.selectedObjectMaxEvent
				.subscribe(result => {
					expect(result.Name).toEqual('TestPlot');
				});
		});

		it('should trigger containerAutoModeSource Event ', () => {
			var plotModel = new PlotModel();
			plotModel.Type = 'Plot';
			plotModel.Tracks = [];
			plotModel.Name = 'TestPlot';
			dashboardManagerService.raiseContainerAutoMode(plotModel);
			dashboardManagerService.containerAutoModeEvent
				.subscribe(result => {
					expect(result.Name).toEqual('TestPlot');
				});
		});

		it('should trigger objectSelectedSource Event ', () => {
			dashboardManagerService.selectedObjectChanged(true);
			dashboardManagerService.objectSelectedEvent
				.subscribe(result => {
					expect(result).toEqual(true);
				});
		});

		it('should trigger addObjectSource Event ', () => {
			dashboardManagerService.addNewObject('Gauge');
			dashboardManagerService.addObjectEvent
				.subscribe(result => {
					expect(result).toEqual('Gauge');
				});
		});

		it('should trigger addObjectToContainerSource Event ', () => {
			var containerModel = new DashboardContainerModel();
			containerModel.Type = 'Container';
			containerModel.Objects = [];
			containerModel.Name = 'TestContainer';
			dashboardManagerService.addNewObjectToContainer(containerModel);
			dashboardManagerService.addObjectToContainerEvent
				.subscribe(result => {
					expect(result.Name).toEqual('TestContainer');
				});
		});
		it('should create a new dashboard ', () => {
			const obs = dashboardManagerService.createDashboard();
			expect(obs).not.toBeNull();
		});
		it('should revert a dashboard to its original state ', () => {
			let dbModel: DashboardModel = new DashboardModel();
			dbModel.Name = 'TestModel';
			dbModel.Objects = [];
			dbModel.newName = 'TestModel';
			dbModel.Type = 'Dashboard';
			dashboardManagerService.setCurrentDashboard(dbModel);
			dashboardManagerService.setDashboardMode(true);
			dashboardManagerService.currentDashboard.newName = 'NewName';
			dashboardManagerService.currentDashboard.Name = 'NewName';
			dashboardManagerService.revertDashboard();
			expect(dashboardManagerService.currentDashboard.Name).toEqual('TestModel');
		});

	});
}
