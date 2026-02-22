#!/usr/bin/env node

import { program } from 'commander';
import debug from 'debug';
import pageLoader from '../src/index.js';

if (process.env.DEBUG) {
  debug.enable(process.env.DEBUG);
}

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .option('-d, --debug', 'enable debug output', false)
  .arguments('<url>')
  .action((url) => {
    const options = program.opts();

    if (options.debug) {
      debug.enable('page-loader*');
    }

    pageLoader(url, options.output)
      .then((filepath) => {
        console.log(filepath);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`\n❌ ${error.message}`);
        process.exit(1);
      });
  });

program.parse();
