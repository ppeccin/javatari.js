/**
 * Created by ppeccin on 15/01/2015.
 */

CartridgeFormats = {

    "4K": {
        name: "4K",
        desc: "4K Atari",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length >= 8 && rom.content.length <= 4096 && 4096 % rom.content.length === 0) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new Cartridge4K(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return Cartridge4K.createFromSaveState(state);
        }
    },

    "E0": {
        name: "E0",
        desc: "8K Parker Bros.",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new Cartridge8K_E0(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return Cartridge8K_E0.createFromSaveState(state);
        }
    },

    "F0": {
        name: "F0",
        desc: "64K Dynacom Megaboy",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length === 65536) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new Cartridge64K_F0(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return Cartridge64K_F0.createFromSaveState(state);
        }
    },

    "FE": {
        name: "FE",
        desc: "8K Robotank/Decathlon",
        priority: 103,
        tryFormat: function (rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new Cartridge8K_FE(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return Cartridge8K_FE.createFromSaveState(state);
        }
    },

    "F8": {
        name: "F8",
        desc: "8K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff8, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F6": {
        name: "F6",
        desc: "16K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 16384) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff6, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F4": {
        name: "F4",
        desc: "32K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 32768) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff4, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "FA": {
        name: "FA",
        desc: "12K CBS RAM Plus",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 12288) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff8, true, 256);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "EF": {
        name: "EF",
        desc: "8K-64K H. Runner (+RAM)",
        priority: 114,
        tryFormat: function(rom) {
            if (rom.content.length % 4096 === 0 && rom.content.length >= 8192 && rom.content.length <= 65536) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0fe0, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "3F": {
        name: "3F",
        desc: "8K-512K Tigervision",
        priority: 112,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new Cartridge8K_512K_3F(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return Cartridge8K_512K_3F.createFromSaveState(state);
        }
    },

    "3E": {
        name: "3E",
        desc: "8K-512K Tigervision (+RAM)",
        priority: 111,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new Cartridge8K_512K_3E(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return Cartridge8K_512K_3E.createFromSaveState(state);
        }
    }


};
