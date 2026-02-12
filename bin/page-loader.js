#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url) => {
    pageLoader(url, program.opts().output)
      .then((filepath) => {
        console.log(filepath);
        process.exit(0);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  });

program.parse();