// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.AudioSignal = function(name, source, sampleRate, volume) {
"use strict";

    var self = this;

    this.flush = function() {
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
        availSamples = maxAvailSamples;

        //console.log("FLUSH!");
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = (sampleRate / fps) | 0;
        updateBufferSize();
    };

    this.audioFinishFrame = function() {             // Enough samples to complete frame, signal always ON
        if (frameSamples > 0) {
            //console.log(">>> Audio finish frame: " + frameSamples);
            while(frameSamples > 0) audioClockPulse();
        }
        frameSamples = samplesPerFrame;
    };

    this.retrieveSamples = function(quant, mute) {
        var generated = maxAvailSamples - availSamples;

        //var generated = nextSampleToGenerate >= nextSampleToRetrieve
        //    ? nextSampleToGenerate - nextSampleToRetrieve
        //    : maxSamples - nextSampleToRetrieve + nextSampleToGenerate;

        //console.log(">>> Samples available: " + generated);

        //if (nextSampleToGenerate === nextSampleToRetrieve)
        //    console.log("MATCH: " + nextSampleToGenerate );

        //if (nextSampleToGenerate < nextSampleToRetrieve)
        //    console.log("WRAP: " + nextSampleToGenerate );

        var missing = quant - generated;

        if (missing > 0) {
            if (missing > availSamples) missing = availSamples;
            generateMissingSamples(missing, mute);
            //jt.Util.log(">>> Missing samples generated: " + missing);
        } else {
            //jt.Util.log(">>> No missing samples");
        }

        retrieveResult.start = nextSampleToRetrieve;

        var retrieved = generated + missing;
        availSamples += retrieved;
        nextSampleToRetrieve += retrieved;
        if (nextSampleToRetrieve >= maxSamples) nextSampleToRetrieve -= maxSamples;     // Circular Buffer

        return retrieveResult;
    };


    function audioClockPulse() {
        if (frameSamples > 0) {
            if (availSamples <= 0) {
                frameSamples = 0;
                return;
            }
            generateNextSample();
            --frameSamples;
            --availSamples;
        }
    }
    this.audioClockPulse = audioClockPulse;

    this.getSampleRate = function() {
        return sampleRate;
    };

    this.toString = function() {
        return "AudioSignal " + name;
    };

    this.setAudioMonitorBufferSize = function (size) {
        monitorBufferSize = size;
        updateBufferSize();
    };

    function updateBufferSize() {
        var size = (monitorBufferSize * Javatari.AUDIO_SIGNAL_BUFFER_RATIO + samplesPerFrame * Javatari.AUDIO_SIGNAL_ADD_FRAMES) | 0;
        samples.length = size;
        if (size > maxSamples) jt.Util.arrayFill(samples, 0, maxSamples, size);
        maxSamples = size;
        retrieveResult.bufferSize = maxSamples;
        maxAvailSamples = maxSamples - 2;
        self.flush();

        //console.log(">>> Buffer size for: " + name + ": " + maxSamples);
    }

    function generateNextSample() {
        samples[nextSampleToGenerate] = source.nextSample() * volume;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }

    function generateNextSampleMute() {
        samples[nextSampleToGenerate] = 0;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }

    function generateMissingSamples(quant, mute) {
        if (mute) for (var j = quant; j > 0; j = j - 1) generateNextSampleMute()
        else      for (var i = quant; i > 0; i = i - 1) generateNextSample()
        availSamples -= quant;
    }


    this.name = name;

    var clock72xCountDown = 9;              // 4 clocks out of 9 32x clocks. Count from 9 to 0 and misses every odd and the 8th clock

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var maxSamples = 0;
    var availSamples = 0, maxAvailSamples = 0;
    var samples = jt.Util.arrayFill(new Array(maxSamples), 0);

    var monitorBufferSize = 0;

    var retrieveResult = {
        buffer: samples,
        bufferSize: maxSamples,
        start: 0
    };


};
