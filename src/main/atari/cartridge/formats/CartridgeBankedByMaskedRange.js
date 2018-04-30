// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

/**
 * Implements the simple bank switching method by masked address range access (within Cart area)
 * Supports SuperChip extra RAM (ON/OFF/AUTO).
 * Used by several n * 4K bank formats with varying extra RAM sizes
 */

jt.CartridgeBankedByMaskedRange = function(rom, format, pBaseBankSwitchAddress, superChip, pExtraRAMSize) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
        var numBanks = bytes.length / BANK_SIZE;
        baseBankSwitchAddress = pBaseBankSwitchAddress;
        topBankSwitchAddress = baseBankSwitchAddress + numBanks - 1;
        extraRAMSize = pExtraRAMSize;
        // SuperChip mode. null = automatic mode
        if (superChip == null || superChip == undefined) {
            superChipMode = false;
            superChipAutoDetect = true;
        } else {
            superChipMode = !!superChip;
            superChipAutoDetect = false;
        }
        extraRAM = superChip !== false ? jt.Util.arrayFill(new Array(extraRAMSize), 0) : null;
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for SuperChip Extra RAM reads
        if (superChipMode && (maskedAddress >= extraRAMSize) && (maskedAddress < extraRAMSize * 2))
            return extraRAM[maskedAddress - extraRAMSize];
        else
        // Always add the correct offset to access bank selected
            return bytes[bankAddressOffset + maskedAddress];
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes and then turn superChip mode on
        if (maskedAddress < extraRAMSize && (superChipMode || superChipAutoDetect)) {
            if (!superChipMode) superChipMode = true;
            extraRAM[maskedAddress] = val;
        }
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress >= baseBankSwitchAddress && maskedAddress <= topBankSwitchAddress)
            bankAddressOffset = BANK_SIZE * (maskedAddress - baseBankSwitchAddress);
        return maskedAddress;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset,
            bb: baseBankSwitchAddress,
            es: extraRAMSize,
            tb: topBankSwitchAddress,
            s: superChipMode | 0,
            sa: superChipAutoDetect | 0,
            e: extraRAM && jt.Util.compressInt8BitArrayToStringBase64(extraRAM)
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bankAddressOffset = state.bo;
        baseBankSwitchAddress = state.bb;
        extraRAMSize = state.es;
        topBankSwitchAddress =  state.tb;
        superChipMode = !!state.s;
        superChipAutoDetect = !!state.sa;
        extraRAM = state.e && jt.Util.uncompressStringBase64ToInt8BitArray(state.e, extraRAM);
    };


    var bytes;

    var bankAddressOffset = 0;
    var baseBankSwitchAddress;
    var topBankSwitchAddress;

    var superChipMode = false;
    var superChipAutoDetect;
    var extraRAMSize;
    var extraRAM;


    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;


    if (rom) init(this);

};

jt.CartridgeBankedByMaskedRange.prototype = jt.Cartridge.base;

jt.CartridgeBankedByMaskedRange.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.CartridgeBankedByMaskedRange();
    cart.loadState(state);
    return cart;
};
