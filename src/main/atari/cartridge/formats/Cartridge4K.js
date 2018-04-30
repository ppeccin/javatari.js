// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 4K unbanked format. Smaller ROMs will be copied multiple times to fill the entire 4K

jt.Cartridge4K = function(rom, format) {
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
        return bytes[address & ADDRESS_MASK];
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
    };


    var bytes;

    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

};

jt.Cartridge4K.prototype = jt.Cartridge.base;

jt.Cartridge4K.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge4K();
    cart.loadState(state);
    return cart;
};
