// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.CartridgeFormats = {

    "4K": {
        name: "4K",
        desc: "4K Atari",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length >= 8 && rom.content.length <= 4096 && 4096 % rom.content.length === 0) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge4K(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge4K.recreateFromSaveState(state, cart);
        }
    },

    "CV": {
        name: "CV",
        desc: "2K Commavid +RAM",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 2048 || rom.content.length === 4096) return this;	// Also accepts 4K ROMs
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge2K_CV(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge2K_CV.recreateFromSaveState(state, cart);
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
            return new jt.Cartridge8K_E0(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_E0.recreateFromSaveState(state, cart);
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
            return new jt.Cartridge64K_F0(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge64K_F0.recreateFromSaveState(state, cart);
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
            return new jt.Cartridge8K_FE(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_FE.recreateFromSaveState(state, cart);
        }
    },

    "E7": {
        name: "E7",
        desc: "16K M-Network",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 16384) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge16K_E7(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge16K_E7.recreateFromSaveState(state, cart);
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
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff8, null, 128);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.CartridgeBankedByMaskedRange.recreateFromSaveState(state, cart);
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
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff6, null, 128);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.CartridgeBankedByMaskedRange.recreateFromSaveState(state, cart);
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
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff4, null, 128);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.CartridgeBankedByMaskedRange.recreateFromSaveState(state, cart);
        }
    },

    "FA2cu": {
        name: "FA2cu",
        desc: "32K CBS RAM+ CU Image",
        priority: 103,
        tryFormat: function(rom) {
            if (rom.content.length === 32768) {
                // Check for the values $10adab1e, for "loadable", starting at position 32 (33rd byte)
                // This is a hint that the content is in CU format
                var foundHint = jt.Util.arraysEqual(rom.content.slice(32, 32 + 4), this.cuMagicWord);
                this.priority = 103 - (foundHint ? 30 : 0);
                return this;
            }
        },
        createCartridgeFromRom: function(rom) {
            // ROM is only 28K. The first 1024 bytes are custom ARM content. ROM begins after that
            return new jt.Cartridge24K_28K_32K_FA2(rom, this, 1024);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge24K_28K_32K_FA2.recreateFromSaveState(state, cart);
        },
        cuMagicWord: [0x1e, 0xab, 0xad, 0x10]
    },

    "FA2": {
        name: "FA2",
        desc: "24K/28K/32K CBS RAM+",
        priority: 102,
        tryFormat: function(rom) {
            if (rom.content.length === 24576 || rom.content.length === 28672 || rom.content.length === 32768) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge24K_28K_32K_FA2(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge24K_28K_32K_FA2.recreateFromSaveState(state, cart);
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
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff8, true, 256);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.CartridgeBankedByMaskedRange.recreateFromSaveState(state, cart);
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
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0fe0, null, 128);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.CartridgeBankedByMaskedRange.recreateFromSaveState(state, cart);
        }
    },

    "DPC": {
        name: "DPC",
        desc: "10K DPC Pitfall 2 (Enhanced)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length >= (8192 + 2048) && rom.content.length <= (8192 + 2048 + 256)) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge10K_DPCa(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge10K_DPCa.recreateFromSaveState(state, cart);
        }
    },

    "3F": {
        name: "3F",
        desc: "8K-512K Tigervision",
        priority: 112,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length >= 2048 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_512K_3F(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_512K_3F.recreateFromSaveState(state, cart);
        }
    },

    "3E": {
        name: "3E",
        desc: "8K-512K Tigervision (+RAM)",
        priority: 111,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length >= 2048 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_512K_3E(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_512K_3E.recreateFromSaveState(state, cart);
        }
    },

    "X07": {
        name: "X07",
        desc: "64K AtariAge",
        priority: 102,
        tryFormat: function(rom) {
            if (rom.content.length === 65536) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge64K_X07(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge64K_X07.recreateFromSaveState(state, cart);
        }
    },

    "0840": {
        name: "0840",
        desc: "8K Econobanking",
        priority: 116,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_0840(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_0840.recreateFromSaveState(state, cart);
        }
    },

    "UA": {
        name: "UA",
        desc: "8K UA Limited",
        priority: 115,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_UA(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_UA.recreateFromSaveState(state, cart);
        }
    },

    "SB": {
        name: "SB",
        desc: "8K-256K Superbanking",
        priority: 113,
        tryFormat: function(rom) {
            if (rom.content.length % 4096 === 0 && rom.content.length >= 8192 && rom.content.length <= 64 * 4096) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_256K_SB(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_256K_SB.recreateFromSaveState(state, cart);
        }
    },

    "AR": {
        name: "AR",
        desc: "8K-64K Arcadia/Supercharger",
        priority: 101,
        tryFormat: function(rom) {
            // Any number of parts between 1 and 8
            if (rom.content.length % jt.Cartridge8K_64K_AR.PART_SIZE === 0 && rom.content.length / jt.Cartridge8K_64K_AR.PART_SIZE >= 1
                && rom.content.length / jt.Cartridge8K_64K_AR.PART_SIZE <= 8) {
                // Check if the content starts with Part 0
                if (jt.Cartridge8K_64K_AR.checkTape(rom)) return this;       // Accepts only a Tape Start or Full Tape
            }
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_64K_AR(rom, this);
        },
        recreateCartridgeFromSaveState: function(state, cart) {
            return jt.Cartridge8K_64K_AR.recreateFromSaveState(state, cart);
        }
    }

};


// Formats available for user selection, in order
jt.CartridgeFormatsUserOptions = [
    "4K",
    "CV",
    "E0",
    "F0",
    "FE",
    "E7",
    "F8",
    "F6",
    "F4",
    "FA2cu",
    "FA2",
    "FA",
    "EF",
    "DPC",
    "3F",
    "3E",
    "X07",
    "0840",
    "UA",
    "SB",
    "AR"
];