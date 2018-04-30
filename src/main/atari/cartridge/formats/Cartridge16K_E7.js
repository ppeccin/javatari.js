// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 16K "E7" M-Network format

jt.Cartridge16K_E7 = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM Slice1 (always ON)
        if (maskedAddress >= 0x0900 && maskedAddress <= 0x09ff)
            return extraRAM[extraRAMSlice1Offset + maskedAddress - 0x0900];
        // Check for Extra RAM Slice0
        if (extraRAMSlice0Active && maskedAddress >= 0x0400 && maskedAddress <= 0x07ff)
            return extraRAM[maskedAddress - 0x0400];
        // ROM
        if (maskedAddress < ROM_FIXED_SLICE_START)
            return bytes[bankAddressOffset + maskedAddress];		// ROM Selectable Slice
        else
            return bytes[ROM_FIXED_SLICE_OFFSET + maskedAddress];	// ROM Fixed Slice
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM Slice1 (always ON)
        if (maskedAddress >= 0x0800 && maskedAddress <= 0x08ff)
            extraRAM[extraRAMSlice1Offset + maskedAddress - 0x0800] = val;
        else // Check for Extra RAM Slice0
            if (extraRAMSlice0Active && maskedAddress <= 0x03ff)
                extraRAM[maskedAddress] = val;
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check if address is within range of bank selection
        if (maskedAddress >= 0x0fe0 && maskedAddress <= 0x0feb) {
            if (/* maskedAddress >= 0x0fe0 && */ maskedAddress <= 0x0fe6)	    // Selectable ROM Slice
                bankAddressOffset = BANK_SIZE * (maskedAddress - 0x0fe0);
            else if (maskedAddress == 0x0fe7)								    // Extra RAM Slice0
                extraRAMSlice0Active = true;
            else if (/* maskedAddress >= 0x0fe8 && */ maskedAddress <= 0x0feb)	// Extra RAM Slice1
                extraRAMSlice1Offset = EXTRA_RAM_SLICE1_START + EXTRA_RAM_SLICE1_BANK_SIZE * (maskedAddress - 0x0fe8);
        }
        return maskedAddress;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset,
            rs: extraRAMSlice0Active,
            ro: extraRAMSlice1Offset,
            ra: jt.Util.compressInt8BitArrayToStringBase64(extraRAM)
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bankAddressOffset = state.bo;
        extraRAMSlice0Active = state.rs;
        extraRAMSlice1Offset = state.ro;
        extraRAM = jt.Util.uncompressStringBase64ToInt8BitArray(state.ra, extraRAM);
    };


    var bytes;
    var bankAddressOffset = 0;

    var EXTRA_RAM_SLICE1_START = 1024;

    var extraRAM = jt.Util.arrayFill(new Array(2048), 0);
    var extraRAMSlice0Active = false;
    var extraRAMSlice1Offset = EXTRA_RAM_SLICE1_START;

    var ADDRESS_MASK = 0x0fff;
    var SIZE = 16384;
    var BANK_SIZE = 2048;
    var ROM_FIXED_SLICE_START = 0x0800;
    var ROM_FIXED_SLICE_OFFSET = SIZE - BANK_SIZE - ROM_FIXED_SLICE_START;
    var EXTRA_RAM_SLICE1_BANK_SIZE = 256;


    if (rom) init(this);

};

jt.Cartridge16K_E7.prototype = jt.Cartridge.base;

jt.Cartridge16K_E7.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge16K_E7();
    cart.loadState(state);
    return cart;
};
