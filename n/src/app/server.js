const express = require('express');
const { Pool } = require('pg');
const cors = require("cors");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authenticateToken = require('../../src/app/middleware/auth');
const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());

const moment = require('moment'); 
const fastcsv = require("fast-csv");
const fs = require("fs");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


const pool = new Pool({
    host: '127.0.0.1',
    user: 'postgres',
    password: 'UTM123',
    database: 'hr',
    port: '5432'
});

app.get('/api/employees/export', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees');
        const employees = result.rows;

        const csvStream = fastcsv.format({ headers: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=empleados.csv');

        csvStream.pipe(res);

        employees.forEach(employee => {
            // Formateamos la fecha hire_date a 'YYYY-MM-DD'
            if (employee.hire_date) {
                employee.hire_date = new Date(employee.hire_date).toISOString().split('T')[0];
            }
            csvStream.write(employee);
        });

        csvStream.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al exportar los empleados');
    }
});

app.post('/api/employees/import', authenticateToken, upload.single('file'), (req, res) => {
    const file = req.file;
    const employees = [];

    fastcsv
        .parseFile(file.path, { headers: true, skipEmptyLines: true })
        .on('data', (row) => {
            Object.keys(row).forEach(key => {
                if (row[key] === '' || row[key] === undefined) {
                    row[key] = null;
                }
            });

            // Validación y formateo de la fecha 'hire_date'
            if (row.hire_date) {
                const isValidDate = moment(row.hire_date, ['YYYY-MM-DD', 'MM/DD/YYYY'], true).isValid();
                row.hire_date = isValidDate ? moment(row.hire_date).format('YYYY-MM-DD') : null;
            }

            employees.push(row);
        })
        .on('end', async () => {
            try {
                let errorMessages = [];
                let insertedEmployees = [];

                for (const employee of employees) {
                    try {
                        const result = await pool.query(
                            `SELECT 1 FROM employees WHERE employee_id = $1 LIMIT 1`,
                            [employee.employee_id]
                        );

                        if (result.rows.length === 0) {
                            // Si no existe el empleado, se inserta
                            await pool.query(
                                `INSERT INTO employees 
                                (first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [
                                    employee.first_name,
                                    employee.last_name,
                                    employee.email,
                                    employee.phone_number,
                                    employee.hire_date, 
                                    employee.job_id,
                                    employee.salary,
                                    employee.commission_pct,
                                    employee.manager_id,
                                    employee.department_id
                                ]
                            );
                            // Guardar los empleados insertados para mostrarlos
                            insertedEmployees.push(employee);
                        }
                    } catch (err) {
                        errorMessages.push({
                            employee: `${employee.first_name} ${employee.last_name || ''}`,
                            error: err.message
                        });
                    }
                }

                // Mostrar empleados insertados en consola
                if (insertedEmployees.length > 0) {
                    console.log('Empleados insertados:', insertedEmployees);
                } else {
                    console.log('No se insertaron empleados nuevos. Todos los empleados ya existen.');
                }

                // Enviar la respuesta solo con los empleados insertados
                res.status(200).send({
                    message: insertedEmployees.length > 0 ? 'Empleados insertados exitosamente.' : 'No se insertaron empleados nuevos. Todos los empleados ya existen.',
                    insertedEmployees: insertedEmployees
                });
            } catch (err) {
                console.error('Error en la importación de empleados:', err);
                res.status(500).send({
                    message: 'Error al importar empleados',
                    error: err.message
                });
            }
        })
        .on('error', (err) => {
            console.error('Error al procesar el archivo CSV:', err);
            if (!res.headersSent) { // Verificar si ya se ha enviado una respuesta
                res.status(500).send({
                    message: 'Error al procesar el archivo CSV',
                    error: err.message
                });
            }
        });
});





app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM login WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


app.get('/api/employees', authenticateToken, async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los empleados');
    }
});

app.get('/api/jobs', authenticateToken, async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM jobs');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los trabajos');
    }
});

app.get('/api/departments', authenticateToken, async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM departments');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los departamentos');
    }
});

app.get('/api/employees/:id', authenticateToken, async(req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Empleado no encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener el empleado');
    }
});

app.post('/api/employees', authenticateToken, async(req, res) => {
    const { first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO employees (first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`, [first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear el empleado');
    }
});

app.put('/api/employees/:employee_id', authenticateToken, async(req, res) => {
    const { employee_id } = req.params;
    const { first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE employees 
         SET first_name = $1, last_name = $2, email = $3, phone_number = $4, hire_date = $5, job_id = $6, salary = $7, commission_pct = $8, manager_id = $9, department_id = $10 
         WHERE employee_id = $11 RETURNING *`, [first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id, employee_id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Empleado no encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el empleado');
    }
});

app.delete('/api/employees/:employee_id', authenticateToken, async(req, res) => {
    const { employee_id } = req.params;
    try {
        const result = await pool.query('DELETE FROM employees WHERE employee_id = $1 RETURNING *', [employee_id]);
        if (result.rows.length > 0) {
            res.sendStatus(204);
        } else {
            res.status(404).send('Empleado no encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar el empleado');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});