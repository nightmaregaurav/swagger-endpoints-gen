#! /usr/bin/env node

import {argv} from 'process';
import {createTypescriptEndpointsAndModels} from "../typescript";
import {GeneratorOptions} from "../types";

const jsonFilePath = argv[2];

const fs = require('fs');

const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
const jsonObject: GeneratorOptions[] = JSON.parse(jsonData);
jsonObject.forEach(object => createTypescriptEndpointsAndModels(object).then());
