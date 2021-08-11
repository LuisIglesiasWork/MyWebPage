const express = require('express');
const app = express();

//capturamos los Datos del Formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Variables de entorno
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'})

//directorio Public
app.use('/resources', express.static('public/'));
app.use('/resources', express.static(__dirname + '/public'));

//motor de plantilla
app.set('view engine', 'ejs');

//modulo bcryptjs
const bcryptjs = require('bcryptjs');

//Variables de Session
const session = require('express-session');
app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:true
}));

//Conexion Base de datos
const connection = require('./database/db');

//estableciendo las rutas

/*app.get('/', (req, res)=>{
    res.render('index', {msg:'Esto es un mensaje desde node'});
})*/

app.get('/login', (req, res)=>{
    res.render('login');
});

app.get('/register',(req, res)=>{
    res.render('register');
});

//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res)=>{
	const user = req.body.user;
	const name = req.body.name;
    const rol = req.body.rol;
	const pass = req.body.pass;
	let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{ nickname:name, password:passwordHash, user:user, roll:rol}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Registration",
				alertMessage: "¡Successful Registration!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
            //res.redirect('/');         
        }
	});
})

//Note: The Query results need to match the Database column name
app.post('/auth', async(req, res)=>{
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8); //desencryptado de la password.
    if(user && pass){
        connection.query('SELECT * FROM users WHERE user = ?', [user], async(error, results)=>{
            if(results.length == 0 ||!(await bcryptjs.compare(pass, results[0].password))){
                res.render('login',{
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o Password incorrectos.",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: null,
                    ruta: 'login'
                });
            }else{
                req.session.loggedin = true;
                req.session.name = results[0].nickname;
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexion Exitosa",
                    alertMessage: "¡LOGIN CORRECTO!",
                    alertIcon: 'success',
                    showConfirmButton: null,
                    timer: 1500,
                    ruta: ''
                });
            }
        })
    }
    else {	
		res.send('Please enter user and Password!');
		res.end();
	}
});

app.get('/', (req, res)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('index',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
	res.end();
});

//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
	})
});

app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
});