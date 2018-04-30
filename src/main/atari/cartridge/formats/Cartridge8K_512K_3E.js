// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K-512K "3E" Tigervision (+RAM) format

jt.Cartridge8K_512K_3E = function(rom, format) {
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
        var maskedAddress = maskAddress(address);
        if (maskedAddress >= FIXED_SLICE_START_ADDRESS)						// ROM Fixed Slice
            return bytes[fixedSliceAddressOffset + maskedAddress];
        else
        if (extraRAMBankAddressOffset >= 0 && maskedAddress < 0x0400)		// RAM
            return extraRAM[extraRAMBankAddressOffset + maskedAddress] || 0;
        else
            return bytes[bankAddressOffset + maskedAddress];				// ROM Selectable Slice
    };

    this.write = function(address, val) {
        // Check if Extra RAM bank is selected
        if (extraRAMBankAddressOffset < 0) return;

        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes
        if (maskedAddress >= 0x0400 && maskedAddress <= 0x07ff)
            extraRAM[extraRAMBankAddressOffset + maskedAddress - 0x0400] = val;
    };

    var maskAddress = function(address) {
        return address & ADDRESS_MASK;
    };

    // Bank switching is done only on monitored writes
    this.monitorBusBeforeWrite = function(address, data) {
        // Perform ROM bank switching as needed
        if (address === 0x003f) {
            var bank = data & 0xff;		// unsigned
            if (bank <= selectableSliceMaxBank) {
                bankAddressOffset = bank * BANK_SIZE;
                extraRAMBankAddressOffset = -1;
            }
            return;
        }
        // Perform RAM bank switching as needed
        if (address === 0x003e) {
            var ramBank = data & 0xff;	// unsigned
            extraRAMBankAddressOffset = ramBank * EXTRA_RAM_BANK_SIZE;
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
            fo: fixedSliceAddressOffset,
            ro: extraRAMBankAddressOffset,
            ra: jt.Util.compressInt8BitArrayToStringBase64(extraRAM)
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
        extraRAMBankAddressOffset = state.ro;
        extraRAM = jt.Util.uncompressStringBase64ToInt8BitArray(state.ra, extraRAM);
    };


    var bytes;

    var EXTRA_RAM_BANK_SIZE = 1024;

    var bankAddressOffset = 0;
    var selectableSliceMaxBank;
    var fixedSliceAddressOffset;		                                // This slice is fixed at the last bank
    var extraRAMBankAddressOffset = -1;		                            // No Extra RAM bank selected
    var extraRAM = jt.Util.arrayFill(new Array(EXTRA_RAM_BANK_SIZE), 0);   // Pre allocate minimum RAM bank for performance


    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 2048;
    var FIXED_SLICE_START_ADDRESS = 2048;


    if (rom) init(this);

};

jt.Cartridge8K_512K_3E.prototype = jt.CartridgeBankedByBusMonitoring.base;

jt.Cartridge8K_512K_3E.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge8K_512K_3E();
    cart.loadState(state);
    return cart;
};
