//
// Our own baked-in e-radio Mixer
//
'use strict';

const ss    = require('socket.io-stream');
const { Transform } = require('stream');

const a = require('audio-mixer').Mixer;

// class PCMStreamMixer extends Transform {
// 	constructor(options) {
// 		super(options);
// 	  }
	
// 	  _transform(chunk, encoding, callback) {

// 		console.log(chunk);

// 		// Process the chunk and mix the PCM streams
// 		// Implement your mixing logic here
// 		const mixedChunk = mixPCMStreams(chunk);
	
// 		this.push(mixedChunk);
// 		callback();
// 	}
// }

// function mixPCMStreams(chunk1, chunk2) {
// 	// Your mixing logic goes here
// 	// This is a simple example that just adds the samples together and
// 	// halves the result to avoid clipping. More advanced mixing techniques
// 	// may be required depending on your use case.
  
// 	const bufferLength = Math.min(chunk1.length, chunk2.length);
// 	const mixedBuffer = Buffer.alloc(bufferLength);
  
// 	for (let i = 0; i < bufferLength; i += 2) {
// 	  const sample1 = chunk1.readInt16LE(i);
// 	  const sample2 = chunk2.readInt16LE(i);
// 	  const mixedSample = (sample1 + sample2) / 2;
// 	  mixedBuffer.writeInt16LE(mixedSample, i);
// 	}
  
// 	return mixedBuffer;
// }

// class RadioMixer
// {
// 	constructor(_microphone_stream, _music_stream)
// 	{
// 		this.mixer = new PCMStreamMixer();
		
// 		this.microphone_stream = _microphone_stream;
// 		this.music_stream = _music_stream;
// 		this.mixedStream = ss.createStream();

// 		this.microphone_stream.pipe(this.mixer);
// 		this.music_stream.pipe(this.mixer);
// 		this.mixer.pipe(this.mixedStream);
// 	}

// 	outputStream()
// 	{
// 		return this.mixedStream;
// 	}
// }

const Mixer = require('audio-mixer').InterleavedMixer;		// node package to support mixing
// const Mixer = require('./scripts/lib/pcm-mixer').default;

class RadioMixer
{
	constructor(_microphone_stream, _music_stream)
	{
		this.microphone_stream = _microphone_stream;
		this.music_stream = _music_stream;

		// create a mixer object which does most of the work!
		this.mixer = new Mixer({
			channels: 2,
			bitDepth: 16,
			sampleRate: 44100,
			clearInterval: 100
		});

		//
		// create 2 inputs
		//
		this.input0 = this.mixer.input({
			    channels: 1,
			    bitDepth: 16,
				sampleRate: 44100
		});
		
		this.input1 = this.mixer.input({
			    channels: 2,
			    bitDepth: 16,
				sampleRate: 44100
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