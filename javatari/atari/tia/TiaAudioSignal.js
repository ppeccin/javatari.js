/**
 * Created by ppeccin on 30/11/2014.
 */

function TiaAudioSignal() {

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.getChannel0 = function() {
        return channel0;
    };

    this.getChannel1 = function() {
        return channel1;
    };

    this.clockPulse = function() {
        if (frameSamples < samplesPerFrame)
            generateNextSamples(1);
    };

    this.signalOn = function() {
        signalOn = true;
    };

    this.signalOff = function() {
        signalOn = false;
        channel0.setVolume(0);
        channel1.setVolume(0);
    };

    this.setFps = function(fps) {
        // Normal amount is 2 sample per scanline = 31440, 524 for NTSC(60Hz) and 624 for PAL(50hz)
        // Calculate total samples per frame based on fps
        samplesPerFrame = Math.round(TiaAudioSignal.SAMPLE_RATE / fps);
        if (samplesPerFrame > MAX_SAMPLES) samplesPerFrame = MAX_SAMPLES;
    };

    this.finishFrame = function() {
        var missingSamples = samplesPerFrame - frameSamples;
        if (missingSamples > 0) generateNextSamples(missingSamples);
        frameSamples = 0;
    };

    this.retrieveSamples = function(quant) {
        // console.log(">>> Samples generated: " + (generatedSamples - retrievedSamples));

        var missing = generatedSamples >= retrievedSamples
            ? quant - (generatedSamples - retrievedSamples)
            : quant - (MAX_SAMPLES - retrievedSamples + generatedSamples);

        if (missing > 0) {
            generateNextSamples(missing);
            //console.log(">>> Extra samples generated: " + missing);
        } else {
            //console.log(">>> No missing samples");
        }

        var end = retrievedSamples + quant;
        if (end >= MAX_SAMPLES) end -= MAX_SAMPLES;

        var result = {
            buffer: samples,
            bufferSize: MAX_SAMPLES,
            start: retrievedSamples,
            end: end - 1
        };

        retrievedSamples = end;

        return result;
    };

    var generateNextSamples = function(quant) {
        var mixedSample;
        for (var i = quant; i > 0; i--) {
            if (signalOn) {
                mixedSample = channel0.nextSample() - channel1.nextSample();
                // Add a little damper effect to round the edges of the square wave
                if (mixedSample !== lastSample) {
                    mixedSample = (mixedSample * 9 + lastSample) / 10;
                    lastSample = mixedSample;
                }
            } else {
                mixedSample = 0;
            }

            samples[generatedSamples++] = mixedSample * MAX_AMPLITUDE;

            if (generatedSamples >= MAX_SAMPLES)
                generatedSamples = 0;

            frameSamples++;
        }
    };


    var monitor;

    var signalOn = false;
    var channel0 = new TiaAudioChannel();
    var channel1 = new TiaAudioChannel();

    var samples = new Array(MAX_SAMPLES);
    var generatedSamples = 0;
    var retrievedSamples = 0;

    var samplesPerFrame =  TiaAudioSignal.SAMPLE_RATE / VideoStandard.NTSC.fps;
    var frameSamples = 0;

    var lastSample = 0;


    var MAX_SAMPLES = 4 * JavatariParameters.AUDIO_BUFFER_SIZE;
    var MAX_AMPLITUDE = 0.5;

}

TiaAudioSignal.SAMPLE_RATE = 31440;
