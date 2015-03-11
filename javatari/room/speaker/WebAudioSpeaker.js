// Copyright 2015 by Paulo Augusto Peccin. See licence.txt distributed with this file.

function Speaker() {

    this.connect = function(pAudioSignal) {
        audioSignal = pAudioSignal;
        audioSignal.connectMonitor(this);
    };

    this.powerOn = function() {
        createAudioContext();
        if (!audioContext) return;

        processor = audioContext.createScriptProcessor(Javatari.AUDIO_BUFFER_SIZE, 0, 1);
        processor.onaudioprocess = onAudioProcess;
        processor.connect(audioContext.destination);
    };

    this.powerOff = function() {
        if (processor) processor.disconnect();
        audioContext = undefined;
    };

    var createAudioContext = function() {
        try {
            audioContext = new (window.AudioContext || window.WebkitAudioContext) ();
            resamplingFactor = TiaAudioSignal.SAMPLE_RATE / audioContext.sampleRate;
            Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            Util.log("Audio resampling factor: " + (1/resamplingFactor));
        } catch(e) {
            Util.log("Could not create AudioContext. Sound disabled: \n" + e.message);
        }
    };

    var onAudioProcess = function(event) {
        if (!audioSignal) return;

        // Assumes there is only one channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var input = audioSignal.retrieveSamples((outputBuffer.length * resamplingFactor) | 0);

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