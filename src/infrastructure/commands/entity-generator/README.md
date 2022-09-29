To test entity code generator:

1. Create a folder ```example``` in the current folder
2. Create a file ```index.ts``` with the following content:
```
import {EntityCodeGenerator} from './EntityCodeGenerator';

(new EntityCodeGenerator(
    'test',
    'example',
    __dirname,
)).generate();

```
3. Run:
```
npx ts-node index.ts
```
4. Check out ```example``` folder 
