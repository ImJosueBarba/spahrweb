import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  
  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.authService.login({ username: this.username, password: this.password }).subscribe(
      (response) => {
        this.authService.saveToken(response.token);
        this.router.navigate(['/empleados']);
      },
      (error) => {
        this.errorMessage = 'Credenciales incorrectas';
      }
    );
  }
}
