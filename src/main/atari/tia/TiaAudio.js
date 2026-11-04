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

    // Volume changes are timestamped with the TIA clock, so a sample averages the volume over its whole window
    // (as the chip and Stella do) instead of reading it at one instant. Lets line rate sample playback through
    this.volumeWriteAt = function(tiaClock) {
        var elapsed = tiaClock - lastMarkClock;
        if (elapsed < 0) elapsed += LINE_CLOCKS;
        lastMarkClock = tiaClock;
        channel0.integrateVolume(elapsed);
        channel1.integrateVolume(elapsed);
    };

    this.audioClockPulseAt = function(tiaClock) {
        this.volumeWriteAt(tiaClock);
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
        dcIn = dcOut = 0;
    };

    this.nextSample = function() {
        if (cartridgeNeedsAudioClock) cartridgeNeedsAudioClock.audioClockPulse();

        // The two TIA channels are summed on the chip (not subtracted), through a non linear resistor network.
        // nextSample() returns volume / 15 (averaged over the sample window), so v is the summed volume 0..30
        var v = (channel0.nextSample() + channel1.nextSample()) * MAX_VOLUME;
        var mixedSample = MIX_SCALE * 2 * v / (30 + v);

        // DC blocker (about 25 Hz), like the AC coupled output of the console, so the summed signal stays centred
        dcOut = mixedSample - dcIn + DC_POLE * dcOut;
        dcIn = mixedSample;

        return dcOut;
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

    var dcIn = 0, dcOut = 0;
    var lastMarkClock = 0;
    var LINE_CLOCKS = 228;
    var DC_POLE = 0.995;

    var MAX_VOLUME = 15;
    var MIX_SCALE = 1.5;                            // One channel at full volume about as loud as before (1.0)

    var channel0 = new jt.TiaAudioChannel();
    var channel1 = new jt.TiaAudioChannel();

    var VOLUME = 0.4;
    var SAMPLE_RATE = 31440;

};

