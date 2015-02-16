/**
 * Created by ppeccin on 08/11/2014.
 */

function M6502() {
    var self = this;

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.clockPulse = function() {
        if (!RDY) return;      // TODO Should be ignored in the last cycle of the instruction
        T++;
        instruction[T]();
    };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.setRDY = function(boo) {
        RDY = boo;
    };

    this.reset = function() {
        I = 1;
        T = -1;
        instruction = [ fetchOpcodeAndDecodeInstruction ];    // Bootstrap instruction
        PC = bus.read(RESET_VECTOR) | (bus.read(RESET_VECTOR + 1) << 8);
        this.setRDY(true);
    };


    // Interfaces
    var bus;
    var RDY = false;

    // Registers
    var PC = 0;
    var SP = 0;
    var A = 0;
    var X = 0;
    var Y = 0;

    // Status Bits
    var N = 0;
    var V = 0;
    var D = 0;
    var I = 0;
    var Z = 0;
    var C = 0;

    // Internal decoding registers
    var T = -1;
    var opcode = -1;
    var instruction;
    var data = 0;
    var AD = 0;
    var BA = 0;
    var BALCrossed = false;
    var IA = 0;
    var branchOffset = 0;
    var branchOffsetCrossAdjust = 0;

    // Vectors
    //var NMI_VECTOR = 0xfffa;
    var RESET_VECTOR = 0xfffc;
    var IRQ_VECTOR = 0xfffe;

    // Index registers names
    var rX = 0;
    var rY = 1;

    // Status bits names
    var bN = 7;
    var bV = 6;
    // var bE = 5;	// Not used
    // var bB = 4;	// Not used
    // var bD = 3;  // Not used
    // var bI = 2;  // Not used
    var bZ = 1;
    var bC = 0;

    // Auxiliary variables
    //noinspection JSUnusedGlobalSymbols
    this.debug = false;
    //noinspection JSUnusedGlobalSymbols
    this.trace = false;


    // Internal operations

    var fetchOpcodeAndDecodeInstruction = function() {
        opcode = bus.read(PC);

        //console.log(PC.toString(16) + ": " + (opcode.toString(16)));

        //if ((!opcode && opcode !== 0) || (opcode < 0 || opcode > 255)) {
        //    console.log(">>>> Invalid Opcode: " + opcode);
        //}

        instruction = instructions[opcode];

        //if (instruction[1] === illegalOpcode)
        //    "Illegal opcode just fetched";

        //if (PC === 0x459c /* && bus.read(0xa000) === 0x80 && bus.read(0xa003) === 0 */ ) { self.trace = true }

        T = 0;
        //if (self.trace) { self.breakpoint(); }

        PC++;
    };

    var fetchNextOpcode = fetchOpcodeAndDecodeInstruction;

    var fetchOpcodeAndDiscard = function() {
        bus.read(PC);
    };

    var fetchBranchOffset = function() {
        branchOffset = bus.read(PC);
        PC++;
    };

    var fetchADL = function() {
        AD = bus.read(PC);
        PC++;
    };

    var fetchADH = function() {
        AD |= bus.read(PC) << 8;
        PC++;
    };

    var fetchADLFromBA = function() {
        AD = bus.read(BA);
    };

    var fetchADHFromBA = function() {
        AD |= bus.read(BA) << 8;
    };

    var fetchBAL = function() {
        BA = bus.read(PC);
        PC++;
    };

    var fetchBAH = function() {
        BA |= bus.read(PC) << 8;
        PC++;
    };

    var fetchBALFromIA = function() {
        BA = bus.read(IA);
    };

    var fetchBAHFromIA = function() {
        BA |= bus.read(IA) << 8;
    };

    var addXtoBAL = function() {
        var low = (BA & 255) + X;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var addYtoBAL = function() {
        var low = (BA & 255) + Y;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var add1toBAL = function() {
        var low = (BA & 255) + 1;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var add1toBAHifBALCrossed = function() {
        if (BALCrossed)
            BA = (BA + 0x0100) & 0xffff;
    };

    var fetchIAL = function() {
        IA = bus.read(PC);
        PC++;
    };

    var fetchIAH = function() {
        IA |= bus.read(PC) << 8;
        PC++;
    };

    var add1toIAL = function() {
        var low = (IA & 255) + 1;
        IA = (IA & 0xff00) | (low & 255);
    };

    var fetchDataFromImmediate = function() {
        data = bus.read(PC);
        PC++;
    };

    var fetchDataFromAD = function() {
        data = bus.read(AD);
    };

    var fetchDataFromBA = function() {
        data = bus.read(BA);
    };

    var writeDataToAD = function() {
        bus.write(AD, data);
    };

    var writeDataToBA = function() {
        bus.write(BA, data);
    };

    var addBranchOffsetToPCL = function() {
        var oldLow = (PC & 0x00ff);
        var newLow = (oldLow + branchOffset) & 255;
        // Negative offset?
        if (branchOffset > 127)
            branchOffsetCrossAdjust = (newLow > oldLow) ? -0x0100 : 0;
        else
            branchOffsetCrossAdjust = (newLow < oldLow) ? 0x0100 : 0;
        PC = (PC & 0xff00) | newLow;
    };

    var adjustPCHForBranchOffsetCross = function() {
        PC = (PC + branchOffsetCrossAdjust) & 0xffff;
    };

    var setZ = function(val) {
        Z = (val === 0) ? 1 : 0;
    };

    var setN = function(val) {
        N = (val & 0x080) ? 1 : 0;
    };

    var setV = function(boo) {
        V = boo ? 1 : 0;
    };

    var setC = function(boo) {
        C = boo ? 1 : 0;
    };

    var popFromStack = function() {
        SP = (SP + 1) & 255;
        return bus.read(SP);
    };

    var peekFromStack = function() {
        return bus.read(SP);
    };

    var pushToStack = function(val) {
        bus.write(SP, val);
        SP = (SP - 1) & 255;
    };

    var getStatusBits = function() {
        return N << 7 | V << 6 | 0x30                 // Always push with E (bit 5) and B (bit 4) ON
            |  D << 3 | I << 2 | Z << 1 | C;
    };

    var setStatusBits = function(val) {
        N = val >>> 7; V = val >>> 6 & 1;             // E and B flags actually do not exist as real flags, so ignore
        D = val >>> 3 & 1; I = val >>> 2 & 1; Z = val >>> 1 & 1; C = val & 1;
    };

    var illegalOpcode = function() {
        if (self.debug) {
            console.log("Illegal Opcode!!!");
            self.breakpoint("Illegal Opcode!!!");
        }
        fetchNextOpcode();
    };


    // Addressing routines

    var implied = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var immediateRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchDataFromImmediate,
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var zeroPageRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            fetchDataFromAD,
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var absoluteRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            fetchDataFromAD,
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var indirectXRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function() {
                addXtoBAL();
                fetchADLFromBA();
            },
            function() {
                add1toBAL();
                fetchADHFromBA();
            },
            fetchDataFromAD,
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var absoluteIndexedRead = function(index) {
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,
                fetchBAH,
                function() {
                    if (index === rX) addXtoBAL(); else addYtoBAL();
                    fetchDataFromBA();
                    add1toBAHifBALCrossed();
                },
                function() {
                    if (BALCrossed) {
                        fetchDataFromBA();
                    } else {
                        operation();
                        fetchNextOpcode();
                    }
                },
                function() {
                    operation();
                    fetchNextOpcode();
                }
            ];
        };
    };

    var zeroPageIndexedRead = function(index) {
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,                        // BAH will be zero
                fetchDataFromBA,
                function() {
                    if (index === rX) addXtoBAL(); else addYtoBAL();
                    fetchDataFromBA();
                },
                function() {
                    operation();
                    fetchNextOpcode();
                }
            ];
        };
    };

    var indirectYRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,
            fetchBALFromIA,
            function() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function() {
                addYtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            function() {
                if(BALCrossed) {
                    fetchDataFromBA();
                } else {
                    operation();
                    fetchNextOpcode();
                }
            },
            function() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var zeroPageWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            function() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            function() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var indirectXWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function() {
                addXtoBAL();
                fetchADLFromBA();
            },
            function() {
                add1toBAL();
                fetchADHFromBA();
            },
            function() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteIndexedWrite = function(index) {
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,
                fetchBAH,
                function() {
                    if (index === rX) addXtoBAL(); else addYtoBAL();
                    fetchDataFromBA();
                    add1toBAHifBALCrossed();
                },
                function() {
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var zeroPageIndexedWrite = function(index) {
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,                        // BAH will be zero
                fetchDataFromBA,
                function() {
                    if (index === rX) addXtoBAL(); else addYtoBAL();
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var indirectYWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,
            fetchBALFromIA,
            function() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function() {
                addYtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            function() {
                operation();
                writeDataToBA();
            },
            fetchNextOpcode
        ];
    };


    var zeroPageReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            fetchDataFromAD,
            writeDataToAD,
            function() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            fetchDataFromAD,
            writeDataToAD,
            function() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var zeroPageXReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function() {
                addXtoBAL();
                fetchDataFromBA();
            },
            writeDataToBA,
            function() {
                operation();
                writeDataToBA();
            },
            fetchNextOpcode
        ];
    };

    var absoluteXReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,
            fetchBAH,
            function() {
                addXtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            fetchDataFromBA,
            writeDataToBA,
            function() {
                operation();
                writeDataToBA();
            },
            fetchNextOpcode
        ];
    };


    // Instructions  ========================================================================================

    // Complete instruction set
    var instructions = new Array(256);

    instructions[0x00] = BRK();
    instructions[0x01] = ORA(indirectXRead);
    instructions[0x02] = u();                        // Unsupported KIL
    instructions[0x03] = u();                        // Unsupported SLO
    instructions[0x04] = u();                        // Unsupported NOP
    instructions[0x05] = ORA(zeroPageRead);
    instructions[0x06] = ASL(zeroPageReadModifyWrite);
    instructions[0x07] = u();                        // Unsupported SLO
    instructions[0x08] = PHP();
    instructions[0x09] = ORA(immediateRead);
    instructions[0x0a] = ASL_ACC();
    instructions[0x0b] = u();                        // Unsupported ANC
    instructions[0x0c] = u();                        // Unsupported NOP
    instructions[0x0d] = ORA(absoluteRead);
    instructions[0x0e] = ASL(absoluteReadModifyWrite);
    instructions[0x0f] = u();                        // Unsupported SLO

    instructions[0x10] = Bxx(bN, 0);             // BPL
    instructions[0x11] = ORA(indirectYRead);
    instructions[0x12] = u();                        // Unsupported KIL
    instructions[0x13] = u();                        // Unsupported SLO
    instructions[0x14] = u();                        // Unsupported NOP
    instructions[0x15] = ORA(zeroPageIndexedRead(rX));
    instructions[0x16] = ASL(zeroPageXReadModifyWrite);
    instructions[0x17] = u();                        // Unsupported SLO
    instructions[0x18] = CLC();
    instructions[0x19] = ORA(absoluteIndexedRead(rY));
    instructions[0x1a] = u();                        // Unsupported NOP
    instructions[0x1b] = u();                        // Unsupported SLO
    instructions[0x1c] = u();                        // Unsupported NOP
    instructions[0x1d] = ORA(absoluteIndexedRead(rX));
    instructions[0x1e] = ASL(absoluteXReadModifyWrite);
    instructions[0x1f] = u();                        // Unsupported SLO

    instructions[0x20] = JSR();
    instructions[0x21] = AND(indirectXRead);
    instructions[0x22] = u();                        // Unsupported KIL
    instructions[0x23] = u();                        // Unsupported RLA
    instructions[0x24] = BIT(zeroPageRead);
    instructions[0x25] = AND(zeroPageRead);
    instructions[0x26] = ROL(zeroPageReadModifyWrite);
    instructions[0x27] = u();                        // Unsupported RLA
    instructions[0x28] = PLP();
    instructions[0x29] = AND(immediateRead);
    instructions[0x2a] = ROL_ACC();
    instructions[0x2b] = u();                        // Unsupported ANC
    instructions[0x2c] = BIT(absoluteRead);
    instructions[0x2d] = AND(absoluteRead);
    instructions[0x2e] = ROL(absoluteReadModifyWrite);
    instructions[0x2f] = u();                        // Unsupported RLA

    instructions[0x30] = Bxx(bN, 1);             // BMI
    instructions[0x31] = AND(indirectYRead);
    instructions[0x32] = u();                        // Unsupported KIL
    instructions[0x33] = u();                        // Unsupported RLA
    instructions[0x34] = u();                        // Unsupported NOP
    instructions[0x35] = AND(zeroPageIndexedRead(rX));
    instructions[0x36] = ROL(zeroPageXReadModifyWrite);
    instructions[0x37] = u();                        // Unsupported RLA
    instructions[0x38] = SEC();
    instructions[0x39] = AND(absoluteIndexedRead(rY));
    instructions[0x3a] = u();                        // Unsupported NOP
    instructions[0x3b] = u();                        // Unsupported RLA
    instructions[0x3c] = u();                        // Unsupported NOP
    instructions[0x3d] = AND(absoluteIndexedRead(rX));
    instructions[0x3e] = ROL(absoluteXReadModifyWrite);
    instructions[0x3f] = u();                        // Unsupported RLA

    instructions[0x40] = RTI();
    instructions[0x41] = EOR(indirectXRead);
    instructions[0x42] = u();                        // Unsupported KIL
    instructions[0x43] = u();                        // Unsupported SRE
    instructions[0x44] = u();                        // Unsupported NOP
    instructions[0x45] = EOR(zeroPageRead);
    instructions[0x46] = LSR(zeroPageReadModifyWrite);
    instructions[0x47] = u();                        // Unsupported SRE
    instructions[0x48] = PHA();
    instructions[0x49] = EOR(immediateRead);
    instructions[0x4a] = LSR_ACC();
    instructions[0x4b] = u();                        // Unsupported ASR
    instructions[0x4c] = JMP_ABS();
    instructions[0x4d] = EOR(absoluteRead);
    instructions[0x4e] = LSR(absoluteReadModifyWrite);
    instructions[0x4f] = u();                        // Unsupported SRE

    instructions[0x50] = Bxx(bV, 0);             // BVC
    instructions[0x51] = EOR(indirectYRead);
    instructions[0x52] = u();                        // Unsupported KIL
    instructions[0x53] = u();                        // Unsupported SRE
    instructions[0x54] = u();                        // Unsupported NOP
    instructions[0x55] = EOR(zeroPageIndexedRead(rX));
    instructions[0x56] = LSR(zeroPageXReadModifyWrite);
    instructions[0x57] = u();                        // Unsupported SRE
    instructions[0x58] = CLI();
    instructions[0x59] = EOR(absoluteIndexedRead(rY));
    instructions[0x5a] = u();                        // Unsupported NOP
    instructions[0x5b] = u();                        // Unsupported SRE
    instructions[0x5c] = u();                        // Unsupported NOP
    instructions[0x5d] = EOR(absoluteIndexedRead(rX));
    instructions[0x5e] = LSR(absoluteXReadModifyWrite);
    instructions[0x5f] = u();                        // Unsupported SRE

    instructions[0x60] = RTS();
    instructions[0x61] = ADC(indirectXRead);
    instructions[0x62] = u();                        // Unsupported KIL
    instructions[0x63] = u();                        // Unsupported RRA
    instructions[0x64] = u();                        // Unsupported NOP
    instructions[0x65] = ADC(zeroPageRead);
    instructions[0x66] = ROR(zeroPageReadModifyWrite);
    instructions[0x67] = u();                        // Unsupported RRA
    instructions[0x68] = PLA();
    instructions[0x69] = ADC(immediateRead);
    instructions[0x6a] = ROR_ACC();
    instructions[0x6b] = u();                        // Unsupported ARR
    instructions[0x6c] = JMP_IND();
    instructions[0x6d] = ADC(absoluteRead);
    instructions[0x6e] = ROR(absoluteReadModifyWrite);
    instructions[0x6f] = u();                        // Unsupported RRA

    instructions[0x70] = Bxx(bV, 1);             // BVS
    instructions[0x71] = ADC(indirectYRead);
    instructions[0x72] = u();                        // Unsupported KIL
    instructions[0x73] = u();                        // Unsupported RRA
    instructions[0x74] = u();                        // Unsupported NOP
    instructions[0x75] = ADC(zeroPageIndexedRead(rX));
    instructions[0x76] = ROR(zeroPageXReadModifyWrite);
    instructions[0x77] = u();                        // Unsupported RRA
    instructions[0x78] = SEI();
    instructions[0x79] = ADC(absoluteIndexedRead(rY));
    instructions[0x7a] = u();                        // Unsupported NOP
    instructions[0x7b] = u();                        // Unsupported RRA
    instructions[0x7c] = u();                        // Unsupported NOP
    instructions[0x7d] = ADC(absoluteIndexedRead(rX));
    instructions[0x7e] = ROR(absoluteXReadModifyWrite);
    instructions[0x7f] = u();                        // Unsupported SRE

    instructions[0x80] = u();                        // Unsupported NOP
    instructions[0x81] = STA(indirectXWrite);
    instructions[0x82] = u();                        // Unsupported NOP
    instructions[0x83] = u();                        // Unsupported SAX
    instructions[0x84] = STY(zeroPageWrite);
    instructions[0x85] = STA(zeroPageWrite);
    instructions[0x86] = STX(zeroPageWrite);
    instructions[0x87] = u();                        // Unsupported SAX
    instructions[0x88] = DEY();
    instructions[0x89] = u();                        // Unsupported NOP
    instructions[0x8a] = TXA();
    instructions[0x8b] = u();                        // Unsupported ANE
    instructions[0x8c] = STY(absoluteWrite);
    instructions[0x8d] = STA(absoluteWrite);
    instructions[0x8e] = STX(absoluteWrite);
    instructions[0x8f] = u();                        // Unsupported SAX

    instructions[0x90] = Bxx(bC, 0);             // BCC
    instructions[0x91] = STA(indirectYWrite);
    instructions[0x92] = u();                        // Unsupported KIL
    instructions[0x93] = u();                        // Unsupported SHA
    instructions[0x94] = STY(zeroPageIndexedWrite(rX));
    instructions[0x95] = STA(zeroPageIndexedWrite(rX));
    instructions[0x96] = STX(zeroPageIndexedWrite(rY));
    instructions[0x97] = u();                        // Unsupported SAX
    instructions[0x98] = TYA();
    instructions[0x99] = STA(absoluteIndexedWrite(rY));
    instructions[0x9a] = TXS();
    instructions[0x9b] = u();                        // Unsupported SHS
    instructions[0x9c] = u();                        // Unsupported SHY
    instructions[0x9d] = STA(absoluteIndexedWrite(rX));
    instructions[0x9e] = u();                        // Unsupported SHX
    instructions[0x9f] = u();                        // Unsupported SHA

    instructions[0xa0] = LDY(immediateRead);
    instructions[0xa1] = LDA(indirectXRead);
    instructions[0xa2] = LDX(immediateRead);
    instructions[0xa3] = u();                        // Unsupported LAX
    instructions[0xa4] = LDY(zeroPageRead);
    instructions[0xa5] = LDA(zeroPageRead);
    instructions[0xa6] = LDX(zeroPageRead);
    instructions[0xa7] = u();                        // Unsupported LAX
    instructions[0xa8] = TAY();
    instructions[0xa9] = LDA(immediateRead);
    instructions[0xaa] = TAX();
    instructions[0xab] = u();                        // Unsupported LXA
    instructions[0xac] = LDY(absoluteRead);
    instructions[0xad] = LDA(absoluteRead);
    instructions[0xae] = LDX(absoluteRead);
    instructions[0xaf] = u();                        // Unsupported LAX

    instructions[0xb0] = Bxx(bC, 1);             // BCS
    instructions[0xb1] = LDA(indirectYRead);
    instructions[0xb2] = u();                        // Unsupported KIL
    instructions[0xb3] = u();                        // Unsupported LAX
    instructions[0xb4] = LDY(zeroPageIndexedRead(rX));
    instructions[0xb5] = LDA(zeroPageIndexedRead(rX));
    instructions[0xb6] = LDX(zeroPageIndexedRead(rY));
    instructions[0xb7] = u();                        // Unsupported LAX
    instructions[0xb8] = CLV();
    instructions[0xb9] = LDA(absoluteIndexedRead(rY));
    instructions[0xba] = TSX();
    instructions[0xbb] = u();                        // Unsupported LAS
    instructions[0xbc] = LDY(absoluteIndexedRead(rX));
    instructions[0xbd] = LDA(absoluteIndexedRead(rX));
    instructions[0xbe] = LDX(absoluteIndexedRead(rY));
    instructions[0xbf] = u();                        // Unsupported LAX

    instructions[0xc0] = CPY(immediateRead);
    instructions[0xc1] = CMP(indirectXRead);
    instructions[0xc2] = u();                        // Unsupported NOP
    instructions[0xc3] = u();                        // Unsupported DCP
    instructions[0xc4] = CPY(zeroPageRead);
    instructions[0xc5] = CMP(zeroPageRead);
    instructions[0xc6] = DEC(zeroPageReadModifyWrite);
    instructions[0xc7] = u();                        // Unsupported DCP
    instructions[0xc8] = INY();
    instructions[0xc9] = CMP(immediateRead);
    instructions[0xca] = DEX();
    instructions[0xcb] = u();                        // Unsupported SBX
    instructions[0xcc] = CPY(absoluteRead);
    instructions[0xcd] = CMP(absoluteRead);
    instructions[0xce] = DEC(absoluteReadModifyWrite);
    instructions[0xcf] = u();                        // Unsupported DCP

    instructions[0xd0] = Bxx(bZ, 0);             // BNE
    instructions[0xd1] = CMP(indirectYRead);
    instructions[0xd2] = u();                        // Unsupported KIL
    instructions[0xd3] = u();                        // Unsupported DCP
    instructions[0xd4] = u();                        // Unsupported NOP
    instructions[0xd5] = CMP(zeroPageIndexedRead(rX));
    instructions[0xd6] = DEC(zeroPageXReadModifyWrite);
    instructions[0xd7] = u();                        // Unsupported DCP
    instructions[0xd8] = CLD();
    instructions[0xd9] = CMP(absoluteIndexedRead(rY));
    instructions[0xda] = u();                        // Unsupported NOP
    instructions[0xdb] = u();                        // Unsupported DCP
    instructions[0xdc] = u();                        // Unsupported NOP
    instructions[0xdd] = CMP(absoluteIndexedRead(rX));
    instructions[0xde] = DEC(absoluteXReadModifyWrite);
    instructions[0xdf] = u();                        // Unsupported LAX

    instructions[0xe0] = CPX(immediateRead);
    instructions[0xe1] = SBC(indirectXRead);
    instructions[0xe2] = u();                        // Unsupported NOP
    instructions[0xe3] = u();                        // Unsupported ISB
    instructions[0xe4] = CPX(zeroPageRead);
    instructions[0xe5] = SBC(zeroPageRead);
    instructions[0xe6] = INC(zeroPageReadModifyWrite);
    instructions[0xe7] = u();                        // Unsupported ISB
    instructions[0xe8] = INX();
    instructions[0xe9] = SBC(immediateRead);
    instructions[0xea] = NOP();
    instructions[0xeb] = u();                        // Unsupported SBC
    instructions[0xec] = CPX(absoluteRead);
    instructions[0xed] = SBC(absoluteRead);
    instructions[0xee] = INC(absoluteReadModifyWrite);
    instructions[0xef] = u();                        // Unsupported ISB

    instructions[0xf0] = Bxx(bZ, 1);             // BEQ
    instructions[0xf1] = SBC(indirectYRead);
    instructions[0xf2] = u();                        // Unsupported KIL
    instructions[0xf3] = u();                        // Unsupported ISB
    instructions[0xf4] = u();                        // Unsupported NOP
    instructions[0xf5] = SBC(zeroPageIndexedRead(rX));
    instructions[0xf6] = INC(zeroPageXReadModifyWrite);
    instructions[0xf7] = u();                        // Unsupported ISB
    instructions[0xf8] = SED();
    instructions[0xf9] = SBC(absoluteIndexedRead(rY));
    instructions[0xfa] = u();                        // Unsupported NOP
    instructions[0xfb] = u();                        // Unsupported ISB
    instructions[0xfc] = u();                        // Unsupported NOP
    instructions[0xfd] = SBC(absoluteIndexedRead(rX));
    instructions[0xfe] = INC(absoluteXReadModifyWrite);
    instructions[0xff] = u();                        // Unsupported ISB


    // Single Byte instructions

    function ASL_ACC() {
        return implied(function() {
            setC(A > 127);
            A = (A << 1) & 255;
            setZ(A);
            setN(A);
        });
    }

    function CLC() {
        return implied(function() {
            C = 0;
        });
    }

    function CLD() {
        return implied(function() {
            D = 0;
        });
    }

    function CLI() {
        return implied(function() {
            I = 0;
        });
    }

    function CLV() {
        return implied(function() {
            V = 0;
        });
    }

    function DEX() {
        return implied(function() {
            X = (X - 1) & 255;
            setZ(X);
            setN(X);
        });
    }

    function DEY() {
        return implied(function() {
            Y = (Y - 1) & 255;
            setZ(Y);
            setN(Y);
        });
    }

    function INX() {
        return implied(function() {
            X = (X + 1) & 255;
            setZ(X);
            setN(X);
        });
    }

    function INY() {
        return implied(function() {
            Y = (Y + 1) & 255;
            setZ(Y);
            setN(Y);
        });
    }

    function LSR_ACC() {
        return implied(function() {
            C = A & 0x01;
            A >>>= 1;
            setZ(A);
            N = 0;
        });
    }

    function NOP() {
        return implied(function() {
            // nothing
        });
    }

    function ROL_ACC() {
        return implied(function() {
            var newC = A > 127;
            A = ((A << 1) | C) & 255;
            setC(newC);
            setZ(A);
            setN(A);
        });
    }

    function ROR_ACC() {
        return implied(function() {
            var newC = A & 0x01;
            A = (A >>> 1) | (C << 7);
            setC(newC);
            setZ(A);
            setN(A);
        });
    }

    function SEC() {
        return implied(function() {
            C = 1;
        });
    }

    function SED() {
        return implied(function() {
            D = 1;
        });
    }

    function SEI() {
        return implied(function() {
            I = 1;
        });
    }

    function TAX() {
        return implied(function() {
            X = A;
            setZ(X);
            setN(X);
        });
    }

    function TAY() {
        return implied(function() {
            Y = A;
            setZ(Y);
            setN(Y);
        });
    }

    function TSX() {
        return implied(function() {
            X = SP;
            setZ(X);
            setN(X);
        });
    }

    function TXA() {
        return implied(function() {
            A = X;
            setZ(A);
            setN(A);
        });
    }

    function TXS() {
        return implied(function() {
            SP = X;
        });
    }

    function TYA() {
        return implied(function() {
            A = Y;
            setZ(A);
            setN(A);
        });
    }


    // Internal Execution on Memory Data

    function ADC(addressing) {
        return addressing(function() {
            if (D) {
                var operand = data;
                var AL = (A & 15) + (operand & 15) + C;
                if (AL > 9) { AL += 6; }
                var AH = ((A >> 4) + (operand >> 4) + (AL > 15)) << 4;
                setZ((A + operand + C) & 255);
                setN(AH);
                setV(((A ^AH) & ~(A ^ operand)) & 128);
                if (AH > 0x9f) { AH += 0x60; }
                setC(AH > 255);
                A = (AH | (AL & 15)) & 255;
            } else {
                var add = A + data + C;
                setC(add > 255);
                setV(((A ^ add) & (data ^ add)) & 0x80);
                A = add & 255;
                setZ(A);
                setN(A);
            }
        });
    }

    function AND(addressing) {
        return addressing(function() {
            A &= data;
            setZ(A);
            setN(A);
        });
    }

    function BIT(addressing) {
        return addressing(function() {
            var par = data;
            setZ(A & par);
            setV(par & 0x40);
            setN(par);
        });
    }

    function CMP(addressing) {
        return addressing(function() {
            var val = (A - data) & 255;
            setC(A >= data);
            setZ(val);
            setN(val);
        });
    }

    function CPX(addressing) {
        return addressing(function() {
            var val = (X - data) & 255;
            setC(X >= data);
            setZ(val);
            setN(val);
        });
    }

    function CPY(addressing) {
        return addressing(function() {
            var val = (Y - data) & 255;
            setC(Y >= data);
            setZ(val);
            setN(val);
        });
    }

    function EOR(addressing) {
        return addressing(function() {
            A ^= data;
            setZ(A);
            setN(A);
        });
    }

    function LDA(addressing) {
        return addressing(function() {
            A = data;
            setZ(A);
            setN(A);
        });
    }

    function LDX(addressing) {
        return addressing(function() {
            X = data;
            setZ(X);
            setN(X);
        });
    }

    function LDY(addressing) {
        return addressing(function() {
            Y = data;
            setZ(Y);
            setN(Y);
        });
    }

    function ORA(addressing) {
        return addressing(function() {
            A |= data;
            setZ(A);
            setN(A);
        });
    }

    function SBC(addressing) {
        return addressing(function() {
            if (D) {
                var operand = data;
                var AL = (A & 15) - (operand & 15) - (1-C);
                var AH = (A >> 4) - (operand >> 4) - (AL < 0);
                if (AL < 0) { AL -= 6; }
                if (AH < 0) { AH -= 6; }
                var sub = A - operand - (1-C);
                setC(~sub & 256);
                setV(((A ^ operand) & (A ^ sub)) & 128);
                setZ(sub & 255);
                setN(sub);
                A = ((AH << 4) | (AL & 15)) & 255;
            } else {
                operand = (~data) & 255;
                sub = A + operand + C;
                setC(sub > 255);
                setV(((A ^ sub) & (operand ^ sub) & 0x80));
                A = sub & 255;
                setZ(A);
                setN(A);
            }
        });
    }


    // Store operations

    function STA(addressing) {
        return addressing(function() {
            data = A;
        });
    }

    function STX(addressing) {
        return addressing(function() {
            data = X;
        });
    }

    function STY(addressing) {
        return addressing(function() {
            data = Y;
        });
    }


    // Read-Modify-Write operations

    function ASL(addressing) {
        return addressing(function() {
            setC(data > 127);
            var par = (data << 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function DEC(addressing) {
        return addressing(function() {
            var par = (data - 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function INC(addressing) {
        return addressing(function() {
            var par = (data + 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function LSR(addressing) {
        return addressing(function() {
            C = data & 0x01;
            data >>>= 1;
            setZ(data);
            N = 0;
        });
    }

    function ROL(addressing) {
        return addressing(function() {
            var newC = data > 127;
            var par = ((data << 1) | C) & 255;
            data = par;
            setC(newC);
            setZ(par);
            setN(par);
        });
    }

    function ROR(addressing) {
        return addressing(function() {
            var newC = data & 0x01;
            var par = (data >>> 1) | (C << 7);
            data = par;
            setC(newC);
            setZ(par);
            setN(par);
        });
    }


    // Miscellaneous operations

    function PHA() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function() { pushToStack(A); },
            fetchNextOpcode
        ];
    }

    function PHP() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function() { pushToStack(getStatusBits()); },
            fetchNextOpcode
        ];
    }

    function PLA() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function() {
                A = popFromStack();
                setZ(A);
                setN(A);
            },
            fetchNextOpcode
        ];
    }

    function PLP() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function() { setStatusBits(popFromStack()); },
            fetchNextOpcode
        ];
    }

    function JSR() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            peekFromStack,
            function() { pushToStack((PC >>> 8)  & 0xff); },
            function() { pushToStack(PC & 0xff); },
            fetchADH,
            function() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function BRK() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchDataFromImmediate,                 // For debugging purposes, use operand as an arg for BRK!
            function() {
                if (self.debug) { self.breakpoint("BRK " + data); }
                pushToStack((PC >>> 8) & 0xff);
            },
            function() { pushToStack(PC & 0xff); },
            function() { pushToStack(getStatusBits()); },
            function() { AD = bus.read(IRQ_VECTOR); },
            function() { AD |= bus.read(IRQ_VECTOR + 1) << 8; },
            function() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function RTI() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function() { setStatusBits(popFromStack()); },
            function() { AD = popFromStack(); },
            function() { AD |= popFromStack() << 8; },
            function() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function RTS() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function() { AD = popFromStack(); },
            function() { AD |= popFromStack() << 8; },
            function() { PC = AD; fetchDataFromImmediate(); },
            fetchNextOpcode
        ];
    }

    function JMP_ABS() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            function() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function JMP_IND() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,
            fetchIAH,
            fetchBALFromIA,
            function() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function() { PC = BA; fetchNextOpcode(); }
        ];
    }

    function Bxx(reg, cond) {
        function branchTaken() {
            if (reg === bZ) {
                return Z === cond;
            } else if (reg === bN) {
                return N === cond;
            } else if (reg === bC) {
                return C === cond;
            } else {
                return V === cond;
            }
        }
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBranchOffset,
            function() {
                if (branchTaken()) {
                    fetchOpcodeAndDiscard();
                    addBranchOffsetToPCL();
                } else {
                    fetchNextOpcode();
                }
            },
            function() {
                if(branchOffsetCrossAdjust) {
                    fetchOpcodeAndDiscard();
                    adjustPCHForBranchOffsetCross();
                } else {
                    fetchNextOpcode();
                }
            },
            fetchNextOpcode
        ];
    }

    // Special instructions

    function u() {
        return [
            fetchOpcodeAndDecodeInstruction,
            illegalOpcode
        ];
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            PC: PC, A: A, X: X, Y: Y, SP: SP,
            N: N, V: V, D: D, I: I, Z: Z, C: C,
            T: T, opcode: opcode, RDY: RDY,
            data: data, AD: AD, BA: BA, BALCrossed: BALCrossed, IA: IA,
            branchOffset: branchOffset, branchOffsetCrossAdjust: branchOffsetCrossAdjust
        };
    };

    this.loadState = function(state) {
        PC = state.PC; A = state.A; X = state.X; Y = state.Y; SP = state.SP;
        N = state.N; V = state.V; D = state.D; I = state.I; Z = state.Z; C = state.C;
        T = state.T; opcode = state.opcode; RDY = state.RDY;
        data = state.data; AD = state.AD; BA = state.BA; BALCrossed = state.BALCrossed; IA = state.IA;
        branchOffset = state.branchOffset; branchOffsetCrossAdjust = state.branchOffsetCrossAdjust;

        instruction = instructions[opcode];
    };


    // Accessory methods

    this.toString = function() {
        return "CPU " +
            " PC: " + PC.toString(16) + "  op: " + opcode.toString() + "  T: " + T + "  data: " + data + "\n" +
            " A: " + A.toString(16) + "  X: " + X.toString(16) + "  Y: " + Y.toString(16) + "  SP: " + SP.toString(16) + "     " +
            "N" + N + "  " + "V" + V + "  " + "D" + D + "  " + "I" + I + "  " + "Z" + Z + "  " + "C" + C + "  ";
    };

    this.breakpoint = function(mes) {
        if (this.trace) {
            var text = "CPU Breakpoint!  " + (mes ? "(" + mes + ")" : "") + "\n\n" + this.toString();
            alert(text);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    this.runCycles = function(cycles) {
        //noinspection JSUnresolvedVariable
        var start = performance.now();
        for (var i = 0; i < cycles; i++) {
            this.clockPulse();
        }
        //noinspection JSUnresolvedVariable
        var end = performance.now();
        alert("Done running " + cycles + " cycles in " + (end - start) + " ms.");
    };

}


