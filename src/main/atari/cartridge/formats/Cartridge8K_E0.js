// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K "E0" Parker Bros. format

jt.Cartridge8K_E0 = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Always add the correct offset to access bank selected on the corresponding slice
        if (maskedAddress < 0x0400)		// Slice 0
            return bytes[slice0AddressOffset + maskedAddress];
        if (maskedAddress < 0x0800)		// Slice 1
            return bytes[slice1AddressOffset + maskedAddress - 0x0400];
        if (maskedAddress < 0x0c00)		// Slice 2
            return bytes[slice2AddressOffset + maskedAddress - 0x0800];
        // Slice 3 (0x0c00 - 0x0fff) is always at 0x1c00 (bank 7)
        return bytes[0x1000 + maskedAddress];
    };

    this.write = function(address, val) {
        maskAddress(address);
        // Writing to ROMs is possible, but nothing is changed
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check if address is within range of bank selection
        if (maskedAddress >= 0x0fe0 && maskedAddress <= 0x0ff7) {
            // Each bank is 0x0400 bytes each, 0 to 7
            if (/* maskedAddress >= 0x0fe0 && */ maskedAddress <= 0x0fe7)	    // Slice 0 bank selection
                slice0AddressOffset = (maskedAddress - 0x0fe0) * 0x0400;
            else if (/* maskedAddress >= 0x0fe8 && */ maskedAddress <= 0x0fef)	// Slice 1 bank selection
                slice1AddressOffset = (maskedAddress - 0x0fe8) * 0x0400;
            else if (/* maskedAddress >= 0x0ff0 && */ maskedAddress <= 0x0ff7)	// Slice 2 bank selection
                slice2AddressOffset = (maskedAddress - 0x0ff0) * 0x0400;
        }
        return maskedAddress;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            s0: slice0AddressOffset,
            s1: slice1AddressOffset,
            s2: slice2AddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        slice0AddressOffset = state.s0;
        slice1AddressOffset = state.s1;
        slice2AddressOffset = state.s2;
    };


    var bytes;
    var slice0AddressOffset = 0;
    var slice1AddressOffset = 0;
    var slice2AddressOffset = 0;
    // Slice 3 is fixed at bank 7


    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

};

jt.Cartridge8K_E0.prototype = jt.Cartridge.base;

jt.Cartridge8K_E0.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge8K_E0();
    cart.loadState(state);
    return cart;
};
