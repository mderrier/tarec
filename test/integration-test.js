'use strict';

const expect = require('expect');
const tarec = require('../lib/bin/main');
const temp = require('temp').track();
const fs = require('fs');
const path = require('path');
const Nightmare = require('nightmare');
const {execSync} = require('child_process');

function recursiveReaddir (root) {
  const files = [root];
  const results = [];

  while (files.length) {
    const parent = files.pop();
    let subFiles = fs.readdirSync(parent);

    for (let file of subFiles) {
      const fullPath = path.join(parent, file);
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(fullPath);
      } else {
        const relativeParent = path.relative(root, parent);
        results.push(path.join(relativeParent, file));
      }
    }
  }
  return results;
}

function toHaveFiles (...files) {
  const files = recursiveReaddir(this.actual);
  expect(files).toInclude(...files);
}

function toHaveFilesMatching (...regexps) {
  const files = recursiveReaddir(this.actual);
  const atLeastOnFileMatches = r => files.filter(f => f.match(r)).length > 0;
  const noMatch = regexps.filter(regexp => !atLeastOnFileMatches(regexp));
  expect.assert(
    noMatch.length === 0,
    '%s have no matches within %s',
    noMatch,
    files
  )
}

expect.extend({toHaveFiles, toHaveFilesMatching});


class LogInterceptor {

  constructor () {
    this.oldStdOutWriter = process.stdout.write;
    this.logs = [];
  }

  capture () {
    process.stdout.write = (string, encoding, fd) => {
      this.logs.push(string);
    };
  }

  restore () {
    process.stdout.write = this.oldStdOutWriter;
  }
}

const logInterceptor = new LogInterceptor();

function npmInstall (cwd) {
  execSync('npm install --cache-min 99999', {cwd, stdio: [0, 1, 2]})
}

describe('Integration tests', () => {

  it('Should init and run', (done) => {
    // things do not work properly in tmp on mac
    const tmp = temp.mkdirSync({dir: __dirname});

    // logInterceptor.capture();

    tarec(tmp, ['init', '--minimal']);

    expect(tmp).toHaveFiles('package.json', 'src/index.js');

    npmInstall(tmp);
    tarec(tmp, ['start']);

    Nightmare()
      .goto('http://localhost:3000')
      .wait(() => document.querySelector('h1').textContent === 'Hello')
      .end()
      .then(done);

    // logInterceptor.restore();

  }).timeout(10000);

  it('Should init and build', () => {
    // things do not work properly in tmp on mac
    const tmp = temp.mkdirSync({dir: __dirname});

    // logInterceptor.capture();

    tarec(tmp, ['init', '--minimal']);

    const topLevelFiles = fs.readdirSync(tmp);
    expect(topLevelFiles).toInclude('package.json');

    npmInstall(tmp);
    tarec(tmp, ['build']);

    const distFolder = path.join(tmp, 'dist');
    expect(distFolder).toHaveFilesMatching(/main-.+?\.js/, /vendors-.+?\.js/, 'index.html');

    // logInterceptor.restore();

  }).timeout(10000);

});
