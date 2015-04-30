// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K "UA" UA Limited format

JavatariCode.Cartridge8K_UA = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
    }

    this.read = function(address) {
        // Always add the correct offset to access bank selected
        return bytes[bankAddressOffset + (address & ADDRESS_MASK)];
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
        if (address === 0x0220) {
            if (bankAddressOffset !== 0) bankAddressOffset = 0;
        } else if (address === 0x0240) {
            if (bankAddressOffset !== BANK_SIZE) bankAddressOffset = BANK_SIZE;
        }
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(JavatariCode.Util.uInt8ArrayToByteString(bytes)),
            bo: bankAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = JavatariCode.CartridgeFormats[state.f];
        this.rom = JavatariCode.ROM.loadState(state.r);
        bytes = JavatariCode.Util.byteStringToUInt8Array(atob(state.b));
        bankAddressOffset = state.bo;
    };


    var bytes;
    var bankAddressOffset = 0;

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;


    if (rom) init(this);

};

JavatariCode.Cartridge8K_UA.prototype = JavatariCode.CartridgeBankedByBusMonitoring.base;

JavatariCode.Cartridge8K_UA.createFromSaveState = function(state) {
    var cart = new JavatariCode.Cartridge8K_UA();
    cart.loadState(state);
    return cart;
};



