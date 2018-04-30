// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K-512K "Enhanced 3F" Tigervision format

jt.Cartridge8K_512K_3F = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
        selectableSliceMaxBank = (bytes.length - BANK_SIZE) / BANK_SIZE - 1;
        fixedSliceAddressOffset = bytes.length - BANK_SIZE * 2;
    }

    this.read = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        if (maskedAddress >= FIXED_SLICE_START_ADDRESS)			// Fixed slice
            return bytes[fixedSliceAddressOffset + maskedAddress];
        else
            return bytes[bankAddressOffset + maskedAddress];	// Selectable slice
    };

     // Bank switching is done only on monitored writes
    this.monitorBusBeforeWrite = function(address, data) {
        // Perform bank switching as needed
        if (address <= 0x003f) {
            var bank = data & 0xff;		// unsigned
            if (bank <= selectableSliceMaxBank)
                bankAddressOffset = bank * BANK_SIZE;
        }
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset,
            sm: selectableSliceMaxBank,
            fo: fixedSliceAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bankAddressOffset = state.bo;
        selectableSliceMaxBank = state.sm;
        fixedSliceAddressOffset = state.fo;
    };


    var bytes;

    var bankAddressOffset = 0;
    var selectableSliceMaxBank;
    var fixedSliceAddressOffset;		    // This slice is fixed at the last bank

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 2048;
    var FIXED_SLICE_START_ADDRESS = 2048;


    if (rom) init(this);

};

jt.Cartridge8K_512K_3F.prototype = jt.CartridgeBankedByBusMonitoring.base;

jt.Cartridge8K_512K_3F.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge8K_512K_3F();
    cart.loadState(state);
    return cart;
};
