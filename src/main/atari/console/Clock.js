// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Clock Pulse generator. Intended to be synchronized with Host machine Video Frequency whenever possible

jt.Clock = function(clockPulse) {
"use strict";

    this.go = function() {
        if (!running) {
            //lastPulseTime = jt.Util.performanceNow();
            //timeMeasures = [];

            useRequestAnimationFrame = vSynch && (cyclesPerSecond === jt.Clock.HOST_NATIVE_FPS);

            running = true;
            if (useRequestAnimationFrame)
                animationFrame = requestAnimationFrame(pulse);
            else
                interval = setInterval(pulse, cycleTimeMs);
        }
    };

    this.pause = function() {
        running = false;
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    this.isRunning = function() {
        return running;
    };

    this.getFrequency = function() {
        return cyclesPerSecond;
    };

    this.setFrequency = function(freq) {
        if (running) {
            this.pause();
            internalSetFrequency(freq);
            this.go();
        } else {
            internalSetFrequency(freq);
        }
    };

    this.setVSynch = function(boo) {
        if (running) {
            this.pause();
            vSynch = boo;
            this.go();
        } else {
            vSynch = boo;
        }
    };

    var internalSetFrequency = function(freq) {
        cyclesPerSecond = freq;
        cycleTimeMs = 1000 / freq;
    };

    var pulse = function() {
        // var pulseTime = jt.Util.performanceNow();
        // timeMeasures[timeMeasures.length] = pulseTime - lastPulseTime;
        // var lastPulseTime = pulseTime;

        animationFrame = null;
        clockPulse();
        if (useRequestAnimationFrame && !animationFrame)
            animationFrame = requestAnimationFrame(pulse);

        // console.log(jt.Util.performanceNow() - pulseTime);
    };

    //this.getMeasures = function() {
    //    return timeMeasures;
    //};

    this.eval = function(str) {
        return eval(str);
    };


    var running = false;

    var cyclesPerSecond = 1;
    var cycleTimeMs = 1000;
    var useRequestAnimationFrame;
    var animationFrame = null;
    var interval = null;
    var vSynch = true;

    //var timeMeasures = [];
    //var lastPulseTime = 0;

};

jt.Clock.HOST_NATIVE_FPS = Javatari.SCREEN_FORCE_HOST_NATIVE_FPS;         // -1 = Unknown or not detected

jt.Clock.detectHostNativeFPSAndCallback = function(callback) {

    if (Javatari.SCREEN_VSYNCH_MODE === -1) {
        jt.Util.warning("Video native V-Synch disabled in configuration");
        if (callback) callback(jt.Clock.HOST_NATIVE_FPS);
        return;
    }

    if (jt.Clock.HOST_NATIVE_FPS !== -1) {
        jt.Util.warning("Host video frequency forced in configuration: " + jt.Clock.HOST_NATIVE_FPS);
        if (callback) callback(jt.Clock.HOST_NATIVE_FPS);
        return;
    }

    // Start detection

    var tries = 0;
    var samples = [];
    var lastTime = 0;
    var good60 = 0, good50 = 0, good120 = 0, good100 = 0;
    var tolerance = 0.06;

    var sampler = function() {

        // Detected?
        if (good60 >= 10 || good50 >= 10 || good120 >= 10 || good100 >= 10) {
            jt.Clock.HOST_NATIVE_FPS = good60 >= 10 ? 60 : good50 >= 10 ? 50 : good120 >= 10 ? 120 : 100;
            jt.Util.log("Video native frequency detected: " + jt.Clock.HOST_NATIVE_FPS + "Hz");
            if (callback) callback(jt.Clock.HOST_NATIVE_FPS);
            return;
        }

        tries++;
        if (tries <= 50) {
            var currentTime = jt.Util.performanceNow();
            var sample = currentTime - lastTime;
            samples[samples.length] = sample;
            lastTime = currentTime;

            if ((sample >= (1000 / 60) *  (1 - tolerance)) && (sample <= (1000 / 60) *  (1 + tolerance))) good60++;
            if ((sample >= (1000 / 50) *  (1 - tolerance)) && (sample <= (1000 / 50) *  (1 + tolerance))) good50++;
            if ((sample >= (1000 / 120) * (1 - tolerance)) && (sample <= (1000 / 120) * (1 + tolerance))) good120++;
            if ((sample >= (1000 / 100) * (1 - tolerance)) && (sample <= (1000 / 100) * (1 + tolerance))) good100++;

            requestAnimationFrame(sampler);
        } else {
            jt.Clock.HOST_NATIVE_FPS = -1;
            jt.Util.warning("Could not detect video native frequency. V-Synch DISABLED!");
            if (callback) callback(jt.Clock.HOST_NATIVE_FPS);
        }
    };

    sampler();

};