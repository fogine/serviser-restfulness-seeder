Populate sql tables with valid data.

Register the plugin by `require`ing it in where your `Service` initialization is at (`index.js`);

```javascript
const Service = require('bi-service');
const Config = require('bi-config');

const service = new Service(Config);


require('bi-service-restfulness'); // requires base bi-service-restfulness package
require('bi-service-restfulness-seeder'); //require the plugin
```

then `seed` command will be available on `bi-service` executable:

```bash

> bi-service
/bin/bi-service <command> [options]

Commands:
  run [options..]   Starts bi-service app - expects it to be located under cwd    [aliases: start, serve]
  get:config [key]  Dumbs resolved service configuration
  test:config       Tries to load the configuration file. Validates configuration.
  seed              populate sql tables with testing fake data

Options:
  --help, -h  Show help                                                                         [boolean]
  --config    Custom config file destination                                                     [string]
  --version   Prints bi-service version                                                         [boolean]



> bi-service seed --help
/bin/bi-service seed

Options:
  --help, -h       Show help                                                                    [boolean]
  --exclude, ---e  list of table names to exclude                                   [array] [default: []]
  --number, ---n   how many records to seed                                        [number] [default: 20]
```
