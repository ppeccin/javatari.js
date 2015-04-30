// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 64K "F0" Dynacom Megaboy format

JavatariCode.Cartridge64K_F0 = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        return bytes[bankAddressOffset + maskedAddress];
    };

    this.write = function(address, val) {
        maskAddress(address);
        // Writing to ROMs is possible, but nothing is changed
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress == BANKSW_ADDRESS) {	// Bank selection. Increments bank
            bankAddressOffset += BANK_SIZE;
            if (bankAddressOffset >= SIZE) bankAddressOffset = 0;
        }
        return maskedAddress;
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
    var SIZE = 65536;
    var BANK_SIZE = 4096;
    var BANKSW_ADDRESS = 0x0ff0;


    if (rom) init(this);

};

JavatariCode.Cartridge64K_F0.prototype = JavatariCode.Cartridge.base;

JavatariCode.Cartridge64K_F0.createFromSaveState = function(state) {
    var cart = new JavatariCode.Cartridge64K_F0();
    cart.loadState(state);
    return cart;
};
