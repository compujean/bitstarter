#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:
 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

 + restler:
HTTP client library for node.js (0.6.x and up). Hides most of the complexity of creating and using http.Client.
   - https://github.com/danwrong/restler
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var processURL = function(url, checksfile) {
 console.log("IN processURL of grader.js for URL: " + url );
	restler.get(url).on('complete', function(result){ // result is the HTML from the input URL
      if (result instanceof Error) {
        console.log('Error: ' + result.message);
        this.retry(5000); // try again after 5 sec
       } else {
	processHTMLFromURL(result, checksfile); 
       }
     });
}

var processHTMLFromURL = function (htmlText, checksfile) {
	var $ = loadFromURL(htmlText);
	var checkJson = checkHTML($, htmlText, checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
   	console.log(outJson);
}

var loadFromURL = function (htmlText) {
	return cheerio.load(htmlText);
}

var loadFromFIle = function(htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
}

var processFile = function (htmlfile, checksfile ) { 		//  (program.file, program.checks) {
    console.log("IN processFile of grader.js for file " + htmlfile);
    var $ = loadFromFIle(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var checkJson = checkHTML($, checks, checksfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

var checkHTML = function ($, htmlText, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var i in checks) {
        var present = $(checks[i]).length > 0;
        out[checks[i]] = present;
    }
    return out;
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var clone = function(fn) { // workaround for commander.js issue
    return fn.bind({});
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); 
    }
    return instr;
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u --url <url>', 'URL')
        .parse(process.argv);
        if (program.file) {
            processFile(program.file, program.checks);
        }
        else {
            processURL(program.url, program.checks);
        }
} else {
    exports.processFile = processFile;
}
