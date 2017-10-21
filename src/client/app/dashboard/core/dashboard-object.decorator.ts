const dashboardObjectMetadataKey = 'DashboardObjectMetadata';
declare var Reflect: any;

export function DashboardObject(metadata: IDashboardObjectMetadata) {
	return function (target: Function) {
		Reflect.defineMetadata(dashboardObjectMetadataKey, metadata, target);
	};
}

export function getDashboardObjectMetaData(target: Function) {
	return <IDashboardObjectMetadata>Reflect.getMetadata(dashboardObjectMetadataKey, target);
}

export interface IDashboardObjectMetadata {
	name: string;
}
