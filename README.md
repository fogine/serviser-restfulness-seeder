Populate sql tables with valid data.

Register the plugin by `require`ing it in where your `Service` initialization is at (`index.js`);

```javascript
const Service = require('serviser');
const Config = require('serviser-config');

const service = new Service(Config);


require('serviser-restfulness'); // requires base serviser-restfulness package
require('serviser-restfulness-seeder'); //require the plugin
```

then `seed` command will be available on `serviser` executable:

```bash

> serviser
/bin/serviser <command> [options]

Commands:
  run [options..]   Starts serviser app - expects it to be located under cwd    [aliases: start, serve]
  get:config [key]  Dumbs resolved service configuration
  test:config       Tries to load the configuration file. Validates configuration.
  seed              populate sql tables with testing fake data

Options:
  --help, -h  Show help                                                                         [boolean]
  --config    Custom config file destination                                                     [string]
  --version   Prints serviser version                                                           [boolean]



> serviser seed --help
/bin/serviser seed

Options:
  --help, -h       Show help                                                                    [boolean]
  --exclude, ---e  list of table names to exclude                                   [array] [default: []]
  --number, ---n   how many records to seed                                        [number] [default: 20]
```
