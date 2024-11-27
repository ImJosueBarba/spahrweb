import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(public authService: AuthService, private router: Router) {}


  logout(): void {
    this.authService.logout();  // Llama al método logout del servicio
    this.router.navigate(['/login']);  // Redirige al login después de cerrar sesión
  }

}
