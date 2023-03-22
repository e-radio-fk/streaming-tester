const MicrophoneStream = require('microphone-stream').default;
const bufferFrom = require('buffer-from');
const {Transform} = require('stream');

const micStream = new MicrophoneStream();

function show_error(str, err)
{
    alert(err);
}

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

// convert to 16bitInt
function floatTo16BitPCM(input) {
    var output = new DataView(new ArrayBuffer(input.length * 2)); // length is in bytes (8-bit), so *2 to get 16-bit length
    for (var i = 0; i < input.length; i++) {
        var multiplier = input[i] < 0 ? 0x8000 : 0x7fff; // 16-bit signed range is -32768 to 32767
        output.setInt16(i * 2, (input[i] * multiplier) | 0, true); // index, value ("| 0" = convert to 32-bit int, round towards 0), littleEndian.
    }
    return bufferFrom(output.buffer);
};

const to16bitPCMTransform = new Transform({
    transform: (chunk, encoding, done) => {
        const raw = MicrophoneStream.toRaw(chunk);
        const result = floatTo16BitPCM(raw);
        done(null, result)
    }
});

/* initialise mic capture capability */
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(_audioStream => {

    // use this library to pipe to our socket.io-microphone-stream
    micStream.setStream(_audioStream);
    micStream.pipe(to16bitPCMTransform);
    to16bitPCMTransform.pipe(microphone_stream);

    // micStream.on('data', (data) => {
    //     var raw = MicrophoneStream.toRaw(data);
    //     var raw16 = floatTo16BitPCM(raw);
    //     microphone_stream.push(raw16);
    // })

    // TODO: find out why this never hits!
    // micStream.on('format', (format) => {
    //     console.log('got format:', format);
    // });

    // add handler for mic click
    document.getElementById('console-toggle-microphone').onclick = toggle_mic;

    ss(socket).emit('console-sends-microphone-stream', microphone_stream, (answer) => {
        // alert('ack!');
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