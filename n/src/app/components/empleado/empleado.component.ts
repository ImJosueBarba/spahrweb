import { Component } from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-empleado',
  templateUrl: './empleado.component.html',
  styleUrls: ['./empleado.component.css']
})
export class EmpleadoComponent {
  jobs: any[] = [];
  departments: any[] = [];
  empleados: any[] = [];
  empleado = {
    employee_id: '',
    first_name: '',
    salary: '',
    commission_pct: '',
    last_name: '',
    email: '',
    phone_number: '',
    hire_date: '',
    manager_id: '',
    department_id: '',
    job_id: ''
  };
  isUpdating = false;  
  isDeleting = false; 

  constructor(private employeeService: EmpleadosService) {}


  ngOnInit(): void {
    this.cargarJobs();
    this.cargarDepartments();
    this.cargarEmpleados();
  }
  exportToCSV(): void {
    this.employeeService.exportToCSV().subscribe(
      (data) => {
        const blob = new Blob([data], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'empleados.csv';
        link.click();
      },
      (error) => {
        console.error('Error al exportar empleados', error);
      }
    );
  }

  importFromCSV(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.employeeService.importFromCSV(file).subscribe(
        (response) => {
          console.log('Empleados importados correctamente');
          this.cargarEmpleados(); // Recargar la lista de empleados
        },
        (error) => {
          console.error('Error al importar empleados', error);
        }
      );
    }
  }

  cargarEmpleados(): void {
    this.employeeService.getEmpleados().subscribe(
      (data) => {
        this.empleados = data;
      },
      (error) => {
        console.error('Error al cargar empleados', error);
      }
    );
  }

  cargarJobs(): void {
    this.employeeService.getJobs().subscribe(data => {
      this.jobs = data;
    });
  }

  cargarDepartments(): void {
    this.employeeService.getDepartments().subscribe(data => {
      this.departments = data;
    });
  }


  getFilteredManagers() {
    return this.empleados.filter(emp => emp.employee_id !== this.empleado.employee_id);
  }

  onInsert(): void {
    this.isUpdating = false;
    this.isDeleting = false;
    this.resetForm(); 
  }

  onSubmit(): void {
    if (this.isUpdating) {
      this.onUpdate(); 
    } else if (this.isDeleting) {
      this.onDelete(); 
    } else {
      this.employeeService.addEmpleado(this.empleado).subscribe(
        (data) => {
          this.empleados.push(data); 
          this.resetForm();
        },
        (error) => {
          console.error('Error al agregar empleado', error);
        }
      );
    }
  }

  onUpdate(): void {
    this.employeeService.updateEmpleado(this.empleado).subscribe(
      (data) => {
        this.cargarEmpleados();  
        this.resetForm(); 
        this.isUpdating = false; 
      },
      (error) => {
        console.error('Error al actualizar empleado', error);
      }
    );
  }

  onDelete(): void {
    this.employeeService.deleteEmpleado(this.empleado.employee_id).subscribe(
      () => {
        this.cargarEmpleados();  // Recargar la lista de empleados después de eliminar
        this.resetForm();
        this.isDeleting = false;  
        Swal.fire({
          icon: 'success',
          title: 'Empleado eliminado',
          text: 'El empleado ha sido eliminado correctamente.'
        });
      },
      (error) => {
        console.error('Error al eliminar empleado', error);
        // Manejo del error de clave foránea
        if (error.status === 400 && error.error === 'El empleado está relacionado con otros registros y no puede ser eliminado') {
          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: 'Este empleado está relacionado con otros registros y no puede ser eliminado.'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: 'Hubo un problema al eliminar el empleado. Por favor, intenta nuevamente.'
          });
        }
      }
    );
  }
  

  onEdit(empleado: any): void {
    this.empleado = { ...empleado }; 
    this.isUpdating = true;
    this.isDeleting = false;
  }

  onDeleteEmployee(empleado: any): void {
    this.empleado = { ...empleado };
    this.isUpdating = false;
    this.isDeleting = true;
  }

  resetForm(): void {
    this.empleado = {
      employee_id: '',
      first_name: '',
      salary: '',
      commission_pct: '',
      last_name: '',
      email: '',
      phone_number: '',
      hire_date: '',
      manager_id: '',
      department_id: '',
      job_id: ''
    };
  }
}
