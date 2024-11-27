import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../app/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private apiUrlEmployees = 'http://localhost:3000/api/employees';
  private apiUrlJobs = 'http://localhost:3000/api/jobs';
  private apiUrlDepartments = 'http://localhost:3000/api/departments';
  private apiUrlExport = 'http://localhost:3000/api/employees/export';
  private apiUrlImport = 'http://localhost:3000/api/employees/import';
  constructor(private http: HttpClient, private authService: AuthService) {}

  exportToCSV(): Observable<any> {
    return this.http.get(this.apiUrlExport, { headers: this.getHeaders(), responseType: 'blob' });
  }

  importFromCSV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.apiUrlImport, formData, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlEmployees, { headers: this.getHeaders() });
  }

  getJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlJobs, { headers: this.getHeaders() });
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlDepartments, { headers: this.getHeaders() });
  }

  addEmpleado(empleado: any): Observable<any> {
    return this.http.post<any>(this.apiUrlEmployees, empleado, { headers: this.getHeaders() });
  }

  updateEmpleado(empleado: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrlEmployees}/${empleado.employee_id}`, empleado, { headers: this.getHeaders() });
  }

  deleteEmpleado(employeeId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrlEmployees}/${employeeId}`, { headers: this.getHeaders() });
  }
}
