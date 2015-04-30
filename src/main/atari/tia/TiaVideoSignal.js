// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.TiaVideoSignal = function() {

    this.connectMonitor = function(pMonitor) {
        this.monitor = pMonitor;
    };

    this.nextLine = function(pixels, vSynch) {
        if (!this.monitor) return false;
        return this.monitor.nextLine(pixels, vSynch);
    };

    this.finishFrame = function() {
       this.monitor.synchOutput();
    };

    this.signalOff = function() {
        if (this.monitor) this.monitor.nextLine(null, false);
    };

    this.showOSD = function(message, overlap) {
        if (this.monitor)
            this.monitor.showOSD(message, overlap);
    };


    this.standard = null;
    this.monitor = null;

};