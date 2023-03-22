import io from "socket.io-client";
import ss from "socket.io-stream";

function PCMPlayer(t){this.init(t)}PCMPlayer.prototype.init=function(t){this.option=Object.assign({},{encoding:"16bitInt",channels:1,sampleRate:8e3,flushingTime:1e3},t),this.samples=new Float32Array,this.flush=this.flush.bind(this),this.interval=setInterval(this.flush,this.option.flushingTime),this.maxValue=this.getMaxValue(),this.typedArray=this.getTypedArray(),this.createContext()},PCMPlayer.prototype.getMaxValue=function(){var t={"8bitInt":128,"16bitInt":32768,"32bitInt":2147483648,"32bitFloat":1};return t[this.option.encoding]?t[this.option.encoding]:t["16bitInt"]},PCMPlayer.prototype.getTypedArray=function(){var t={"8bitInt":Int8Array,"16bitInt":Int16Array,"32bitInt":Int32Array,"32bitFloat":Float32Array};return t[this.option.encoding]?t[this.option.encoding]:t["16bitInt"]},PCMPlayer.prototype.createContext=function(){this.audioCtx=new(window.AudioContext||window.webkitAudioContext),this.gainNode=this.audioCtx.createGain(),this.gainNode.gain.value=1,this.gainNode.connect(this.audioCtx.destination),this.startTime=this.audioCtx.currentTime},PCMPlayer.prototype.isTypedArray=function(t){return t.byteLength&&t.buffer&&t.buffer.constructor==ArrayBuffer},PCMPlayer.prototype.feed=function(t){if(this.isTypedArray(t)){t=this.getFormatedValue(t);var e=new Float32Array(this.samples.length+t.length);e.set(this.samples,0),e.set(t,this.samples.length),this.samples=e}},PCMPlayer.prototype.getFormatedValue=function(t){t=new this.typedArray(t.buffer);var e,i=new Float32Array(t.length);for(e=0;e<t.length;e++)i[e]=t[e]/this.maxValue;return i},PCMPlayer.prototype.volume=function(t){this.gainNode.gain.value=t},PCMPlayer.prototype.destroy=function(){this.interval&&clearInterval(this.interval),this.samples=null,this.audioCtx.close(),this.audioCtx=null},PCMPlayer.prototype.flush=function(){if(this.samples.length){var t,e,i,n,a,s=this.audioCtx.createBufferSource(),r=this.samples.length/this.option.channels,o=this.audioCtx.createBuffer(this.option.channels,r,this.option.sampleRate);for(e=0;e<this.option.channels;e++)for(t=o.getChannelData(e),i=e,a=50,n=0;n<r;n++)t[n]=this.samples[i],n<50&&(t[n]=t[n]*n/50),r-51<=n&&(t[n]=t[n]*a--/50),i+=this.option.channels;this.startTime<this.audioCtx.currentTime&&(this.startTime=this.audioCtx.currentTime),console.log("start vs current "+this.startTime+" vs "+this.audioCtx.currentTime+" duration: "+o.duration),s.buffer=o,s.connect(this.gainNode),s.start(this.startTime),this.startTime+=o.duration,this.samples=new Float32Array}};

try
{
    // get current url (the server is running on same domain!)
    const server_url = window.location.origin;

    /*
     *  Establish connection with the server
     */
    const socket = io.connect(server_url + '/clients-communication', { withCredentials: true });

    var mixed_stream;
    
    socket.on('server-sends-not-ready-yet', () => {
        alert('Server is not ready! Please retry in a fair bit!');
        throw new Error("server not ready!");
    });

    // add handler for getting mixed-stream
    ss(socket).on('server-sends-mixed-stream', (_mixed_stream) => {

        // TODO: add a timeout here.  if we get no reply, schedule a retry...

        alert('got the mixed_stream!');

        mixed_stream = _mixed_stream;
    });

    // request mixed-stream
    socket.emit('client-requests-mixed-stream');

    //
    // play button
    //
    var play_button = document.getElementsByClassName('play-button')[0];
    if (!play_button)
    {
        throw new Error('Error getting play-button element!');
    }
    play_button.setAttribute('playing', 'no');

    var player = new PCMPlayer({
        encoding: '16bitInt',
        channels: 2,
        sampleRate: 44100,
        flushingTime: 500
    });

    //
    // attach a handler to the play-button
    //
    /*
     * upon receiving microphone data chunks we must play it (but only if the play-button is ON)
     * Warning: Browsers force us to have this handler inside the event-listener because of Autoplay
    */
    play_button.addEventListener('click', event => {
        if (play_button.getAttribute('playing') == 'yes') 
        {
            play_button.setAttribute('playing', 'no');
            play_button.style.backgroundImage = "url('../img/play.png')";

            // TODO: implement stopping sound!
            socket.removeAllListeners();
        }
        else if (play_button.getAttribute('playing') == 'no')
        {
            play_button.setAttribute('playing', 'yes');
            play_button.style.backgroundImage = "url('../img/pause.png')";

            mixed_stream.on('data', (pcm_data) => {
                // Now feed PCM data into player getting from websocket or ajax whatever the transport you are using.
                player.feed(pcm_data);
            });
        }
    });
}
catch (e)
{
    console.error(e);
}