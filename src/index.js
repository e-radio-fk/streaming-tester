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

// Mixing Support
const RadioMixer 		= require('./RadioMixer');
const fs 				= require('fs');

const __project_root = __dirname + '/';

/* mixedStream is sent to every client to listen to */
var mixedStream = null;
var microphone_stream = null;

var radio_mixer = null;

var file1 = null;

var _listening_for_clients = false;

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

	socket.on('disconnect', () => {
		// socket has been disconnected
		console.log('[-] Disconnected ', socket.id);
	});

	/* first event our server must receive (communication with the console) */
	ss(socket).on('console-sends-microphone-stream', (_microphone_stream, callback) => {

		console.log('[2.1] Received microphone stream');

		// save it as global variable
		microphone_stream = _microphone_stream;

		// acknowledgement
		callback({});

		// we can now start listening for clients!
		_listening_for_clients = true;
	});
});

// now we can start communications with clients!
io.of("/clients-communication").on("connection", (socket) => {

	if (!_listening_for_clients)
	{
		socket.emit('server-sends-not-ready-yet');
		socket.disconnect();
		return;
	}

	console.log('[3] Connection with client ', socket.id);

	socket.on('disconnect', () => {
		// socket has been disconnected
		console.log('[!] Disconnected ', socket.id);
	});

	socket.on('client-requests-mixed-stream', () => {

		console.log('[3.1] Client ', socket.id, ' requests mixed_stream');

		// TODO: this will be selected using the playlist in the future
		file1 = fs.createReadStream(__dirname + '/16bit_44100_stereo.wav');

		// -----------------------------------------------------------------------------------
		// TODO: fix for render.com! A good fix would be to stop using wav and switch to mp3!
		//			Maybe use https://github.com/mattdiamond/Recorderjs ???
		//			Or maybe, https://github.com/roren15/mp3-to-wav
		// ----------------------------------------------------------------------------------- 		
		// file1 = ss.createStream();
		// file2 = fs.createReadStream(__dirname + '/song2.wav');

		// create our mixer class & get output stream
		radio_mixer = new RadioMixer(microphone_stream, file1);
		// radio_mixer = new RadioMixer(microphone_stream, ss.createStream());
		// radio_mixer = new RadioMixer(file1, file2);

		// get mixedStream
		mixedStream = radio_mixer.outputStream();

		// Test4:
		// mixedStream = ss.createStream();
		// microphone_stream.pipe(mixedStream);

		// send the output stream (mixed stream) to all clients that are asking for it!
		ss(socket).emit('server-sends-mixed-stream', mixedStream);

		console.log('...sending!');
	});
});

server.listen(3000);