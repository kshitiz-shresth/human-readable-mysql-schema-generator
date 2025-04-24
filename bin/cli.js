#!/usr/bin/env node

const { exportSchema } = require("../src/index");
const prompts = require("prompts");
const yargs = require("yargs");

const argv = yargs
  .option("host", {
    description: "MySQL host",
    type: "string",
    default: undefined,
  })
  .option("port", {
    description: "MySQL port",
    type: "number",
    default: undefined,
  })
  .option("user", {
    description: "MySQL user",
    type: "string",
  })
  .option("password", {
    description: "MySQL password",
    type: "string",
  })
  .option("database", {
    description: "MySQL database name",
    type: "string",
  })
  .option("output", {
    description: "Output file path",
    type: "string",
    default: "schema_readable.txt",
  })
  .help()
  .argv;

async function getDbConfig() {
  const questions = [
    {
      type: argv.host !== undefined ? null : "text",
      name: "host",
      message: "Enter MySQL host (default: localhost):",
      initial: "localhost",
      validate: value => value.trim() ? true : "Host name is required",
    },
    {
      type: argv.port !== undefined ? null : "number",
      name: "port",
      message: "Enter MySQL port (default: 3306):",
      initial: 3306,
    },
    {
      type: argv.user !== undefined ? null : "text",
      name: "user",
      message: "Enter MySQL user:",
      validate: value => value.trim() ? true : "User is required",
    },
    {
      type: argv.password !== undefined ? null : "password",
      name: "password",
      message: "Enter MySQL password (can be empty):",
    },
    {
      type: argv.database !== undefined ? null : "text",
      name: "database",
      message: "Enter MySQL database name:",
      validate: value => value.trim() ? true : "Database name is required",
    },
  ];

  const responses = await prompts(questions);

  return {
    host: argv.host !== undefined ? argv.host : responses.host || "localhost",
    port: argv.port !== undefined ? argv.port : responses.port || 3306,
    user: argv.user || responses.user,
    password: argv.password !== undefined ? argv.password : responses.password || "",
    database: argv.database || responses.database,
  };
}

async function run() {
  try {
    const dbConfig = await getDbConfig();
    await exportSchema(dbConfig, argv.output);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();