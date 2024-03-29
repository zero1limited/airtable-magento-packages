const core = require('@actions/core');
const fs = require('fs');
const Airtable = require('airtable');

const COMPOSER_LOCK = 'composer.lock';
const COMPOSER_JSON = 'composer.json';
const AIRTABLE_MAX_CHUNK = 10;

// most @actions toolkit packages have async methods
async function run() {
  try {
    const apiKey = core.getInput('apiKey');
    const base = core.getInput('base');
    const site = core.getInput('site');

    Airtable.configure({ apiKey: apiKey });
    var airtable = new Airtable().base(base);

    var airTableVersions = {};
    var composerLockVersions = {};

    airtable('Versions').select({
        filterByFormula: `{Site} = '${site}'`
    }).eachPage(function page(records, fetchNextPage) {
    
        records.forEach(function(record) {
            airTableVersions[record.get('Package')] = record;
        });

        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
        console.log('airtable record count: %d', Object.keys(airTableVersions).length);

        var updates = [];
        var additions = [];
        if(!fs.existsSync(`${COMPOSER_LOCK}`)){
            console.error(`Error: Unable to find ${COMPOSER_LOCK}`);
            return;
        }
        let composerLock = JSON.parse(fs.readFileSync(`${COMPOSER_LOCK}`));
        if(!fs.existsSync(`${COMPOSER_JSON}`)){
            console.error(`Error: Unable to find ${COMPOSER_JSON}`);
            return;
        }
        let composerJson = JSON.parse(fs.readFileSync(`${COMPOSER_JSON}`));

        for (var x=0; x < composerLock['packages'].length; x++){
            let package = composerLock['packages'][x];

            // restrict to packages declared in root composer
            if(!composerJson['require'][package.name]){
                continue;
            }

            composerLockVersions[package.name] = package.version;

            if(airTableVersions[package.name]){
                if(airTableVersions[package.name].get('Version') != package.version){
                    updates.push({
                        id: airTableVersions[package.name].getId(),
                        fields: {
                            Version: package.version
                        }
                    });
                }
            }else{
                additions.push({
                    fields: {
                        Site: `${site}`,
                        Package: package.name,
                        Version: package.version
                    }
                });
            }
        }

        // values that need deleting
        let difference = Object.keys(airTableVersions).filter(x => !Object.keys(composerLockVersions).includes(x));
        console.log('%d records to delete', difference.length);
        if(difference.length > 0){
            var deletes = [];
            for(var x = 0; x < difference.length; x++){
                deletes.push(airTableVersions[difference[x]].getId());
            }
            console.debug(difference);
            console.debug(deletes);
            for (let i = 0; i < deletes.length; i += AIRTABLE_MAX_CHUNK) {
                const chunk = deletes.slice(i, i + AIRTABLE_MAX_CHUNK);
                console.log('deleting %d => %d', i, i + AIRTABLE_MAX_CHUNK);
                airtable('Versions').destroy(chunk, function(err, deletedRecords) {
                    if (err) {
                      console.error(err);
                      return;
                    }
                });
            }
        }

        // run updates
        console.log('%d records to update', updates.length);
        console.log('updates', {updates});
        for (let i = 0; i < updates.length; i += AIRTABLE_MAX_CHUNK) {
            const chunk = updates.slice(i, i + AIRTABLE_MAX_CHUNK);
            console.log('updating %d => %d', i, i + AIRTABLE_MAX_CHUNK);
            console.log('chunk', {chunk});
            airtable('Versions').update(chunk, {typecast: true}, function(err, records) {
                if (err) {
                  console.error(err);
                  return;
                }
            });
        }

        // run additions
        console.log('%d records to add', additions.length);
        console.log('additions', {additions});
        for (let i = 0; i < additions.length; i += AIRTABLE_MAX_CHUNK) {
            const chunk = additions.slice(i, i + AIRTABLE_MAX_CHUNK);
            console.log('updating %d => %d', i, i + AIRTABLE_MAX_CHUNK);
            console.log('chunk', {chunk});
            airtable('Versions').create(chunk, {typecast: true}, function(err, records) {
                if (err) {
                  console.error(err);
                  return;
                }
            });
        }
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run().catch(err => core.setFailed(err.message));
