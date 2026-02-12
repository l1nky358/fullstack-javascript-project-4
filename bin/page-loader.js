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
      console.error('🐛 Debug mode enabled');
    }
    
    pageLoader(url, options.output)
      .then((filepath) => {
        console.log(filepath);
        process.exit(0);
      })
      .catch((error) => {
        console.error(error.message);
        
        if (error.code) {
          switch (error.code) {
            case 'ENOENT':
              process.exit(2);
            case 'EACCES':
              process.exit(3);
            case 'EEXIST':
              process.exit(4);
            case 'ENOTDIR':
              process.exit(5);
            case 'ETIMEDOUT':
            case 'ECONNREFUSED':
            case 'ENOTFOUND':
              process.exit(6);
            default:
              process.exit(1);
          }
        }
        
        if (error.statusCode) {
          process.exit(7);
        }
        
        process.exit(1);
      });
  });

program.parse();