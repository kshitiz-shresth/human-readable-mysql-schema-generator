# Human Readable MySQL Schema Generator

A Node.js package to generate a human-readable MySQL database schema in a text file.

## Installation

```bash
npm install -g human-readable-mysql-schema-generator
```

## Usage

### CLI
Run the command to generate a schema file. If you don’t provide `--user`, `--password`, or `--database`, you’ll be prompted for them:

```bash
human-readable-mysql-schema-generator [--user <user>] [--password <password>] [--database <database>] [--host <host>] [--port <port>] [--output <file>]
```

Example (interactive mode):
```bash
human-readable-mysql-schema-generator
```
You’ll be prompted:
```
Enter MySQL user: root
Enter MySQL password (can be empty): [hidden input]
Enter MySQL database name: convoaidb
```

Example (with flags):
```bash
human-readable-mysql-schema-generator --user root --password mypass --database convoaidb --output schema.txt
```

### Programmatically
```javascript
const { exportSchema } = require("human-readable-mysql-schema-generator");

const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "mydb",
};

exportSchema(dbConfig, "schema.txt")
  .then(() => console.log("Schema exported"))
  .catch(err => console.error(err));
```

## Requirements
- Node.js >= 14
- MySQL server
- `mysql-schema-generator` package

## License
MIT