import { exec } from 'child_process';
import { promisify } from 'util';
import { access, constants } from 'fs/promises';
import { DbTypes } from '../types/types';
import { logger } from '../helper/logger';

const execAsync = promisify(exec);

class QDBError extends Error {
  public query: string;
  public dbType: DbTypes;

  constructor(message: string, query: string, dbType: DbTypes, suggestion: string) {
    super(message);
    this.name = 'QDBError';
    this.query = query;
    this.dbType = dbType;
    this.message = `${message}\nQuery: ${query}\nDatabase Type: ${dbType}\nSuggestion: ${suggestion}`;
  }
}

export class Qiu {
  private static instance: Qiu;
  private dbType: DbTypes;
  private user: string;
  private password: string;
  private dbFile: string;
  private permissionsSet: boolean = false;
  private scriptCache: Map<string, boolean> = new Map();
  private queryCache: Map<string, string> = new Map();

  private constructor(dbType: DbTypes, user: string = '', password: string = '', dbFile: string = '') {
    this.dbType = dbType;
    this.user = user;
    this.password = password;
    this.dbFile = dbFile;

    this.loadCredentials();
  }

  public static getInstance(dbType: DbTypes, user: string = '', password: string = '', dbFile: string = ''): Qiu {
    if (!Qiu.instance) {
      Qiu.instance = new Qiu(dbType, user, password, dbFile);
    }
    return Qiu.instance;
  }

  private loadCredentials() {
    this.user = this.user;
    this.password = this.password;
  }

  private async setExecutePermissions() {
    if (!this.permissionsSet) {
      const scripts = ['./script/mariadb.sh', './script/postgres.sh', './script/sqlite.sh', './script/sqlserver.sh', './script/mysql.sh'];

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
    logger.error(message, new Error(message), 'database');
    throw new QDBError(message, query, this.dbType, suggestion);
  }

  async run(query: string): Promise<string> {
    await this.setExecutePermissions();
    // Check if the query result is cached
    if (this.queryCache.has(query)) {
      return this.queryCache.get(query)!;
    }
    await this.setExecutePermissions();

    const command = this.buildCommand(query);

    try {
      const result = await this.executeScript(command);
      // Cache the result of the query
      this.queryCache.set(query, result);
      return result;
    } catch (error: any) {
      let errorMessage = `Failed to execute query: ${query}`;
      let suggestion = 'Please verify your database credentials and query syntax.';
      if (error.message.includes('Access denied for user')) {
        errorMessage = `Authentication failed for user: ${this.user}`;
        suggestion = `Check that the username and password are correct for the ${this.dbType} database.`;
      } else if (error.message.includes('Unknown database')) {
        errorMessage = `Database not found.`;
        suggestion = `Ensure the database name is correct and that it exists on the server.`;
      } else if (error.message.includes('command not found')) {
        errorMessage = `Database client not found on the system.`;
        suggestion = `Make sure the ${this.dbType} client is installed and accessible in your system's PATH.`;
      }

      this.handleError(errorMessage, query, suggestion);
    }
  }

  private buildCommand(query: string): string {
    let command: string;
    switch (this.dbType) {
      case 'mariadb':
        command = `./script/mariadb.sh ${this.user} ${this.password} "${this.sanitizeQuery(query)}"`;
        break;
      case 'postgres':
        command = `./script/postgres.sh ${this.user} ${this.password} "${this.sanitizeQuery(query)}"`;
        break;
      case 'sqlite':
        command = `./script/sqlite.sh ${this.dbFile} "${this.sanitizeQuery(query)}"`;
        break;
      case 'sqlserver':
        command = `./script/sqlserver.sh ${this.user} ${this.password} "${this.sanitizeQuery(query)}"`;
        break;
      case 'mysql':
        command = `./script/mysql.sh ${this.user} ${this.password} "${this.sanitizeQuery(query)}"`;
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
