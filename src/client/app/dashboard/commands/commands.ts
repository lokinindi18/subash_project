import { AddObjectCommand } from './add-object.command';
import { AddObjectContainerCommand } from './add-object-container.command';
import { CopyDashboardCommand } from './copy-dashboard.command';
import { DeleteDashboardCommand } from './delete-dashboard.command';
import { DeleteObjectCommand } from './delete-object.command';
import { EditDashboardCommand } from './edit-dashboard.command';
import { NewDashboardCommand } from './new-dashboard.command';
import { SaveDashboardCommand } from './save-dashboard.command';

export * from './add-object.command';
export * from './add-object-container.command';
export * from './copy-dashboard.command';
export * from './delete-dashboard.command';
export * from './delete-object.command';
export * from './edit-dashboard.command';
export * from './new-dashboard.command';
export * from './save-dashboard.command';

export let DASHBOARD_COMMANDS: any[] = [
	AddObjectCommand,
	AddObjectContainerCommand,
	CopyDashboardCommand,
	DeleteDashboardCommand,
	DeleteObjectCommand,
	EditDashboardCommand,
	NewDashboardCommand,
	SaveDashboardCommand,
];
