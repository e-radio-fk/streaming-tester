//
// This is site's main
//

const express 			= require('express');
const app 				= express();
const server 			= require('http').Server(app);
const io 				= require('socket.io')(server, {
	cors: {
		origin: "https://e-radio-fk.onrender.com",
		methods: ["GET", "POST"]
	}
});

const ss 				= require('socket.io-stream');
const bodyParser 		= require('body-parser');

const __project_root = __dirname + '/';

/* project root */
app.use(express.static(__project_root));

/* 
 * Χρησιμοποιούμε αυτό το plugin για να 
 * μετατρέψουμε το body των POST requests
 * από JSON σε μεταβλήτές πιο εύκολα
 */
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

console.log('[1] Enabling stream.io...');

server.listen(3000);