// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K "FE" Robotank/Decathlon format

jt.Cartridge8K_FE = function(rom, format) {
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
        // Bankswitching: Look at the address to determine the correct bank to be
        if ((address & 0x2000) !== 0) {		// Check bit 13. Address is like Fxxx or Dxxx?
            if (bankAddressOffset !== 0) bankAddressOffset = 0;
        } else {
            if (bankAddressOffset != BANK_SIZE) bankAddressOffset = BANK_SIZE;
        }
        return address & ADDRESS_MASK;
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
    var BANK_SIZE = 4096;


    if (rom) init(this);

};

jt.Cartridge8K_FE.prototype = jt.Cartridge.base;

jt.Cartridge8K_FE.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge8K_FE();
    cart.loadState(state);
    return cart;
};
