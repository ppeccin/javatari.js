// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Util = new function() {
"use strict";

    this.log = function(str) {
        console.log(">> Javatari: " + str);
    };

    this.message = function(str) {
        alert(str);
    };

    this.arraysEqual = function(a, b) {
        var i = a.length;
        if (i !== b.length) return false;
        while (i--)
            if (a[i] !== b[i]) return false;
        return true;
    };

    this.arrayFill = function(arr, val) {
        var i = arr.length;
        while(i--)
            arr[i] = val;
        return arr;
    };

    this.arrayFillWithArrayClone = function(arr, val) {
        var i = arr.length;
        while(i--)
            arr[i] = val.slice(0);
        return arr;
    };

    this.arrayFillSegment = function(arr, from, to, val) {
        //noinspection UnnecessaryLocalVariableJS
        var i = to;
        while(i-- > from)
            arr[i] = val;
        return arr;
    };

    this.arrayCopy = function(src, srcPos, dest, destPos, length) {
        var finalSrcPos = srcPos + length;
        while(srcPos < finalSrcPos)
            dest[destPos++] = src[srcPos++];
    };

    this.arrayCopyCircularSourceWithStep = function(src, srcPos, srcLength, srcStep, dest, destPos, destLength) {
        var s = srcPos;
        var d = destPos;
        var destEnd = destPos + destLength;
        while (d < destEnd) {
            dest[d] = src[s | 0];   // as integer
            d++;
            s += srcStep;
            if (s >= srcLength) s -= srcLength;
        }
    };

    this.arrayRemove = function(arr, element) {
        var i = arr.indexOf(element);
        if (i < 0) return;
        arr.splice(i, 1);
    };

    // Only 8 bit values
    this.uInt8ArrayToByteString = function(ints) {
        var str = "";
        for(var i = 0, len = ints.length; i < len; i++)
            str += String.fromCharCode(ints[i] & 0xff);
        return str;
    };

    this.byteStringToUInt8Array = function(str) {
        var ints = [];
        for(var i = 0, len = str.length; i < len; i++)
            ints.push(str.charCodeAt(i) & 0xff);
        return ints;
    };

    this.reverseInt8 = function(val) {
        return ((val & 0x01) << 7) | ((val & 0x02) << 5) | ((val & 0x04) << 3) | ((val & 0x08) << 1) | ((val & 0x10) >> 1) | ((val & 0x20) >> 3) | ((val & 0x40) >> 5) | ((val & 0x80) >> 7);
    };

    // Only 32 bit values
    this.int32BitArrayToByteString = function(ints, start, length) {
        if (ints === null || ints == undefined) return ints;
        if (start === undefined) start = 0;
        if (length === undefined) length = ints.length - start;
        var str = "";
        for(var i = start, finish = start + length; i < finish; i = i + 1)
            str += String.fromCharCode(ints[i] & 0xff) + String.fromCharCode((ints[i] >> 8) & 0xff) + String.fromCharCode((ints[i] >> 16) & 0xff) + String.fromCharCode((ints[i] >> 24) & 0xff);
        return str;
    };

    this.byteStringToInt32BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = (str.length / 4) | 0;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);      // Preserve dest type
        for(var i = 0, s = 0; i < len; i = i + 1, s = s + 4)
            ints[i] = (str.charCodeAt(s) & 0xff) | ((str.charCodeAt(s + 1) & 0xff) << 8) | ((str.charCodeAt(s + 2) & 0xff) << 16) | ((str.charCodeAt(s + 3) & 0xff) << 24);
        return ints;
    };

    this.storeInt32BitArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.int32BitArrayToByteString(arr));
    };

    this.restoreStringBase64ToInt32BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToInt32BitArray(atob(str), dest);
    };

    this.browserInfo = function() {
        if (this.browserInfoAvailable) return this.browserInfoAvailable;

        var ua = navigator.userAgent;
        var temp;
        var m = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(m[1])) {
            temp = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return this.browserInfoAvailable = { name:'IE', version: (temp[1] || '') };
        }
        if (m[1] === 'Chrome') {
            temp = ua.match(/\bOPR\/(\d+)/);
            if (temp != null) return this.browserInfoAvailable = { name:'Opera', version: temp[1] };
        }
        m = m[2] ? [m[1], m[2]]: [ navigator.appName, navigator.appVersion, '-?' ];
        if ((temp = ua.match(/version\/(\d+)/i)) != null) m.splice(1, 1, temp[1]);
        return this.browserInfoAvailable = {
            name: m[0].toUpperCase(),
            version: m[1]
        };
    };

};


