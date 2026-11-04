// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

jt.WebAudioSpeaker = function(mainElement) {
"use strict";

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.connectAudioSignal = function(pAudioSignal) {
        if (audioSignal.indexOf(pAudioSignal) >= 0) return;        // Add only once
        jt.Util.arrayAdd(audioSignal, pAudioSignal);
        updateResamplingFactors();
    };

    this.disconnectAudioSignal = function(pAudioSignal) {
        if (audioSignal.indexOf(pAudioSignal) < 0) return;         // Not present
        jt.Util.arrayRemoveAllElement(audioSignal, pAudioSignal);
        updateResamplingFactors();
    };

    this.powerOn = function() {
        createAudioContext();
        if (!processor) return;

        registerUnlockOnTouchIfNeeded();
        this.unpause();
    };

    this.powerOff = function() {
        this.pause();
        if (audioContext) audioContext.close();
        audioContext = processor = undefined;
    };

    this.mute = function () {
        mute = true;
    };

    this.unMute = function () {
        mute = false;
    };

    this.pause = function () {
        if (processor) processor.disconnect();
    };

    this.unpause = function () {
        if (processor) processor.connect(audioContext.destination);
    };

    this.toggleBufferBaseSize = function() {
        if (!audioContext) return screen.showOSD("Audio is DISABLED", true, true);

        bufferBaseSize = ((bufferBaseSize + 2) % 8) - 1;  // -1..6
        this.pause();
        createProcessor();
        this.unpause();
        screen.showOSD("Audio Buffer size: " + (bufferBaseSize === -1 ? "Auto (" + bufferSize + ")" : bufferBaseSize === 0 ? "Browser (" + bufferSize + ")" : bufferSize), true);
        prefs.audioBufferBase = bufferBaseSize;
        Javatari.userPreferences.setDirty();
    };

    this.getControlReport = function(control) {
        // Only BufferBaseSize for now
        return { label: bufferBaseSize === -2 ? "OFF" : bufferBaseSize === -1 ? "Auto" : bufferBaseSize === 0 ? "Browser" : bufferSize, active: bufferBaseSize > 0 };
    };

    function determineAutoBufferBaseSize() {
        // Set bufferBaseSize according to browser and platform
        return jt.Util.isMobileDevice()
            ? jt.Util.browserInfo().name === "CHROME" && !jt.Util.isIOSDevice()
                ? 4      // for now mobile Chrome needs more buffer, except on iOS
                : 3      // other mobile scenarios
            : 2;         // desktop
    }

    function determineBrowserDefaultBufferBaseSize() {
        // Safari/WebKit does not allow 0 (browser default), so use Auto instead
        return jt.Util.browserInfo().name === "SAFARI" || jt.Util.isIOSDevice() ? determineAutoBufferBaseSize() : 0;
    }

    var createAudioContext = function() {
        if (bufferBaseSize === -2 || Javatari.AUDIO_MONITOR_BUFFER_SIZE === 0) {
            jt.Util.warning("Audio disabled in configuration");
            return;
        }
        try {
            var constr = (window.AudioContext || window.webkitAudioContext || window.WebkitAudioContext);
            if (!constr) throw new Error("WebAudio API not supported by the browser");
            audioContext = new constr();
            jt.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate + (audioContext.state ? ", " + audioContext.state : ""));
            createProcessor();
        } catch(ex) {
            jt.Util.error("Could not create AudioContext. Audio DISABLED!\n" + ex);
        }
    };

    var createProcessor = function() {
        try {
            // If not specified, calculate buffer size based on baseSize and host audio sampling rate. Ex: for a baseSize = 1 then 22050Hz = 256, 44100 = 512, 48000 = 512, 96000 = 1024, 192000 = 2048, etc
            var baseSize = bufferBaseSize === -1 ? determineAutoBufferBaseSize() : bufferBaseSize === 0 ? determineBrowserDefaultBufferBaseSize() : bufferBaseSize;
            var totalSize = Javatari.AUDIO_MONITOR_BUFFER_SIZE > 0 ? Javatari.AUDIO_MONITOR_BUFFER_SIZE : baseSize > 0 ? jt.Util.exp2(jt.Util.log2((audioContext.sampleRate + 14000) / 22050) | 0) * jt.Util.exp2(baseSize - 1) * 256 : 0;
            processor = audioContext.createScriptProcessor(totalSize, 1, 1);
            processor.onaudioprocess = onAudioProcess;
            bufferSize = processor.bufferSize;
            updateResamplingFactors();
            jt.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        } catch(ex) {
            jt.Util.error("Could not create ScriptProcessorNode. Audio DISABLED!\n" + ex);
        }
    };

    function registerUnlockOnTouchIfNeeded() {
        // Browser may require unlocking of the AudioContext on user interaction!
        if (processor && (!audioContext.state || audioContext.state === "suspended")) {
            mainElement.addEventListener("touchend", unlockAudioContext, true);
            mainElement.addEventListener("mousedown", unlockAudioContext, true);
            mainElement.addEventListener("keydown", unlockAudioContext, true);
            jt.Util.log("Speaker Audio Context resume event registered");
            screen.speakerUnlockStateUpdate(false);
        }

        function unlockAudioContext() {
            mainElement.removeEventListener("touchend", unlockAudioContext, true);
            mainElement.removeEventListener("mousedown", unlockAudioContext, true);
            mainElement.removeEventListener("keydown", unlockAudioContext, true);

            var ex;
            try {
                audioContext.resume().then(function () {
                    jt.Util.log('Speaker Audio Context resumed!');
                });
            } catch (e) {
                ex = e;
            }

            var source = audioContext.createBufferSource();
            source.buffer = audioContext.createBuffer(1, 1, 22050);
            source.connect(audioContext.destination);
            source.start(0);
            if (ex) jt.Util.log("Audio Context unlocked!");
            screen.speakerUnlockStateUpdate(true);
        }
    }
    function updateResamplingFactors() {
        //if (bufferSizeProblem !== undefined) console.error("+++++++ buffer size problem: " + bufferSizeProblem);

        if (!processor) return;
        resamplingFactor.length = audioSignal.length;
        resamplingLeftOver.length = audioSignal.length;
        sincTable.length = audioSignal.length;
        for (var i = 0; i < audioSignal.length; i++) {
            resamplingFactor[i] = audioSignal[i].getSampleRate() / audioContext.sampleRate;
            resamplingLeftOver[i] = 0;
            sincTable[i] = createSincTable(resamplingFactor[i]);
            audioSignal[i].setAudioMonitorBufferSize((resamplingFactor[i] * bufferSize) | 0);
        }
    }

    // Polyphase windowed sinc (Blackman) kernels. Cutoff a little under the lower of the two Nyquist rates
    function createSincTable(factor) {
        var cutoff = 0.9 * Math.min(1, 1 / factor);           // in source Nyquist units
        var table = new Float32Array(SINC_PHASES * SINC_TAPS);
        var half = SINC_TAPS / 2;
        for (var ph = 0; ph < SINC_PHASES; ++ph) {
            var frac = ph / SINC_PHASES, sum = 0;
            for (var t = 0; t < SINC_TAPS; ++t) {
                var x = t - (SINC_TAPS - 1) + half - frac;         // distance from the interpolation point, in samples
                var sinc = x === 0 ? cutoff : Math.sin(Math.PI * cutoff * x) / (Math.PI * x);
                var w = (x + half) / SINC_TAPS;                    // 0..1 window position
                var win = w <= 0 || w >= 1 ? 0 : 0.42 - 0.5 * Math.cos(2 * Math.PI * w) + 0.08 * Math.cos(4 * Math.PI * w);
                table[ph * SINC_TAPS + t] = sinc * win;
                sum += sinc * win;
            }
            for (t = 0; t < SINC_TAPS; ++t) table[ph * SINC_TAPS + t] /= sum;     // unity gain at DC for every phase
        }
        return table;
    }

    function onAudioProcess(event) {
        //if (Javatari.room.console.powerIsOn) {
        //    var now = performance.now();
        //    Javatari.onAudioProcessLog.push(now - lastOnAudioProcessTime);
        //    lastOnAudioProcessTime = now;
        //}

        // Assumes there is only one output channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var outputBufferSize = outputBuffer.length;

        //if (outputBufferSize !== bufferSize) bufferSizeProblem = outputBufferSize;

        // Clear output buffer
        for (var j = outputBufferSize - 1; j >= 0; j = j - 1) outputBuffer[j] = 0;

        if (audioSignal.length === 0) return;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignal.length - 1; i >= 0; i = i - 1) {
            var resampFactor = resamplingFactor[i];
            var input = audioSignal[i].retrieveSamples((outputBufferSize * resampFactor + resamplingLeftOver[i]) | 0, mute);
            var inputBuffer = input.buffer;
            var inputBufferSize = input.bufferSize;

            // Copy to output performing basic re-sampling
            // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
            var s = input.start + resamplingLeftOver[i];
            var d = 0;
            while (d < outputBufferSize) {
                // Band limited interpolation: windowed sinc over the last SINC_TAPS source samples, so the output
                // is delayed by SINC_TAPS / 2 samples and never reads a sample that was not generated yet
                var si = s | 0;
                var k = sincTable[i], o = ((s - si) * SINC_PHASES | 0) * SINC_TAPS;
                var p = si - SINC_TAPS + 1; if (p < 0) p += inputBufferSize;
                var acc = 0;
                for (var t = 0; t < SINC_TAPS; ++t) {
                    acc += inputBuffer[p] * k[o + t];
                    if (++p >= inputBufferSize) p = 0;
                }
                outputBuffer[d] += acc;

                //COUNTER--; if (COUNTER < 0) {
                //    COUNTER = 160;
                //    SIGNAL = -SIGNAL;
                //}
                //outputBuffer[d] = SIGNAL * 0.4;

                d = d + 1;
                s = s + resampFactor;
                if (s >= inputBufferSize) s = s - inputBufferSize;
            }
            resamplingLeftOver[i] = s - (s | 0);        // fractional part
        }

        //var str = ""; for (var i = 0; i < audioSignal.length; i++) str = str + audioSignal[i].name + " ";
        //console.log("AudioProcess: " + str);
    }


    var screen;

    var audioSignal = [];
    this.signals = audioSignal;
    var resamplingFactor = [];
    var resamplingLeftOver = [];
    var sincTable = [];
    var SINC_TAPS = 16, SINC_PHASES = 64;

    var prefs = Javatari.userPreferences.current;

    var bufferBaseSize = Javatari.AUDIO_MONITOR_BUFFER_BASE === -3 ? prefs.audioBufferBase : Javatari.AUDIO_MONITOR_BUFFER_BASE;

    var audioContext;
    var bufferSize;
    var processor;

    var mute = false;

    //var bufferSizeProblem;
    //Javatari.onAudioProcessLog = [ ];
    //var lastOnAudioProcessTime = 0;
    //var COUNTER = 0;
    //var SIGNAL = 1;

};