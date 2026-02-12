import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import debug from 'debug';

const log = debug('page-loader');

const generateFileName = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//i, '');
  const fileName = urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-');
  return `${fileName}.html`;
};

const pageLoader = (url, outputDir = process.cwd()) => {
  log(`Start loading page: ${url}`);
  
  return axios.get(url)
    .then((response) => {
      const fileName = generateFileName(url);
      const filePath = path.join(outputDir, fileName);
      
      log(`Saving to: ${filePath}`);
      return fs.writeFile(filePath, response.data)
        .then(() => {
          log(`Page successfully loaded: ${filePath}`);
          return filePath;
        });
    })
    .catch((error) => {
      log(`Error: ${error.message}`);
      
      if (error.response) {
        throw new Error(`Failed to load page: ${error.response.status} ${error.response.statusText}`);
      }
      if (error.request) {
        throw new Error(`Failed to load page: ${error.message}`);
      }
      throw new Error(`Failed to load page: ${error.message}`);
    });
};

export default pageLoader;