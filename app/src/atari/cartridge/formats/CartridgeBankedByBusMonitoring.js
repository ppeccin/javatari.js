// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements generic bank switching using unmasked address access via bus monitoring (outside Cart area)

function CartridgeBankedByBusMonitoring(rom, format) {

    this.needsBusMonitoring = function() {
        return true;
    };

    this.monitorBusBeforeRead = function(address, data) {
        this.performBankSwitchOnMonitoredAccess(address)
    };

    this.monitorBusBeforeWrite = function(address, data) {
        this.performBankSwitchOnMonitoredAccess(address)
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
    };

}

CartridgeBankedByBusMonitoring.prototype = Cartridge.base;

CartridgeBankedByBusMonitoring.base = new CartridgeBankedByBusMonitoring();


