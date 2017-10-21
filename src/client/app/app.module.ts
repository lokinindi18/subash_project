import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { APP_RESOURCE, RESOURCE } from './app.resource';
import { NavbarComponent } from './components/navbar/index';
import { BannerbarComponent } from './components/bannerbar/index';
import { InSiteWebModalWindowComponent } from './shared/components/iw-modal-window/iw-modal-window.component';
import { CreateDashboardWindowComponent } from './dashboard/components/create-dashboard-dialog/create-dashboard-dialog.component';
import { FullPageWaitComponent } from './shared/components/full-page-wait/full-page-wait.component';
// import { ShowSpacesPipe } from './shared/pipes/show-spaces.pipe';
// import { BaseComponent } from './base/base.component';
import { COMPILER_PROVIDERS } from '@angular/compiler';

import {
  WaiWebService,
  ConfigService,
  RtDataHubService,
  RtsWebService,
  ApiWebService,
  SessionService,
  TimeZoneService,
  DialogService,
  KeepAliveService,
  WaiWebServiceMock,
  RtsWebServiceMock,
  RtDataHubServiceMock,
  LoggingService
} from './shared/services/services';
import { HomeModule } from './home/home.module';
import { JobsModule } from './jobs/jobs.module';
import { SharedModule } from './shared/shared.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';
import { AccordionModule } from './shared/components/accordion/accordion';

var useMockData = false;         //set as true to use RtMockdata
var useMockLogin = false;      //set as true to use the MockLogin and to get jobs
const RtService = useMockData ? RtDataHubServiceMock : RtDataHubService;
const WaiService = useMockLogin ? WaiWebServiceMock : WaiWebService;
const RtWebService = useMockLogin ? RtsWebServiceMock : RtsWebService;

@NgModule({
  imports: [BrowserModule
    , ReactiveFormsModule
    , FormsModule
    , HttpModule
    , RouterModule.forRoot(routes, {useHash: true})
    , HomeModule
    , JobsModule
    , DashboardModule
    , AccordionModule
    // , NavbarComponent
    // , BannerbarComponent
    , ModalModule.forRoot()
    , BootstrapModalModule
    , SharedModule.forRoot()],
  declarations: [AppComponent, NavbarComponent, BannerbarComponent
    , InSiteWebModalWindowComponent, FullPageWaitComponent
    , CreateDashboardWindowComponent
  ],
  providers: [{
    provide: APP_BASE_HREF,
    useValue: '<%= APP_BASE %>'
  },
  {
    provide: APP_RESOURCE,
    useValue: RESOURCE
  }
    , COMPILER_PROVIDERS
    ,
  {
    provide: WaiWebService,
    useClass: WaiService
  }
    , ConfigService
    ,
  {
    provide: RtDataHubService,
    useClass: RtService
  }
    ,
  {
    provide: RtsWebService,
    useClass: RtWebService
  }
    , ApiWebService
    , SessionService
    , TimeZoneService
    , DialogService
    , KeepAliveService
    , LoggingService],
  bootstrap: [AppComponent],
  entryComponents: [InSiteWebModalWindowComponent
    , FullPageWaitComponent
    , CreateDashboardWindowComponent
  ]
})
export class AppModule { }
