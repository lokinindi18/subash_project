// import {
// 	it,
// 	describe,
// 	expect,
// 	inject,
// 	beforeEachProviders,
// 	beforeEach,
// 	async,

// } from '@angular/core/testing';

// import { provide } from '@angular/core';
// // import { setBaseTestProviders } from '@angular/core/testing';
// import {HTTP_PROVIDERS, XHRBackend, Response, ResponseOptions, BaseRequestOptions, Http} from '@angular/http';
// import {MockBackend, MockConnection} from '@angular/http/testing';
// import {SessionService} from  './../../../shared/services/session.service';
// import {RtsWebService} from './../../../shared/services/services';
// import {SerializerService} from './serializer.service';
// import {MockSessionService} from './../../../shared/services/session.mock';


// // import {
// // 	TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS,
// // 	TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
// // } from '@angular/platform-browser-dynamic/testing';

// import {DashboardDataService} from './dashboard-data.service';

// // setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);

// export function main() {
// 	describe('Dashboard data Service Sample', () => {
// 		it('should make service work', () => {
// 			expect(true).toBe(true);
// 		});
// 	});
// 	describe('Dashboard data Service', () => {
// 		var dashboardDataService: DashboardDataService;
// 		var mockBackend: MockBackend;

// 		//Injected service. 
// 		beforeEachProviders(() => [
// 			DashboardDataService,
// 			RtsWebService,
// 			SerializerService,
// 			HTTP_PROVIDERS,
// 			provide(SessionService, { useClass: MockSessionService }),
// 			BaseRequestOptions,
// 			XHRBackend,
// 			MockBackend,
// 			provide(Http, {
// 				useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
// 					return new Http(backend, defaultOptions);
// 				},
// 				deps: [MockBackend, BaseRequestOptions]
// 			})
// 		]);

// 		var setCurrentDashboard = (dds: DashboardDataService) => {
// 			dds.setCurrentJob({
// 				m_AllowAllWells: '',
// 				Customer: '',
// 				m_DataServerType: '',
// 				m_DataServerVersion: '',
// 				m_InsiteDB: '',
// 				JobName: '',
// 				m_JobType: '',
// 				LogUids: [],
// 				m_LoggingServer: {
// 					id: 0,
// 					externalServerIP: '',
// 					httpPort: 0,
// 					httpsPort: 0,
// 					internalServerIP: '',
// 					isOAG: false,
// 					mobileVersion: '',
// 					serverName: '',
// 					webServciesPort: 0,
// 				},
// 				m_MobilePDTNames: [],
// 				m_MobileServer: {
// 					id: 0,
// 					externalServerIP: '',
// 					httpPort: 0,
// 					httpsPort: 0,
// 					internalServerIP: '',
// 					isOAG: false,
// 					mobileVersion: '',
// 					serverName: '',
// 					webServciesPort: 0,
// 				},
// 				PSLName: '',
// 				m_PlotServer: {
// 					id: 0,
// 					externalServerIP: '',
// 					httpPort: 0,
// 					httpsPort: 0,
// 					internalServerIP: '',
// 					isOAG: false,
// 					mobileVersion: '',
// 					serverName: '',
// 					webServciesPort: 0,
// 				},
// 				UnitSet: '',
// 				m_WebServer: {
// 					id: 0,
// 					externalServerIP: '',
// 					httpPort: 0,
// 					httpsPort: 0,
// 					internalServerIP: '',
// 					isOAG: false,
// 					mobileVersion: '',
// 					serverName: '',
// 					webServciesPort: 0,
// 				},
// 				WellName: '',
// 				WellUid: '',
// 			});
// 		};


// 			beforeEach(inject([MockBackend, DashboardDataService], (md: MockBackend, dds: DashboardDataService) => {
// 				dashboardDataService = dds;
// 				mockBackend = md;
// 				setCurrentDashboard(dashboardDataService);
// 			}));

// 		it('Should SaveDashboard', async(() => {
// 			const baseResponse = new Response(new ResponseOptions({
// 				body: JSON.stringify({
// 					Id: 1,
// 					IsDefault: false,
// 					Name: 'Name2',
// 					Type: '',
// 					Objects: []
// 				})
// 			}));
// 			mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(baseResponse));
// 			dashboardDataService.saveDashboard({
// 				Id: 0,
// 				IsDefault: false,
// 				Name: 'Name1',
// 				Type: '',
// 				Objects: []
// 			}).subscribe(res => {
// 				expect(res.Name).toBe('Name1');
// 			});



// 			it('should loadDashboards', () => {
// 				const baseResponse = new Response(new ResponseOptions({
// 					body: JSON.stringify([{
// 						Name: 'Name',
// 						Id: 0,
// 						Dashboard: {
// 							Name: 'Name1',
// 							Id: 1,
// 							IsDefault: false,
// 							Objects: [],
// 							Type: 'Dashboard'
// 						},
// 						IsDefault: true,
// 					}])
// 				}));
// 				mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(baseResponse));
// 				dashboardDataService.loadDashboards();
// 				expect(dashboardDataService.dashboards.length).toBe(1);

// 			});
// 		}));
// 	});
// }
export function main() {
	console.log('test');
}
