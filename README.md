# Human Readable MySQL Schema Generator

A Node.js package to generate a human-readable MySQL database schema in a text file.

## Installation

```bash
npm install -g human-readable-mysql-schema
```

## Usage

### CLI

Run the command to generate a schema file. If you don’t provide flags, you’ll be prompted for inputs:

```bash
human-readable-mysql-schema [--host <host>] [--port <port>] [--user <user>] [--password <password>] [--database <database>] [--output <file>]
```

Example (interactive mode):

```bash
human-readable-mysql-schema
```

You’ll be prompted:

```
Enter MySQL host (default: localhost): localhost
Enter MySQL port (default: 3306): 3306
Enter MySQL user: root
Enter MySQL password (can be empty): [hidden input]
Enter MySQL database name: convoaidb
```

Example (with flags):

```bash
human-readable-mysql-schema --host localhost --port 3306 --user root --password "" --database convoaidb --output schema.txt
```

### Programmatic Usage

Provide a MySQL connection object (e.g., from `mysql2`, installed separately):

```javascript
const mysql = require("mysql2/promise");
const { exportSchema } = require("human-readable-mysql-schema");

async function run() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "mydb",
  });
  try {
    await exportSchema(connection, "mydb", "schema.txt");
  } finally {
    await connection.end();
  }
}
run();
```

## Requirements

- Node.js >= 14
- MySQL server
- `mysql2` (for CLI or programmatic usage, installed separately)

## License

MIT