'use strict';
const fs = require('fs');
const path = require('path');
const uglify = require('uglify-js');

// paths
const BASE = path.join(__dirname, '..');
const src = path.join(BASE, 'runtime.js');
const dest = path.join(BASE, 'dist', 'index.js');
const destMin = path.join(BASE, 'dist', 'index.min.js');

// Generate runtime - this will call `new Function()` to bundle it up
const {$asyncbind} = require(src);

let contents = fs.readFileSync(src).toString('utf8')
// Replace the definition of $asyncbind with one that inlines dependencies.
.replace($asyncbind, processIncludes($asyncbind));

// Write files.
fs.writeFileSync(dest, contents);
console.log('Wrote', dest + '.');
fs.writeFileSync(destMin, uglify.minify(contents, {fromString: true}).code);
console.log('Wrote', destMin + '.');

//
// Helpers
//

// Replace the require statements inside the runtime with the text of the actual dependencies,
// so that the entire function can be stringified if needed.
function processIncludes(input) {
    var src = input.toString();
    var t = src;
    var re = /require\(['"\./]+([^'"]*)['"]\)/g;
    var matches = [];
    while (1) {
        var mx = re.exec(t);
        if (mx)
            matches.push(mx);
        else break;
    }
    // Replace require statements with the literal text of the functions..
    matches.reverse().forEach(function(e) {
        t = t.slice(0, e.index) + require('../' + e[1]).toString() + t.substr(e.index + e[0].length);
    });

    return t;
}

