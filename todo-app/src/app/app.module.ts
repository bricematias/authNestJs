import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { MatToolbarModule } from '@angular/material/toolbar'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { ConnexionComponent } from './components/connexion/connexion.component'
import { TasksComponent } from './components/tasks/tasks.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NavbarComponent } from './components/navbar/navbar.component'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
    declarations: [
        AppComponent,
        ConnexionComponent,
        TasksComponent,
        NavbarComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatIconModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
