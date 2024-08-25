import { exec } from 'child_process';
import { promisify } from 'util';
import { access, constants } from 'fs/promises';
import { DbTypes } from '../types';
import { logger } from '../helper/logger';
import path from 'path';
const execAsync = promisify(exec);

class QiuError extends Error {
  constructor(message: string, public query: string, public dbType: string, public suggestion: string) {
    super();
    this.name = 'QiuError';
    this.message = this.formatErrorMessage(message, query, dbType, suggestion);
  }

  private formatErrorMessage(message: string, query: string, dbType: string, suggestion: string): string {
    const messageBlock = `\x1b[31m\x1b[1mError: ${message}\x1b[0m`; // Red bold
    const queryBlock = `\x1b[33m\x1b[1mQuery Executed: \x1b[0m${query}`; // Yellow bold
    const dbTypeBlock = `\x1b[33m\x1b[1mDatabase Type: \x1b[0m${dbType}`; // Yellow bold
    const suggestionBlock = `\x1b[36m\x1b[1mSuggestion: \x1b[0m${suggestion}`; // Cyan bold

    return `
${messageBlock}
${queryBlock}
${dbTypeBlock}
${suggestionBlock}
    `.trim();
  }
}

export class Qiu {
  private static instance: Qiu;
  private dbType: DbTypes;
  private user: string;
  private password: string;
  private permissionsSet: boolean = false;
  private scriptCache: Map<string, boolean> = new Map();
  private queryCache: Map<string, string> = new Map();
  private static readonly scriptDir = path.resolve(__dirname, 'script');
  private constructor(dbType: DbTypes, user: string = '', password: string = '') {
    this.dbType = dbType;
    this.user = user;
    this.password = password;

    this.loadCredentials();
  }

  public static getInstance(dbType: DbTypes, user: string = '', password: string = ''): Qiu {
    if (!Qiu.instance) {
      Qiu.instance = new Qiu(dbType, user, password);
    }
    return Qiu.instance;
  }

  private loadCredentials() {
    this.user = this.user;
    this.password = this.password;
  }

  private async setExecutePermissions() {
    if (!this.permissionsSet) {
      const scripts = ['mariadb.sh', 'postgres.sh', 'sqlite.sh', 'sqlserver.sh', 'mysql.sh'].map((script) => path.join(Qiu.scriptDir, script));
      for (const script of scripts) {
        if (!this.scriptCache.has(script)) {
          try {
            await this.validateScript(script);
            await access(script, constants.X_OK);
            this.scriptCache.set(script, true);
          } catch {
            await execAsync(`chmod +x ${script}`);
            logger.warn(`Execute permissions set for script: ${script}`, 'database');
            this.scriptCache.set(script, true);
          }
        }
      }

      this.permissionsSet = true;
    }
  }

  private async validateScript(script: string) {
    if (!this.scriptCache.has(script)) {
      try {
        await access(script, constants.F_OK);
        this.scriptCache.set(script, true);
      } catch {
        const errorMsg = `Script not found: ${script}`;
        this.handleError(errorMsg, script, 'Ensure the script exists and the path is correct.');
      }
    }
  }

  private handleError(message: string, query: string, suggestion: string = 'Please check the script or database configuration.'): never {
    const error = new QiuError(message, query, this.dbType, suggestion);
    logger.error(`\n${error}`, Error(error.message), 'QIU ERROR');
    process.exit(1);
  }

  async run(query: string): Promise<string | undefined> {
    await this.setExecutePermissions();
    // Check if the query result is cached
    if (this.queryCache.has(query)) {
      return this.queryCache.get(query)!;
    }

    const command = this.buildCommand(query);

    try {
      const result = await this.executeScript(command);
      // Cache the result of the query
      this.queryCache.set(query, result);
      return result;
    } catch (error: any) {
      this.handleExecutionError(error, query);
    }
  }
  private handleExecutionError(error: any, query: string) {
    let errorMessage = `Failed to execute query: ${query}`;
    let suggestion = 'Please verify your database credentials and query syntax.';

    if (error.message.includes('Access denied for user')) {
      errorMessage = `Authentication failed for user "${this.user}". Unable to connect to the database.`;
      suggestion = `Ensure the username and password are correct for the ${this.dbType} database. Double-check for any typos.`;
    } else if (error.message.includes('Unknown database')) {
      errorMessage = `The specified database was not found on the server.`;
      suggestion = `Verify the database name and ensure it exists on the server. Create the database if it hasn't been set up.`;
    } else if (error.message.includes('command not found')) {
      errorMessage = `The ${this.dbType} client is not installed or accessible.`;
      suggestion = `Make sure the ${this.dbType} client is installed on your system and included in your system's PATH. Install it if necessary.`;
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = `Unable to connect to the ${this.dbType} database. Connection was refused.`;
      suggestion = `Check if the database server is running and accessible. Verify the host and port settings.`;
    } else if (error.message.includes('ETIMEDOUT')) {
      errorMessage = `The connection to the ${this.dbType} database timed out.`;
      suggestion = `Check the network connection and database server status. Consider increasing the connection timeout settings.`;
    } else if (error.message.includes('ER_PARSE_ERROR')) {
      errorMessage = `There was a syntax error in the SQL query: "${query}".`;
      suggestion = `Review the query for syntax errors. Refer to the ${this.dbType} documentation for correct SQL syntax.`;
    } else if (error.message.includes('ER_NO_SUCH_TABLE')) {
      errorMessage = `The specified table does not exist in the database.`;
      suggestion = `Check that the table name is correct and that it exists in the database. Create the table if necessary.`;
    } else if (error.message.includes('ER_DUP_ENTRY')) {
      errorMessage = `A duplicate entry was found for a unique key or primary key.`;
      suggestion = `Ensure that the data being inserted does not violate unique constraints. Modify the data or database schema as needed.`;
    }else {
        errorMessage = `An unexpected error occurred: ${error.message}`;
        suggestion = `Please check the error message and consult the documentation for further guidance.`;
   }

    this.handleError(errorMessage, query, suggestion);
  }
  private buildCommand(query: string): string {
    let command: string;
    const scriptPath = path.resolve(Qiu.scriptDir, `${this.dbType}.sh`);
    switch (this.dbType) {
      case 'mariadb':
      case 'postgres':
      case 'sqlite':
      case 'sqlserver':
      case 'mysql':
        command = `${scriptPath} ${this.user} ${this.password} "${this.sanitizeQuery(query)}"`;
        break;
      default:
        const errorMsg = `Unsupported database type: ${this.dbType}`;
        this.handleError(errorMsg, query, 'Ensure the database type is one of the supported types: mariadb, postgres, sqlite, sqlserver, mysql.');
    }

    return command;
  }

  private async executeScript(command: string): Promise<string> {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      this.handleError(`Script execution error: ${stderr}`, command, 'Check the script and database permissions.');
    }
    return stdout;
  }

  private sanitizeQuery(query: string): string {
    return query.replace(/["`$]/g, '');
  }
}
