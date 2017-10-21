import { OpaqueToken } from '@angular/core';

export let APP_RESOURCE = new OpaqueToken('app.resource');

export interface IDialogParams {
	Title: string;
	Body: string;
};

export interface IResource {
	ApplicationTitle: string;
	NoNetworkDialog: IDialogParams;
	TermsAndConditionsDialog: IDialogParams;
	SignOutDialog: IDialogParams;
	DeleteDashboardDialog: IDialogParams;
	UnSavedChangesDialog: IDialogParams;
	UserUnauthorizedDialog: IDialogParams;
	ApplicationErrorDialog: IDialogParams;
	DeleteObjectDialog: IDialogParams;
	SessionExpiredDialog: IDialogParams;
	DeleteObjectContainerDialog: IDialogParams;
	TableTemplateChangeDialog: IDialogParams;
	SessionTimoutDialog: IDialogParams;
	PlotGeneralTextDailog: IDialogParams;
	ExporterUnsupportedEntryDialog: IDialogParams;
};

export const RESOURCE: IResource = {
	ApplicationTitle: '<%= APP_TITLE %>',
	TermsAndConditionsDialog: {
		Title: 'Terms and Conditions',
		/* tslint:disable */
		Body: 'Halliburton Energy Services, Inc. will use its best efforts to furnish customers with accurate information and interpretations that are part of, and incident to, the services provided. However, Halliburton Energy Services, Inc. cannot and does not warrant the accuracy or correctness of such information and interpretations. Under no circumstances should any such information or interpretation be relied upon as the sole basis for any drilling, completion, production, or financial decision or any procedure involving any risk to the safety of any drilling venture, drilling rig or its crew or any other third party. The Customer has full responsibility for all drilling, completion and production operation. Halliburton Energy Services, Inc. makes no representations or warranties, either expressed or implied, including, but not limited to, the implied warranties of merchantability or fitness for a particular purpose, with respect to this software, the use of this software to display any information or data from any source, any interpretation based on such display, or the services rendered. In no event will Halliburton Energy Services, Inc. be liable for failure to obtain any particular results or for any damages, including, but not limited to, indirect, special or consequential damages, resulting from the use of this software, any information or data displayed or provided through the use of this software, or any interpretation provided by Halliburton Energy Services, Inc.'
		/* tslint:enable */
	},
	ExporterUnsupportedEntryDialog: {
		Title: 'Incompatible File Type',
		/* tslint:disable */
		Body: '$0 does not support all "Selected Variables" assigned for export. Please select "Continue" to export all valid "Selected Variables". Select "Cancel" to modify export settings.'
		/* tslint:enable */
	},
	UserUnauthorizedDialog: {
		Title: 'Unauthorized',
		/* tslint:disable */
		Body: 'User entitlements have been modified. Please sign in again. <p class="iw-inline-error">$0 <br>Please contact RTO for assistance.<br>USA: 1-877-263-6071 | International: +1 7138394315<br>Email: <a href ="mailto:RealTimeOperations@halliburton.com">RealTimeOperations@halliburton.com</a></p>'
		/* tslint:enable */
	},
	ApplicationErrorDialog: {
		Title: 'Error',
		/* tslint:disable */
		Body: 'An error has occured: <p class="iw-inline-error">$0 <br>Please contact RTO for assistance.<br>USA: 1-877-263-6071 | International: +1 7138394315<br>Email: <a href ="mailto:RealTimeOperations@halliburton.com">RealTimeOperations@halliburton.com</p>'
		/* tslint:enable */
	},
	SignOutDialog: {
		Title: 'Sign Out',
		Body: 'Are you sure you want to Sign Out? Any unsaved changes will be lost.'
	},
	NoNetworkDialog: {
		Title: 'No Internet',
		Body: 'Network not available'
	},
	DeleteDashboardDialog: {
		Title: 'Delete Dashboard',
		Body: 'Are you sure you want to permanently delete $0 dashboard?'
	},
	DeleteObjectDialog: {
		Title: 'Delete $1',
		Body: 'Are you sure you want to permanently delete the $0 $1 from the dashboard?'
	},
	DeleteObjectContainerDialog: {
		Title: 'Delete Object Container',
		Body: 'Are you sure you want to permanently delete the $0 Object Container from the dashboard?' +
		'<p>All Objects within the Object Container will be deleted.</p>'
	},
	UnSavedChangesDialog: {
		Title: 'Edit Dashbaord',
		Body: 'There are unsaved changes. Would you like to save all changes before continuing?'
	},
	SessionExpiredDialog: {
		Title: 'Session Expired',
		Body: 'Your session has expired. Please login again.'
	},
	TableTemplateChangeDialog: {
		Title: 'Change Template',
		Body: 'Are you sure you want to select a predefined template? All changes to the custom template will be lost.'
	},
	SessionTimoutDialog: {
		Title: 'Session Timeout',
		Body: 'Your session has expired. Please sign in again.'
	},
	PlotGeneralTextDailog: {
		Title: 'Text',
		Body: 'Description:$0'
	}
};

