// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 64K "F0" Dynacom Megaboy format

jt.Cartridge64K_F0 = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
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
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
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

jt.Cartridge64K_F0.prototype = jt.Cartridge.base;

jt.Cartridge64K_F0.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge64K_F0();
    cart.loadState(state);
    return cart;
};
