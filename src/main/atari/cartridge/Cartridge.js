// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Cartridge = function() {
"use strict";

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.connectBus = function(bus) {
    };

    this.connectSaveStateSocket = function(socket) {
    };

    this.read = function(address) {
    };

    this.write = function(address, val) {
        // Writing to ROMs is possible, but nothing is changed
    };

    this.getDataDesc = function() {
        return null;
    };

    this.needsBusMonitoring = function() {
        return false;
    };

    this.monitorBusBeforeRead = function(address)  {
    };

    this.monitorBusBeforeWrite = function(address, val)  {
    };

    this.needsAudioClock = function() {
        return false;
    };

    this.audioClockPulse = function() {
    };

    this.reinsertROMContent = function() {
        if (this.rom.content) return;
        this.rom.content = this.bytes || [];
    };


    this.format = null;
    this.rom = null;
    this.bytes = null;


    // Savestate  -------------------------------------------

    this.saveState = function() {
    };

    this.loadState = function(state) {
    };

};

jt.Cartridge.base = new jt.Cartridge();
