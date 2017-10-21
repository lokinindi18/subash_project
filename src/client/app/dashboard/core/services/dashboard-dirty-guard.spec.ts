import { DashboardDirtyGuard } from './dashboard-dirty-guard';
import { DashboardCanvasComponent } from './../../components/dashboard-canvas/dashboard-canvas.component';
import { TestBed, ComponentFixture } from '@angular/core/testing';

export function main() {
	describe('Test cases for DashboardDirtyGuard', () => {
		let dashboardDirtyGuard: DashboardDirtyGuard = new DashboardDirtyGuard();
		let fixture: ComponentFixture<DashboardCanvasComponent>;
		let cmp: DashboardCanvasComponent;

		it('should be able to call and return the component canDeactivate as boolean or Observable', () => {
			TestBed.configureTestingModule({
				declarations: [DashboardCanvasComponent],
			}).compileComponents()
				.then(() => {
					fixture = TestBed.createComponent(DashboardCanvasComponent);
					fixture.autoDetectChanges();
					cmp = fixture.componentInstance;
					let response = dashboardDirtyGuard.canDeactivate(cmp);
					expect(response).not.toBeNull();
				});
		});
	});
}
