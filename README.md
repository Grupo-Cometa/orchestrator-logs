# Orchestrator Logs

`grupo-cometa-orchestrator-logs` is a library that sends RPA logs to the orchestrator.

## 📦 Install

```bash

npm grupo-cometa-orchestrator-logs

```
## 🔨 How to Usage

- Create an .env file with the following variables. LOGS_FOLDER is optional default value is a storage folder within the current directory for local logs

#### Environment Variables

```
PUBLIC_ID=
LOGS_FOLDER=
```

#### To use the library, follow the example:

```javascript

const { Log } = require("grupo-cometa-orchestrator-logs");

const message = 'Log message';
const log = new Log(message, 'INFO');
log.save()

//Logs types includes INFO, WARNING, ERROR, CRITICAL

```