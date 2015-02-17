/**
 * Created by ppeccin on 16/12/2014.
 */

function Speaker() {

    this.connect = function(pAudioSignal) {
        audioSignal = pAudioSignal;
        audioSignal.connectMonitor(this);
    };

    this.powerOn = function() {
        createAudioContext();
        if (!audioContext) return;

        processor = audioContext.createScriptProcessor(JavatariParameters.AUDIO_BUFFER_SIZE, 0, 1);
        processor.onaudioprocess = onAudioProcess;
        processor.connect(audioContext.destination);
    };

    this.powerOff = function() {
        if (processor) processor.disconnect();
        audioContext = undefined;
    };

    var createAudioContext = function() {
        try {
            audioContext = new AudioContext();
            resamplingFactor = TiaAudioSignal.SAMPLE_RATE / audioContext.sampleRate;
            console.log(">>> Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            console.log(">>> Audio resampling factor: " + (1/resamplingFactor));
        } catch(e) {
            console.log(">>> Could not create AudioContext. Sound disabled.");
        }
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

}