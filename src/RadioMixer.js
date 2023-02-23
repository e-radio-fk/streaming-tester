//
// Our own baked-in e-radio Mixer
//
'use strict';

const ss    = require('socket.io-stream');

const Mixer = require('audio-mixer').Mixer;		// node package to support mixing

class RadioMixer
{
	constructor(_microphone_stream, _music_stream)
	{
		this.microphone_stream = _microphone_stream;
		this.music_stream = _music_stream;

		// create a mixer object which does most of the work!
		this.mixer = new Mixer({
			channels: 1
		});

		//
		// create 2 inputs
		//
		this.input0 = this.mixer.input({
			    channels: 1,
			    bitDepth: 16,
			    sampleRate: 500,
		});
		
		this.input1 = this.mixer.input({
			    channels: 1,
			    bitDepth: 16,
			    sampleRate: 500,
		});

		// the output stream
		this.mixedStream = ss.createStream();

		// configure stream piping (like an audio graph)
		this.microphone_stream.pipe(this.input0);
		this.music_stream.pipe(this.input1);
		this.mixer.pipe(this.mixedStream);
	}

	outputStream()
	{
		return this.mixedStream;
	}
}

module.exports = RadioMixer;