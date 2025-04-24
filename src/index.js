const mysql = require("mysql2/promise");
const fs = require("fs");

async function exportSchema(dbConfig, outputFile = "schema_readable.txt") {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL");

    // Fetch tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME NOT IN ('knex_migrations', 'knex_migrations_lock')`,
      [dbConfig.database]
    );

    const schemaData = {};

    // Fetch columns and foreign keys for each table
    for (const { TABLE_NAME } of tables) {
      // Columns
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_KEY, EXTRA, COLUMN_DEFAULT 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?`,
        [TABLE_NAME, dbConfig.database]
      );

      // Foreign keys
      const [foreignKeys] = await connection.query(
        `SELECT k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
         LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
         ON k.TABLE_NAME = r.TABLE_NAME 
         AND k.TABLE_SCHEMA = r.CONSTRAINT_SCHEMA 
         AND k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
         WHERE k.TABLE_NAME = ? 
         AND k.TABLE_SCHEMA = ? 
         AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
        [TABLE_NAME, dbConfig.database]
      );

      schemaData[TABLE_NAME] = { columns, foreignKeys };
    }

    const schema = [];
    const tableNames = Object.keys(schemaData);

    for (const TABLE_NAME of tableNames) {
      const tableData = schemaData[TABLE_NAME];

      const tbl = {
        table: TABLE_NAME,
        columns: tableData.columns.map(col => {
          let type = col.DATA_TYPE.toLowerCase();
          if (col.CHARACTER_MAXIMUM_LENGTH && ["varchar", "char"].includes(type)) {
            type += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
          }
          if (col.IS_NULLABLE === "NO") type += " not null";
          if (col.COLUMN_KEY === "PRI") type += " primary key";
          if (col.EXTRA.toLowerCase().includes("auto_increment")) type += " auto_increment";
          if (col.COLUMN_DEFAULT && col.COLUMN_DEFAULT !== "NULL") type += ` default ${col.COLUMN_DEFAULT}`;
          return { name: col.COLUMN_NAME, type };
        }),
        references: tableData.foreignKeys.map(fk => ({
          column: fk.COLUMN_NAME,
          references: fk.REFERENCED_COLUMN_NAME,
          inTable: fk.REFERENCED_TABLE_NAME,
          constraints: {
            onDelete: fk.DELETE_RULE !== "NO ACTION" ? fk.DELETE_RULE : null,
          },
        })),
      };

      tbl.columns = [
        ...tbl.columns.filter(col => col.name !== "created_at" && col.name !== "updated_at"),
        ...tbl.columns.filter(col => col.name === "created_at"),
        ...tbl.columns.filter(col => col.name === "updated_at"),
      ];

      schema.push(tbl);
    }

    const dependencies = {};
    tableNames.forEach(table => {
      dependencies[table] = schema
        .find(t => t.table === table)
        .references
        .map(ref => ref.inTable)
        .filter(refTable => tableNames.includes(refTable));
    });

    const sortedTables = [];
    const visited = new Set();
    const temp = new Set();

    function visit(table) {
      if (temp.has(table)) throw new Error(`Cyclic dependency detected at ${table}`);
      if (!visited.has(table)) {
        temp.add(table);
        (dependencies[table] || []).forEach(dep => visit(dep));
        temp.delete(table);
        visited.add(table);
        sortedTables.push(table);
      }
    }

    tableNames.forEach(table => {
      if (!visited.has(table)) visit(table);
    });

    const sortedSchema = sortedTables
      .map(tableName => schema.find(t => t.table === tableName))
      .filter(t => t);

    const output = sortedSchema
      .map(({ table, columns, references }) => {
        const colLines = columns
          .map(c => `  - ${c.name}: ${c.type}`)
          .join("\n");
        const relLines = references.length
          ? references
              .map(r => {
                let line = `  - ${r.column} references ${r.references} in table ${r.inTable}`;
                if (r.constraints.onDelete) {
                  line += ` [onDelete(${r.constraints.onDelete})]`;
                }
                return line;
              })
              .join("\n")
          : "  - None";

        return `🗂️ Table: ${table}\nColumns:\n${colLines}\nRelationships:\n${relLines}`;
      })
      .join("\n\n");

    fs.writeFileSync(outputFile, output, "utf8");
    console.log(`✅ ${outputFile} generated`);
  } catch (error) {
    console.error("Error generating schema:", error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { exportSchema };