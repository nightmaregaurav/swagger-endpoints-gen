## Swagger Endpoints Generator (Ts/Js)
[![npm version](https://badge.fury.io/js/@nightmaregaurav%2Fswagger-endpoints-gen.svg)](https://badge.fury.io/js/@nightmaregaurav%2Fswagger-endpoints-gen)   [![HitCount](https://hits.dwyl.com/nightmaregaurav/swagger-endpoints-gen.svg?style=flat)](http://hits.dwyl.com/nightmaregaurav/swagger-endpoints-gen) 
***
### Description
Automatically generate typescript models and endpoints from `swagger.json` so api call is as simple as writing `endpoints.API__GET__my_object.call({data:value});`

### Installation
[![NPM](https://nodei.co/npm/@nightmaregaurav/swagger-endpoints-gen.png?mini=true)](https://nodei.co/npm/@nightmaregaurav/swagger-endpoints-gen/)

`npm install -D @nightmaregaurav/swagger-endpoints-gen`

### Usage
```typescript
import { createEndpointsAndModels } from '@nightmaregaurav/swagger-endpoints-gen';
import swagger1 from './swagger1.json';
import swagger2 from './swagger2.json';
import swagger3 from './swagger3.json';
import swagger4 from './swagger4.json';

const endpointsFolder = "./endpoints";
createEndpointsAndModels(endpointsFolder, swagger1, swagger2, swagger3, swagger4);
```

### Example usage of generated endpoints
```typescript
import { endpoints } from './endpoints';

let userInfo: UserModel = await endpoints.API__GET__user__userId.call({userId: 1});
let userId: number = await endpoints.API__POST__user__schoolId.call({schoolId:2}, {data: {name: "John Doe"}});
// rest of the codes
```
***
## Technical Details
* Language: Typescript
 
## How to Contribute
* Fork the repository
* Clone the forked repository
* Make changes
* Commit and push the changes
* Create a pull request
* Wait for the pull request to be merged
* Celebrate
* Repeat

*If you are new to open source, you can read [this](https://opensource.guide/how-to-contribute/) to learn how to contribute to open source projects.*<br>
*If you are new to GitHub, you can read [this](https://guides.github.com/activities/hello-world/) to learn how to use GitHub.*<br>
*If you are new to Git, you can read [this](https://www.atlassian.com/git/tutorials/learn-git-with-bitbucket-cloud) to learn how to use Git.*<br>
*If you are new to TypeScript, you can read [this](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) to learn how to use TypeScript.*<br>

---
## Note: This Project is Licensed under GNU GPLv3.

### Which means Anyone are permitted for:
- Commercial use: **The licensed material and derivatives may be used for commercial purposes.**
- Distribution: **The licensed material may be distributed.**
- Modification: **The licensed material may be modified.**
- Patent use: **This license provides an express grant of patent rights from contributors.**
- Private use **The licensed material may be used and modified in private.**

### Under Condition that:
- Disclose source: **Source code must be made available when the licensed material is distributed.**
- License and copyright notice: **A copy of the license and copyright notice must be included with the licensed material.**
- Same license: **Modifications must be released under the same license when distributing the licensed material. In some cases a similar or related license may be used.**
- State changes: **Changes made to the licensed material must be documented. Along with link to original source**

---
Open For Contribution
---
