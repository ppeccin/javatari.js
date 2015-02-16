/**
 * Created by ppeccin on 16/12/2014.
 */

function Speaker() {

    function init() {
        audioContext = new AudioContext();
        console.log(">>> Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
    }

    this.connect = function(pAudioSignal) {
        audioSignal = pAudioSignal;
        audioSignal.connectMonitor(this);
        resamplingFactor = 31440 / 48000;
        console.log(">>> Audio resampling factor: " + (1/resamplingFactor));
    };

    this.powerOn = function() {
        processor = audioContext.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 0, 1);
        processor.onaudioprocess = onAudioProcess;
        processor.connect(audioContext.destination);
    };

    this.powerOff = function() {
        processor.disconnect();
        audioContext = undefined;
    };

    this.sampleRate = function() {
        return audioContext.sampleRate;
    };

    this.nextSamples = function(buffer, samples) {
        return 0;
    };

    this.synchOutput = function() {
    };

    var onAudioProcess = function(event) {
        if (!audioSignal) return;

        // Assumes there is only one channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var input = audioSignal.retrieveSamples(outputBuffer.length * resamplingFactor);

        Util.arrayCopyCircularSourceWithStep(
            input.buffer, input.start, input.bufferSize, resamplingFactor,
            outputBuffer, 0, outputBuffer.length
        );
    };


    var audioSignal;
    var resamplingFactor;

    var audioContext;
    var processor;

    var PROCESSOR_BUFFER_SIZE = 1024 * 1;


    init();

}