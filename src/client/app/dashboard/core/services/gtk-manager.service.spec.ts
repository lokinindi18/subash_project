import { GTKManagerService } from './gtk-manager.service';

export function main() {
	describe('Test cases for GTKManagerService', () => {

		let gtkService: GTKManagerService = null;

		beforeEach(() => {
			gtkService = new GTKManagerService();
		});

		it('should be able to lithPatternOrder length as zero', () => {
			gtkService.setLithPatterns(null);
			expect(gtkService.lithPatternOrder.length).toEqual(0);
		});

		it('should be able to set the lithPatternOrder', () => {
			const response = {
				'request': {
					'operation': '/api/v1/Wells/dad82aa3-e14c-3f56-b55b-803c7bad8722/LithPalette',
					'executiontime': 0.094
				},
				'response': {
					'uidWell': 'dad82aa3-e14c-3f56-b55b-803c7bad8722',
					'lithElements': [
						{
							'lithName': 'Andesite',
							'lithPattern': 'patt31',
							'lithForecolor': 'Lime',
							'lithBackcolor': 'White',
							'lithScale': 1.0,
							'lithLongNameOverrid': '',
							'lithShortNameOverride': '',
							'lithPatternImage': 'f3AADr6+vr6+sAAOvr6+vr6wAA3d3d3d3dAAD///AA='
						},
						{
							'lithName': 'Anhydrite',
							'lithPattern': 'patt63',
							'lithForecolor': 'Red',
							'lithBackcolor': 'White',
							'lithScale': 1.0,
							'lithLongNameOverride': '',
							'lithShortNameOverride': '',
							'lithPatternImage': 'f3AADr6+vr6+sAAOvr6+vr6wAA3d3d3d3dAADsDGHHhg27hcs///AA='
						}
					]
				}
			};
			gtkService.setLithPatterns(response);
			expect(gtkService.lithPatternOrder.length).toEqual(2);
		});
	});
}
