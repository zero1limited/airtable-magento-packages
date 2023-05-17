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

    Airtable.configure({ apiKey })
    var airtable = new Airtable().base(base);

    var airTableVersions = {};
    var composerLockVersions = {};

    await airtable('Versions').select({
        filterByFormula: `{Site} = '${site}'`
    }).eachPage(function page(records, fetchNextPage) {
    
        records.forEach(function(record) {
            airTableVersions[record.get('Package')] = record;
        });

        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
        console.log('airtable record count: %d', Object.keys(airTableVersions).length);
    });

    console.log('yo', {foo: Object.keys(airTableVersions).length});

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
