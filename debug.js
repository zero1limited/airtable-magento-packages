var args = require('process.args')();
args = args[Object.keys(args)[1]];

let argKeys = Object.keys(args);
for(var x=0; x<argKeys.length; x++){
    process.env[`INPUT_${argKeys[x].replace(/ /g, '_').toUpperCase()}`] = args[argKeys[x]];
}

require('./index.js');