// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.TiaAudio = function() {
"use strict";

    var self = this;

    this.connectAudioSocket = function(pAudioSocket) {
        audioSocket = pAudioSocket;
    };

    this.cartridgeInserted = function(pCartridge) {
        if (pCartridge && pCartridge.needsAudioClock()) cartridgeNeedsAudioClock = pCartridge;
        else cartridgeNeedsAudioClock = null;
    };

    this.audioClockPulse = function() {
        audioSocket.audioClockPulse();
    };

    this.getChannel0 = function() {
        return channel0;
    };

    this.getChannel1 = function() {
        return channel1;
    };

    this.powerOn = function() {
        this.reset();
        connectAudio();
    };

    this.powerOff = function() {
        disconnectAudio();
    };

    this.reset = function() {
        channel0.setVolume(0);
        channel1.setVolume(0);
        lastSample = 0;
    };

    this.nextSample = function() {
        if (cartridgeNeedsAudioClock) cartridgeNeedsAudioClock.audioClockPulse();

        var mixedSample = channel0.nextSample() - channel1.nextSample();

        // Add a little damper effect to round the edges of the square wave
        if (mixedSample !== lastSample) {
            mixedSample = (mixedSample * 9 + lastSample) / 10;
            lastSample = mixedSample;
        }

        return mixedSample;
    };

    function connectAudio() {
        if (!audioSignal) audioSignal = new jt.AudioSignal("TiaAudio", self, SAMPLE_RATE, VOLUME);
        audioSocket.connectAudioSignal(audioSignal);
    }

    function disconnectAudio() {
        if (audioSignal) audioSocket.disconnectAudioSignal(audioSignal);
    }


    var audioSocket;
    var audioSignal;
    var cartridgeNeedsAudioClock;

    var lastSample = 0;

    var channel0 = new jt.TiaAudioChannel();
    var channel1 = new jt.TiaAudioChannel();

    var VOLUME = 0.4;
    var SAMPLE_RATE = 31440;

};

