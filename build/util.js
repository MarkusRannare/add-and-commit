"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOutput = exports.parseBool = exports.log = exports.getInput = exports.outputs = void 0;
const core = __importStar(require("@actions/core"));
const assert_1 = __importDefault(require("assert"));
exports.outputs = {
    committed: 'false',
    pushed: 'false',
    tagged: 'false'
};
const fakeData = false;
function fakeInput(name) {
    switch (name) {
        case 'add':
            return '-A';
        case 'author_name':
            return 'Your Name';
        case 'author_email':
            return 'mail@example.com';
        case 'branch':
            return 'v2.1.0';
        case 'parent_branch':
            return 'main';
        case 'cwd':
            return 'debug-data';
        case 'message':
            return 'Your commit message';
        case 'pull_strategy':
            return '--no-rebase';
        case 'remove':
            return '';
        case 'push':
            return 'true';
        case 'signoff':
            return 'false';
        case 'tag':
            return 'rel-v2.1.1';
    }
    // Should never reach here
    assert_1.default(false);
    return '';
}
function getInput(name) {
    if (fakeData) {
        return fakeInput(name);
    }
    return core.getInput(name);
}
exports.getInput = getInput;
function log(err, data) {
    if (data)
        console.log(data);
    if (err)
        core.error(err);
}
exports.log = log;
function parseBool(value) {
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed == 'boolean')
            return parsed;
    }
    catch (_a) { }
}
exports.parseBool = parseBool;
function setOutput(name, value) {
    core.debug(`Setting output: ${name}=${value}`);
    exports.outputs[name] = value;
    return core.setOutput(name, value);
}
exports.setOutput = setOutput;
for (const key in exports.outputs)
    setOutput(key, exports.outputs[key]);
