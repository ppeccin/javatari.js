// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.VideoSignal = function() {
"use strict";

    this.connectMonitor = function(pMonitor) {
        this.monitor = pMonitor;
    };

    this.setVideoStandard = function(standard) {
        if (this.monitor) this.monitor.setVideoStandard(standard);
    };

    this.nextLine = function(pixels, vSynch) {
        return this.monitor.nextLine(pixels, vSynch);
    };

    this.finishFrame = function() {
       this.monitor.refresh();
    };

    this.signalOff = function() {
        if (this.monitor) this.monitor.videoSignalOff();
    };

    this.showOSD = function(message, overlap, error) {
        if (this.monitor) this.monitor.showOSD(message, overlap, error);
    };

    this.toggleShowInfo = function() {
        this.monitor.toggleShowInfo();
    };


    this.monitor = null;

};