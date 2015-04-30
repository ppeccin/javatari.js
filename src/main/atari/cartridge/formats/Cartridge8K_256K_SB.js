// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K-256K "SB" Superbanking format

jt.Cartridge8K_256K_SB = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        maxBank = bytes.length / BANK_SIZE - 1;
    }

    this.read = function(address) {
        // Always add the correct offset to access bank selected
        return bytes[bankAddressOffset + (address & ADDRESS_MASK)];
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
        if ((address & 0x1800) !== 0x0800) return;
        var bank = address & 0x007f;
        if (bank > maxBank) return;
        bankAddressOffset = bank * BANK_SIZE;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(jt.Util.uInt8ArrayToByteString(bytes)),
            bo: bankAddressOffset,
            m: maxBank
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.byteStringToUInt8Array(atob(state.b));
        bankAddressOffset = state.bo;
        maxBank = state.m;
    };


    var bytes;
    var bankAddressOffset = 0;
    var maxBank;

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;


    if (rom) init(this);

};

jt.Cartridge8K_256K_SB.prototype = jt.CartridgeBankedByBusMonitoring.base;

jt.Cartridge8K_256K_SB.createFromSaveState = function(state) {
    var cart = new jt.Cartridge8K_256K_SB();
    cart.loadState(state);
    return cart;
};



