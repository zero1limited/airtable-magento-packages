const core = require('@actions/core');
const { promises: fs } = require('fs');
const Airtable = require('airtable');

const COMPOSER_LOCK = 'composer.lock';
const AIRTABLE_MAX_CHUNK = 10;

// most @actions toolkit packages have async methods
async function run() {
  try {
    const apiKey = core.getInput('apiKey');
    const base = core.getInput('base');
    const site = core.getInput('site');

    if(!apiKey){
      throw new Error('"apiKey" not provided');
    }
    if(!base){
      throw new Error('"base" not provided');
    }
    if(!site){
      throw new Error('"site" not provided');
    }


    const ms = core.getInput('milliseconds');
    core.info(`Waiting ${ms} milliseconds ...`);

    core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    await wait(parseInt(ms));
    core.info((new Date()).toTimeString());

    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();