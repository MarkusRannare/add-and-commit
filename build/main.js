"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const path_1 = __importDefault(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const util_1 = require("./util");
const baseDir = path_1.default.join(process.cwd(), util_1.getInput('cwd') || '');
const git = simple_git_1.default({ baseDir });
console.log(`Running in ${baseDir}`);
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield checkInputs().catch(core_1.setFailed);
    core_1.startGroup('Internal logs');
    core_1.info('> Staging files...');
    if (util_1.getInput('add')) {
        core_1.info('> Adding files...');
        yield add();
    }
    else
        core_1.info('> No files to add.');
    if (util_1.getInput('remove')) {
        core_1.info('> Removing files...');
        yield remove();
    }
    else
        core_1.info('> No files to remove.');
    core_1.info('> Checking for uncommitted changes in the git working tree...');
    const changedFiles = (yield git.diffSummary(['--cached'])).files.length;
    if (changedFiles > 0) {
        core_1.info(`> Found ${changedFiles} changed files.`);
        yield git
            .addConfig('user.email', util_1.getInput('author_email'), undefined, util_1.log)
            .addConfig('user.name', util_1.getInput('author_name'), undefined, util_1.log);
        core_1.debug('> Current git config\n' +
            JSON.stringify((yield git.listConfig()).all, null, 2));
        yield git.fetch(['--tags', '--force'], util_1.log);
        const listRemoteResults = yield git.listRemote([
            '--heads',
            'origin',
            util_1.getInput('branch')
        ]);
        const desiredBranch = listRemoteResults
            ? util_1.getInput('branch')
            : util_1.getInput('parent_branch');
        core_1.info("> Switching to branch '" + desiredBranch + "'...");
        yield git.checkout(desiredBranch, undefined, util_1.log);
        core_1.info('> Pulling from remote...');
        yield git.fetch(undefined, util_1.log).pull(undefined, undefined, {
            [util_1.getInput('pull_strategy')]: null
        }, util_1.log);
        // If we got something here, then it means that the branch existed, switch to it and update it
        if (!listRemoteResults) {
            // Create new branch
            yield git.checkoutLocalBranch(util_1.getInput('branch'), util_1.log);
        }
        core_1.info('> Re-staging files...');
        if (util_1.getInput('add'))
            yield add({ ignoreErrors: true });
        if (util_1.getInput('remove'))
            yield remove({ ignoreErrors: true });
        core_1.info('> Creating commit...');
        yield git.commit(util_1.getInput('message'), undefined, Object.assign({ '--author': `"${util_1.getInput('author_name')} <${util_1.getInput('author_email')}>"` }, (util_1.getInput('signoff')
            ? {
                '--signoff': null
            }
            : {})), (err, data) => {
            if (data)
                util_1.setOutput('committed', 'true');
            return util_1.log(err, data);
        });
        if (util_1.getInput('tag')) {
            core_1.info('> Tagging commit...');
            yield git
                .tag(util_1.getInput('tag').split(' '), (err, data) => {
                if (data)
                    util_1.setOutput('tagged', 'true');
                return util_1.log(err, data);
            })
                .then((data) => {
                util_1.setOutput('tagged', 'true');
                return util_1.log(null, data);
            })
                .catch((err) => core_1.setFailed(err));
        }
        else
            core_1.info('> No tag info provided.');
        const pushOption = (_a = util_1.parseBool(util_1.getInput('push'))) !== null && _a !== void 0 ? _a : util_1.getInput('push');
        if (pushOption) {
            // If the options is `true | string`...
            core_1.info('> Pushing commit to repo...');
            if (pushOption) {
                core_1.debug(`Running: git push origin ${util_1.getInput('branch')} --set-upstream`);
                yield git.push('origin', util_1.getInput('branch'), { '--set-upstream': null }, (err, data) => {
                    if (data)
                        util_1.setOutput('pushed', 'true');
                    return util_1.log(err, data);
                });
            }
            else {
                core_1.debug(`Running: git push ${pushOption}`);
                yield git.push(undefined, undefined, pushOption.split(' '), (err, data) => {
                    if (data)
                        util_1.setOutput('pushed', 'true');
                    return util_1.log(err, data);
                });
            }
            if (util_1.getInput('tag')) {
                core_1.info('> Pushing tags to repo...');
                yield git
                    .pushTags('origin', undefined, (e, d) => util_1.log(undefined, e || d))
                    .catch(() => {
                    core_1.info('> Tag push failed: deleting remote tag and re-pushing...');
                    return git
                        .push(undefined, undefined, {
                        '--delete': null,
                        origin: null,
                        [util_1.getInput('tag')
                            .split(' ')
                            .filter((w) => !w.startsWith('-'))[0]]: null
                    }, util_1.log)
                        .pushTags('origin', undefined, util_1.log);
                });
            }
            else
                core_1.info('> No tags to push.');
        }
        else
            core_1.info('> Not pushing anything.');
        core_1.endGroup();
        core_1.info('> Task completed.');
    }
    else {
        core_1.endGroup();
        core_1.info('> Working tree clean. Nothing to commit.');
    }
}))()
    .then(logOutputs)
    .catch((e) => {
    core_1.endGroup();
    logOutputs();
    core_1.setFailed(e);
});
function checkInputs() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        function setInput(input, value) {
            if (value)
                return (process.env[`INPUT_${input.toUpperCase()}`] = value);
            else
                return delete process.env[`INPUT_${input.toUpperCase()}`];
        }
        function setDefault(input, value) {
            if (!util_1.getInput(input))
                setInput(input, value);
            return util_1.getInput(input);
        }
        const eventPath = process.env.GITHUB_EVENT_PATH, event = eventPath && require(eventPath), isPR = (_a = process.env.GITHUB_EVENT_NAME) === null || _a === void 0 ? void 0 : _a.includes('pull_request'), defaultBranch = isPR
            ? (_c = (_b = event === null || event === void 0 ? void 0 : event.pull_request) === null || _b === void 0 ? void 0 : _b.head) === null || _c === void 0 ? void 0 : _c.ref
            : (_d = process.env.GITHUB_REF) === null || _d === void 0 ? void 0 : _d.substring(11);
        // #region add, remove
        if (!util_1.getInput('add') && !util_1.getInput('remove'))
            throw new Error("Both 'add' and 'remove' are empty, the action has nothing to do.");
        if (util_1.getInput('add')) {
            const parsed = parseInputArray(util_1.getInput('add'));
            if (parsed.length == 1)
                core_1.info('Add input parsed as single string, running 1 git add command.');
            else if (parsed.length > 1)
                core_1.info(`Add input parsed as string array, running ${parsed.length} git add commands.`);
            else
                core_1.setFailed('Add input: array length < 1');
        }
        if (util_1.getInput('remove')) {
            const parsed = parseInputArray(util_1.getInput('remove'));
            if (parsed.length == 1)
                core_1.info('Remove input parsed as single string, running 1 git rm command.');
            else if (parsed.length > 1)
                core_1.info(`Remove input parsed as string array, running ${parsed.length} git rm commands.`);
            else
                core_1.setFailed('Remove input: array length < 1');
        }
        // #endregion
        // #region author_name, author_email
        setDefault('author_name', `${process.env.GITHUB_ACTOR}`);
        setDefault('author_email', `${process.env.GITHUB_ACTOR}@users.noreply.github.com`);
        core_1.info(`> Using '${util_1.getInput('author_name')} <${util_1.getInput('author_email')}>' as author.`);
        // #endregion
        // #region message
        setDefault('message', `Commit from GitHub Actions (${process.env.GITHUB_WORKFLOW})`);
        core_1.info(`> Using "${util_1.getInput('message')}" as commit message.`);
        // #endregion
        // #region branch
        const branch = setDefault('branch', defaultBranch || '');
        if (isPR)
            core_1.info(`> Running for a PR, the action will use '${branch}' as ref.`);
        // #endregion
        // #region signoff
        if (util_1.getInput('signoff')) {
            const parsed = util_1.parseBool(util_1.getInput('signoff'));
            if (parsed === undefined)
                throw new Error(`"${util_1.getInput('signoff')}" is not a valid value for the 'signoff' input: only "true" and "false" are allowed.`);
            if (!parsed)
                setInput('signoff', undefined);
            core_1.debug(`Current signoff option: ${util_1.getInput('signoff')} (${typeof util_1.getInput('signoff')})`);
        }
        // #endregion
        // #region push
        if (util_1.getInput('push')) {
            // It has to be either 'true', 'false', or any other string (use as arguments)
            const parsed = util_1.parseBool(util_1.getInput('push'));
            core_1.debug(`Current push option: '${util_1.getInput('push')}' (parsed as ${typeof parsed})`);
        }
    });
}
function add({ logWarning = true, ignoreErrors = false } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = util_1.getInput('add');
        if (!input)
            return [];
        const parsed = parseInputArray(input);
        const res = [];
        for (const args of parsed) {
            res.push(
            // Push the result of every git command (which are executed in order) to the array
            // If any of them fails, the whole function will return a Promise rejection
            yield git
                .add(args.split(' '), (err, data) => util_1.log(ignoreErrors ? null : err, data))
                .catch((e) => {
                if (ignoreErrors)
                    return;
                if (e.message.includes('fatal: pathspec') &&
                    e.message.includes('did not match any files') &&
                    logWarning)
                    core_1.warning(`Add command did not match any file:\n  git add ${args}`);
                else
                    throw e;
            }));
        }
        return res;
    });
}
function remove({ logWarning = true, ignoreErrors = false } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = util_1.getInput('remove');
        if (!input)
            return [];
        const parsed = parseInputArray(input);
        const res = [];
        for (const args of parsed) {
            res.push(
            // Push the result of every git command (which are executed in order) to the array
            // If any of them fails, the whole function will return a Promise rejection
            yield git
                .rm(args.split(' '), (e, d) => util_1.log(ignoreErrors ? null : e, d))
                .catch((e) => {
                if (ignoreErrors)
                    return;
                if (e.message.includes('fatal: pathspec') &&
                    e.message.includes('did not match any files'))
                    logWarning &&
                        core_1.warning(`Remove command did not match any file:\n  git rm ${args}`);
                else
                    throw e;
            }));
        }
        return res;
    });
}
/**
 * Tries to parse a JSON array, then a YAML array.
 * If both fail, it returns an array containing the input value as its only element
 */
function parseInputArray(input) {
    try {
        const json = JSON.parse(input);
        if (json &&
            Array.isArray(json) &&
            json.every((e) => typeof e == 'string')) {
            core_1.debug(`Input parsed as JSON array of length ${json.length}`);
            return json;
        }
    }
    catch (_a) { }
    try {
        const yaml = js_yaml_1.default.load(input);
        if (yaml &&
            Array.isArray(yaml) &&
            yaml.every((e) => typeof e == 'string')) {
            core_1.debug(`Input parsed as YAML array of length ${yaml.length}`);
            return yaml;
        }
    }
    catch (_b) { }
    core_1.debug('Input parsed as single string');
    return [input];
}
function logOutputs() {
    core_1.startGroup('Outputs');
    for (const key in util_1.outputs) {
        core_1.info(`${key}: ${util_1.outputs[key]}`);
    }
    core_1.endGroup();
}
