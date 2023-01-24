#! /usr/bin/env node

import {argv} from 'process';
import {createEndpointsAndModels, GeneratorOptions} from "../index";

const jsonFilePath = argv[2];

const fs = require('fs');

const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
const jsonObject: GeneratorOptions[] = JSON.parse(jsonData);
jsonObject.forEach(object => createEndpointsAndModels(object).then());
