// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements generic bank switching using unmasked address access via bus monitoring (outside Cart area)

jt.CartridgeBankedByBusMonitoring = function(rom, format) {
"use strict";

    this.needsBusMonitoring = function() {
        return true;
    };

    this.monitorBusBeforeRead = function(address) {
        this.performBankSwitchOnMonitoredAccess(address)
    };

    this.monitorBusBeforeWrite = function(address, data) {
        this.performBankSwitchOnMonitoredAccess(address)
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
    };

};

jt.CartridgeBankedByBusMonitoring.prototype = jt.Cartridge.base;

jt.CartridgeBankedByBusMonitoring.base = new jt.CartridgeBankedByBusMonitoring();


