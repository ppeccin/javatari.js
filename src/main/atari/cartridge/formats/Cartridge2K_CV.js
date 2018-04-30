// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 2K "CV" Commavid + 1K RAM format

jt.Cartridge2K_CV = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        // Always use a 4K ROM image, multiplying the ROM internally
        bytes = new Array(4096);
        self.bytes = bytes;
        var len = rom.content.length;
        for (var pos = 0; pos < bytes.length; pos += len)
            jt.Util.arrayCopy(rom.content, 0, bytes, pos, len);
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM reads
        if (maskedAddress < 0x0400)				// RAM
            return extraRAM[maskedAddress];
        else
            return bytes[maskedAddress];	    // ROM
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes
        if (maskedAddress >= 0x0400 && maskedAddress <= 0x07ff)
            extraRAM[maskedAddress - 0x0400] = val;
    };

    var maskAddress = function(address) {
        return address & ADDRESS_MASK;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b:  jt.Util.compressInt8BitArrayToStringBase64(bytes),
            ra: jt.Util.compressInt8BitArrayToStringBase64(extraRAM)
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        extraRAM = jt.Util.uncompressStringBase64ToInt8BitArray(state.ra, extraRAM);
    };


    var bytes;
    var extraRAM = jt.Util.arrayFill(new Array(1024), 0);

    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

};

jt.Cartridge2K_CV.prototype = jt.Cartridge.base;

jt.Cartridge2K_CV.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge2K_CV();
    cart.loadState(state);
    return cart;
};
