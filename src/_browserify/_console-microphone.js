const getUserMedia      = require('./lib/_get-user-media-promise');
const MicrophoneStream  = require('./lib/_microphone-stream').default;

const micStream = new MicrophoneStream();

/* get microphone button handle */
var microphoneButton = document.getElementById('console-toggle-microphone');
microphoneButton.style.disabled = 'true';
microphoneButton.setAttribute('on', 'no');

//
// Microphone Capture Code
//

const server_url = window.location.origin;

const socket = io.connect(server_url + '/console-communication', { withCredentials: true });

console.log(server_url + '/console-communication');

/* check if getUserMedia is available */
if (!navigator.mediaDevices.getUserMedia)
    show_error('Error: Unsupported feature getUserMedia()');

// our microphone stream; this will be sent over to the server containing manipulated data from audioStream
var microphone_stream = ss.createStream();

/* initialise mic capture capability */
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(_audioStream => {

    // use this library to pipe to our socket.io-microphone-stream
    micStream.setStream(_audioStream);
    micStream.pipe(microphone_stream);

    micStream.on('format', (format) => {
        console.log('got format:', format);
    });

    // add handler for mic click
    document.getElementById('console-toggle-microphone').onclick = toggle_mic;

    ss(socket).emit('console-sends-microphone-stream', microphone_stream, (answer) => {
        microphoneButton.style.disabled = 'false';
    });
})
.catch((err) => {
    show_error('Error: Microphone access has been denied probably!', err);
});

function toggle_mic()
{
    if (microphoneButton.getAttribute('on') == 'yes')
    {
        microphoneButton.setAttribute('on', 'no');
        microphoneButton.innerHTML = 'start mic';
    }
    else if (microphoneButton.getAttribute('on') == 'no') 
    {
        microphoneButton.setAttribute('on', 'yes');
        microphoneButton.innerHTML = 'stop mic';
    }
}