// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the n * 8448 byte "AR" Arcadia/Starpath/Supercharger tape format

jt.Cartridge8K_64K_AR = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        // Cannot use the contents of the ROM directly, as cartridge is all RAM and can be modified
        // Also, ROM content represents the entire tape and can have multiple parts
        bytes = jt.Util.arrayFill(new Array(4 * BANK_SIZE));
        self.bytes = bytes;
        loadBIOS();
        // Initialize Random seeds
        for (var i = 0; i < 31; ++i) randomSeeds[i] = (Math.random() * 256) | 0;
    }

    this.powerOn = function() {
        // Always start with bank configuration 000 (bank2, bank3 = BIOS ROM), writes disabled and BIOS ROM powered on
        setControlRegister(0x00);
        // Rewind Tape
        tapeOffset = 0;
        // BIOS will ask to load Part Number 0 at System Reset
    };

    this.connectBus = function(pBus) {
        bus = pBus;
    };

    this.read = function(address) {
        // maskedAddress already set on bus monitoring method
        // bank0
        if (maskedAddress < BANK_SIZE)
            return bytes[bank0AddressOffset + maskedAddress];
        else
        // bank1
            return bytes[bank1AddressOffset + maskedAddress - BANK_SIZE];
    };

    this.write = function(address, b) {
        // No direct writes are possible
        // But check for BIOS Load Part Hotspot range
        if (bank1AddressOffset === BIOS_BANK_OFFSET &&
            maskedAddress >= BIOS_INT_EMUL_LOAD_HOTSPOT && maskedAddress < BIOS_INT_EMUL_LOAD_HOTSPOT + 256) {
            loadPart(maskedAddress - BIOS_INT_EMUL_LOAD_HOTSPOT);
        }
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
        maskedAddress = address & ADDRESS_MASK;
        address &= 0x1fff;

        // Set ControlRegister if the hotspot was triggered
        if (address === 0x1ff8) {
            setControlRegister(valueToWrite);
            return;
        }

        // Check for writes pending and watch for address transitions
        if (addressChangeCountdown > 0) {
            if (address !== lastAddress) {
                lastAddress = address;
                if (--addressChangeCountdown === 0) {
                    // 5th address transition detected, perform write
                    if ((address & CHIP_MASK) === CHIP_SELECT) {		// Do not write outside Cartridge range
                        // bank0
                        if (maskedAddress < BANK_SIZE)
                            bytes[bank0AddressOffset + maskedAddress] = valueToWrite;
                        // bank1
                        else if (bank1AddressOffset < BIOS_BANK_OFFSET)	// Do not write to BIOS ROM
                            bytes[bank1AddressOffset + maskedAddress - BANK_SIZE] = valueToWrite;
                    }
                }
            }
            return;
        }

        // Check and store desired value to write
        if (((address & CHIP_MASK) === CHIP_SELECT) && maskedAddress <= 0x00ff) {
            valueToWrite = maskedAddress;
            if (writeEnabled) {
                lastAddress = address;		// Will be watched for the 5th address change
                addressChangeCountdown = 5;
            }
        }
    };

    var setControlRegister = function(controlRegister) {
        var banksConfig = (controlRegister >> 2) & 0x07;
        switch (banksConfig) {
            case 0: bank0AddressOffset = 2 * BANK_SIZE; bank1AddressOffset = BIOS_BANK_OFFSET; break;
            case 1: bank0AddressOffset = 0 * BANK_SIZE; bank1AddressOffset = BIOS_BANK_OFFSET; break;
            case 2: bank0AddressOffset = 2 * BANK_SIZE; bank1AddressOffset = 0 * BANK_SIZE; break;	// as used in Commie Mutants and many others
            case 3: bank0AddressOffset = 0 * BANK_SIZE; bank1AddressOffset = 2 * BANK_SIZE; break;	// as used in Suicide Mission
            case 4: bank0AddressOffset = 2 * BANK_SIZE; bank1AddressOffset = BIOS_BANK_OFFSET; break;
            case 5: bank0AddressOffset = 1 * BANK_SIZE; bank1AddressOffset = BIOS_BANK_OFFSET; break;
            case 6: bank0AddressOffset = 2 * BANK_SIZE; bank1AddressOffset = 1 * BANK_SIZE; break;	// as used in Killer Satellites
            case 7: bank0AddressOffset = 1 * BANK_SIZE; bank1AddressOffset = 2 * BANK_SIZE; break;	// as we use for 2k/4k ROM cloning		}
            default: throw new Error("Invalid bank configuration");
        }
        addressChangeCountdown = 0;	// Setting ControlRegister cancels any pending write
        writeEnabled = (controlRegister & 0x02) !== 0;
        biosRomPower = (controlRegister & 0x01) === 0;
        // System.out.println("Banks: " + banksConfig + ", Writes: " + (writeEnabled ? "ON" : "OFF"));
    };

    var loadPart = function(part) {
        var tapeRewound = false;
        do {
            // Check for tape end
            if (tapeOffset > rom.content.length - 1) {
                // Check if tape was already rewound once to avoid infinite tries
                if (tapeRewound) {
                    if (part === 0) bus.getTia().getVideoOutput().showOSD("Could not load Tape from Start. Not a Start Tape ROM!", true);
                    else bus.getTia().getVideoOutput().showOSD("Could not find next Part to load in Tape!", true);
                    signalPartLoadedOK(false);		// BIOS will handle this
                    return;
                }
                // Rewind tape
                tapeOffset = 0;
                tapeRewound = true;
            }
            // Check if the next part is the one we are looking for
            if (jt.Cartridge8K_64K_AR.peekPartNoOnTape(rom.content, tapeOffset) === part) {
                if (part === 0) bus.getTia().getVideoOutput().showOSD("Loaded Tape from Start", true);
                else bus.getTia().getVideoOutput().showOSD("Loaded next Part from Tape", true);
                loadNextPart();
                return;
            } else {
                // Advance tape
                tapeOffset += PART_SIZE;
            }
        } while(true);
    };

    var loadNextPart = function() {
        loadHeaderData();
        loadPagesIntoBanks();
        patchPartDataIntoBIOS();
    };

    var loadHeaderData = function() {
        // Store header info
        jt.Util.arrayCopy(rom.content, tapeOffset + 4 * BANK_SIZE, header, 0, header.length);
        romStartupAddress = (header[1] << 8) | (header[0] & 0xff);
        romControlRegister = header[2];
        romPageCount = header[3];
        romChecksum = header[4];
        romMultiLoadIndex = header[5];
        romProgressBarSpeed = (header[7] << 8) | (header[6] & 0xff);
        romPageOffsets = jt.Util.arrayFill(new Array(romPageCount), 0);
        jt.Util.arrayCopy(header, 16, romPageOffsets, 0, romPageCount);
    };

    var loadPagesIntoBanks = function() {
        // Clear last page of first bank, as per original BIOS
        jt.Util.arrayFillSegment(bytes, 7 * PAGE_SIZE, 8 * PAGE_SIZE - 1, 0);

        // Load pages
        var romOffset = tapeOffset;
        for (var i = 0, len = romPageOffsets.length; i < len; i++) {
            var pageInfo = romPageOffsets[i];
            var bankOffset = (pageInfo & 0x03) * BANK_SIZE;
            var pageOffset = (pageInfo >> 2) * PAGE_SIZE;
            // Only write if not in BIOS area
            if (bankOffset + pageOffset + 255 < BIOS_BANK_OFFSET)
                jt.Util.arrayCopy(rom.content, romOffset, bytes, bankOffset + pageOffset, PAGE_SIZE);
            romOffset += PAGE_SIZE;
        }
        // Advance tape
        tapeOffset += PART_SIZE;
    };

    var patchPartDataIntoBIOS = function() {
        // Patch BIOS interface area with correct values from stored Header data
        bytes[BIOS_BANK_OFFSET + BIOS_INT_CONTROL_REG_ADDR - 0xf800] = romControlRegister;
        bytes[BIOS_BANK_OFFSET + BIOS_INT_PART_NO_ADDR - 0xf800] = romMultiLoadIndex;
        bytes[BIOS_BANK_OFFSET + BIOS_INT_RANDOM_SEED_ADDR - 0xf800] = randomSeeds[currentRandomSeed++]; if (currentRandomSeed > 30) currentRandomSeed = 0;
        bytes[BIOS_BANK_OFFSET + BIOS_INT_START_ADDR - 0xf800] = romStartupAddress & 0xff;
        bytes[BIOS_BANK_OFFSET + BIOS_INT_START_ADDR + 1 - 0xf800] = (romStartupAddress >> 8) & 0xff;
        signalPartLoadedOK(true);
    };

    var signalPartLoadedOK = function(ok) {
        bytes[BIOS_BANK_OFFSET + BIOS_INT_PART_LOADED_OK - 0xf800] = (ok ? 1 : 0);
    };

    var loadBIOS = function() {
        var bios = jt.Util.uncompressStringBase64ToInt8BitArray(STARPATH_BIOS);
        jt.Util.arrayCopy(bios, 0, bytes, BIOS_BANK_OFFSET, BANK_SIZE);
    };


    var bus;

    var bytes;

    var bank0AddressOffset = 0;
    var bank1AddressOffset = 0;
    var valueToWrite = 0;
    var writeEnabled = false;
    var lastAddress = -1;
    var addressChangeCountdown = 0;
    var biosRomPower = false;

    var romStartupAddress = 0;
    var romControlRegister = 0;
    var romPageCount = 0;
    var romChecksum = 0;
    var romMultiLoadIndex = 0;
    var romProgressBarSpeed = 0;
    var romPageOffsets;

    var randomSeeds = new Array(31);    // Circular Random seeds pre-determined at init() and preserved at saveStates to avoid indeterminism
    var currentRandomSeed = 0;

    var tapeOffset = 0;

    var HEADER_SIZE = 256;
    var header = jt.Util.arrayFill(new Array(HEADER_SIZE), 0);      // local buffer, not part of the state

    var maskedAddress;

    var BIOS_INT_PART_NO_ADDR 		= 0xfb00;
    var BIOS_INT_CONTROL_REG_ADDR	= 0xfb01;
    var BIOS_INT_START_ADDR 		= 0xfb02;
    var BIOS_INT_RANDOM_SEED_ADDR	= 0xfb04;
    var BIOS_INT_PART_LOADED_OK 	= 0xfb05;
    var BIOS_INT_EMUL_LOAD_HOTSPOT	= 0x0c00;

    var PAGE_SIZE = 256;
    var BANK_SIZE = 8 * PAGE_SIZE;
    var BIOS_BANK_OFFSET = 3 * BANK_SIZE;
    var PART_SIZE = 4 * BANK_SIZE + HEADER_SIZE;	// 4 * 2048 banks + header

    // Bios is 2048 bytes. This is compressed (zip) and stored in base64
    var STARPATH_BIOS = "7dSxCsIwEAbgv6niGkeddPVZ8kCOXc43yCIokkGIUN+gLxAoZHTxHRxjYq2xk7vSIPS75bb7uYNTuOJWu/bod3iU42BzUTiBe9sTzSj" +
        "ToBnNBVxfQz/nQ+2NhA2a05KYmhhjmxhoQZymxGil8gpeesOdyioW5DN25yxsiri3chQOUO1WeCSI/hPx9AJ/m/576KROMUhlfdE4dQ+AfJoPNBikgOZdLw==";

    var ADDRESS_MASK = 0x0fff;
    var CHIP_MASK = 0x1000;
    var CHIP_SELECT = 0x1000;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(true),    // ROM contents needed for later part loads
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            b0o: bank0AddressOffset,
            b1o: bank1AddressOffset,
            vw: valueToWrite,
            we: writeEnabled,
            la: lastAddress,
            ac: addressChangeCountdown,
            bp: biosRomPower,
            rs: romStartupAddress,
            rc: romControlRegister,
            rp: romPageCount,
            rk: romChecksum,
            rm: romMultiLoadIndex,
            rb: romProgressBarSpeed,
            ro: romPageOffsets,
            to: tapeOffset,
            rnd: jt.Util.storeInt8BitArrayToStringBase64(randomSeeds),
            rnc: currentRandomSeed
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bank0AddressOffset = state.b0o;
        bank1AddressOffset = state.b1o;
        valueToWrite = state.vw;
        writeEnabled = state.we;
        lastAddress = state.la;
        addressChangeCountdown = state.ac;
        biosRomPower = state.bp;
        romStartupAddress = state.rs;
        romControlRegister = state.rc;
        romPageCount = state.rp;
        romChecksum = state.rk;
        romMultiLoadIndex = state.rm;
        romProgressBarSpeed = state.rb;
        romPageOffsets = state.ro;
        tapeOffset = state.to;
        jt.Util.restoreStringBase64ToInt8BitArray(state.rnd, randomSeeds);
        currentRandomSeed = state.rnc;
    };


    if (rom) init(this);

};

jt.Cartridge8K_64K_AR.prototype = jt.CartridgeBankedByBusMonitoring.base;

jt.Cartridge8K_64K_AR.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge8K_64K_AR();
    cart.loadState(state);
    return cart;
};

jt.Cartridge8K_64K_AR.HEADER_SIZE = 256;
jt.Cartridge8K_64K_AR.PAGE_SIZE = 256;
jt.Cartridge8K_64K_AR.BANK_SIZE = 8 * jt.Cartridge8K_64K_AR.PAGE_SIZE;
jt.Cartridge8K_64K_AR.PART_SIZE = 4 * jt.Cartridge8K_64K_AR.BANK_SIZE + jt.Cartridge8K_64K_AR.HEADER_SIZE;	// 4 * 2048 banks + header

jt.Cartridge8K_64K_AR.peekPartNoOnTape = function(tapeContent, tapeOffset) {
    return tapeContent[tapeOffset + 4*jt.Cartridge8K_64K_AR.BANK_SIZE + 5];
};

jt.Cartridge8K_64K_AR.checkTape = function(rom) {
    if (jt.Cartridge8K_64K_AR.peekPartNoOnTape(rom.content, 0) === 0) return true;

    jt.Util.warning("Wrong Supercharger Tape Part ROM! Please load a Full Tape ROM file");
    return false;
};


