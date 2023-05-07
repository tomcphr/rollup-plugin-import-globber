# rollup-plugin-import-globber
A rudimentary mimic of Vite's import meta glob for Rollup

## Usage
Install via package manager of your choice (I use `yarn`)
```console
yarn install rollup-plugin-import-globber
```

You will need to define the typings in your tsconfig:
```json
"types": ["./node_modules/rollup-plugin-import-globber/typings"],
```

You can then use the glob method on `import.meta` in your code
```ts
let modules = import.meta.glob('./modules/**/*.ts');
```
This will produce code in your output bundle akin to this...
```js
import * as glob_0_1 from './modules/folder1/file1.js';
import * as glob_0_2 from './modules/folder1/file2.js';
let modules = [glob_0_1, glob_0_2];
```

You can also provide the call with an array of glob patterns to search.
```ts
let modules = import.meta.glob([
    './modules/**/*.ts',
    './other-directory/**/*.ts'
]);
```
And this will produce code in your output bundle akin to this...
```js
import * as glob_0_1 from './modules/folder1/file1.js';
import * as glob_0_2 from './modules/folder1/file2.js';
import * as glob_1_1 from './modules/other-directory/other-file1.js';
import * as glob_1_2 from './modules/other-directory/other-file2.js';
let modules = [glob_0_1, glob_0_2, glob_1_1, glob_1_2];
```
