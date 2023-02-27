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

// const fetch 			= require('node-fetch');

// Mixing Support
const RadioMixer 		= require('./RadioMixer');
const fs 				= require('fs');

const __project_root = __dirname + '/';

/* mixedStream is sent to every client to listen to */
var mixedStream = null;
var microphone_stream = null;

var radio_mixer = null;

var file1 = null;

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

app.get('/client', (req, res) => {
	res.sendFile('/client/index.html');
});

console.log('[1] Enabling stream.io...');

io.of("/console-communication").on("connection", (socket) => {

	console.log('[2] Connection with console');

	/* first event our server must receive (communication with the console) */
	ss(socket).on('console-sends-microphone-stream', (_microphone_stream, callback) => {

		console.log('[2.1] Received microphone stream');

		// save it as global variable
		microphone_stream = _microphone_stream;

		microphone_stream.on('data', (data) => {
			// console.log('got data!');
		});

		callback({});	// acknowledgement

		socket.on('buffer', (buffer) => {
			microphone_stream.push(buffer);
		});

		// now we can start communications with clients!
		io.of("/clients-communication").on("connection", (socket) => {

			console.log('[3] Connection with client');

			socket.on('client-requests-mixed-stream', () => {

				// TODO: this will be selected using the playlist in the future
				file1 = fs.createReadStream(__dirname + '/song1.wav');
				// TODO: fix for render.com! A good fix would be to stop using wav and switch to mp3!
				// file1 = ss.createStream();

				// create our mixer class & get output stream
				radio_mixer = new RadioMixer(microphone_stream, file1);
				// radio_mixer = new RadioMixer(microphone_stream, ss.createStream());

				// get mixedStream
				mixedStream = radio_mixer.outputStream();

				console.log('[3] Client requests mixed_stream');

				// send the output stream (mixed stream) to all clients that are asking for it!
				ss(socket).emit('server-sends-mixed-stream', mixedStream);
			});
		});
	});
});

server.listen(3000);