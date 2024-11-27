import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmpleadoComponent } from './components/empleado/empleado.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from '../app/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'empleados', component: EmpleadoComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
