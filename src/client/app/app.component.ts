// import { Config } from './shared/index';
import { Component } from '@angular/core';
import './operators';

/**
 * This class represents the main application component. Within the @Routes annotation is the configuration of the
 * applications routes, configuring the paths for the lazy loaded components (HomeComponent, AboutComponent).
 */
@Component({
  moduleId: module.id,
  selector: 'iw-app',
  templateUrl: 'app.component.html',
  styleUrls:['./app.component.css'],
})

export class AppComponent {}
