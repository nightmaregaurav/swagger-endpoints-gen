#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const typescript_1 = require("../typescript");
const jsonFilePath = process_1.argv[2];
const fs = require('fs');
const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
const jsonObject = JSON.parse(jsonData);
jsonObject.forEach(object => (0, typescript_1.createTypescriptEndpointsAndModels)(object).then());
//# sourceMappingURL=index.js.map