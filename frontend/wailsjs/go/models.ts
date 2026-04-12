export namespace config {
	
	export class Settings {
	    theme: string;
	    defaultRowsPerPage: number;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.defaultRowsPerPage = source["defaultRowsPerPage"];
	    }
	}

}

export namespace db {
	
	export class ColumnDef {
	    ordinalPosition: number;
	    name: string;
	    type: string;
	    isNullable: boolean;
	    defaultVal?: string;
	    hasDefault: boolean;
	    isPrimaryKey: boolean;
	    isIdentity: boolean;
	    isGenerated: boolean;
	    isUpdatable: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ColumnDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ordinalPosition = source["ordinalPosition"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.isNullable = source["isNullable"];
	        this.defaultVal = source["defaultVal"];
	        this.hasDefault = source["hasDefault"];
	        this.isPrimaryKey = source["isPrimaryKey"];
	        this.isIdentity = source["isIdentity"];
	        this.isGenerated = source["isGenerated"];
	        this.isUpdatable = source["isUpdatable"];
	    }
	}
	export class DatabaseBackupParams {
	    profileId: string;
	    database: string;
	
	    static createFrom(source: any = {}) {
	        return new DatabaseBackupParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	    }
	}
	export class DatabaseInfo {
	    connectionId: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new DatabaseInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.name = source["name"];
	    }
	}
	export class DatabaseOperationResult {
	    path: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new DatabaseOperationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.message = source["message"];
	    }
	}
	export class DatabaseRestoreParams {
	    profileId: string;
	    database: string;
	
	    static createFrom(source: any = {}) {
	        return new DatabaseRestoreParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	    }
	}
	export class DatabaseRestorePreflightResult {
	    databaseName: string;
	    isEmpty: boolean;
	    schemaCount: number;
	    schemas: string[];
	
	    static createFrom(source: any = {}) {
	        return new DatabaseRestorePreflightResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.databaseName = source["databaseName"];
	        this.isEmpty = source["isEmpty"];
	        this.schemaCount = source["schemaCount"];
	        this.schemas = source["schemas"];
	    }
	}
	export class DeleteRowParams {
	    profileId: string;
	    database: string;
	    schema: string;
	    table: string;
	    originalValues: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new DeleteRowParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.table = source["table"];
	        this.originalValues = source["originalValues"];
	    }
	}
	export class ForeignKeyInfo {
	    constraintName: string;
	    columnName: string;
	    referencedSchema: string;
	    referencedTable: string;
	    referencedColumn: string;
	    updateRule: string;
	    deleteRule: string;
	
	    static createFrom(source: any = {}) {
	        return new ForeignKeyInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.constraintName = source["constraintName"];
	        this.columnName = source["columnName"];
	        this.referencedSchema = source["referencedSchema"];
	        this.referencedTable = source["referencedTable"];
	        this.referencedColumn = source["referencedColumn"];
	        this.updateRule = source["updateRule"];
	        this.deleteRule = source["deleteRule"];
	    }
	}
	export class InsertRowParams {
	    profileId: string;
	    database: string;
	    schema: string;
	    table: string;
	    values: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new InsertRowParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.table = source["table"];
	        this.values = source["values"];
	    }
	}
	export class QueryExecutionParams {
	    profileId: string;
	    database: string;
	    sql: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryExecutionParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	        this.sql = source["sql"];
	    }
	}
	export class QueryResult {
	    columns: string[];
	    rows: any[];
	    rowsAffected: number;
	    executionTimeMs: number;
	    statementType: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.columns = source["columns"];
	        this.rows = source["rows"];
	        this.rowsAffected = source["rowsAffected"];
	        this.executionTimeMs = source["executionTimeMs"];
	        this.statementType = source["statementType"];
	        this.error = source["error"];
	    }
	}
	export class SchemaInfo {
	    connectionId: string;
	    database: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new SchemaInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.database = source["database"];
	        this.name = source["name"];
	    }
	}
	export class TableIndexInfo {
	    name: string;
	    columns: string[];
	    type: string;
	    isUnique: boolean;
	    isPrimary: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TableIndexInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.columns = source["columns"];
	        this.type = source["type"];
	        this.isUnique = source["isUnique"];
	        this.isPrimary = source["isPrimary"];
	    }
	}
	export class TableInfo {
	    connectionId: string;
	    database: string;
	    schema: string;
	    name: string;
	    rowCount: number;
	
	    static createFrom(source: any = {}) {
	        return new TableInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.name = source["name"];
	        this.rowCount = source["rowCount"];
	    }
	}
	export class TablePageParams {
	    profileId: string;
	    database: string;
	    schema: string;
	    table: string;
	    page: number;
	    limit: number;
	    sortColumn?: string;
	    sortDir?: string;
	
	    static createFrom(source: any = {}) {
	        return new TablePageParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.table = source["table"];
	        this.page = source["page"];
	        this.limit = source["limit"];
	        this.sortColumn = source["sortColumn"];
	        this.sortDir = source["sortDir"];
	    }
	}
	export class TablePageResult {
	    columns: string[];
	    rows: any[];
	    totalRows: number;
	    page: number;
	    limit: number;
	    sortColumn?: string;
	    sortDir?: string;
	    table: string;
	    schema: string;
	    database: string;
	
	    static createFrom(source: any = {}) {
	        return new TablePageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.columns = source["columns"];
	        this.rows = source["rows"];
	        this.totalRows = source["totalRows"];
	        this.page = source["page"];
	        this.limit = source["limit"];
	        this.sortColumn = source["sortColumn"];
	        this.sortDir = source["sortDir"];
	        this.table = source["table"];
	        this.schema = source["schema"];
	        this.database = source["database"];
	    }
	}
	export class UpdateRowParams {
	    profileId: string;
	    database: string;
	    schema: string;
	    table: string;
	    values: Record<string, any>;
	    originalValues: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new UpdateRowParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.database = source["database"];
	        this.schema = source["schema"];
	        this.table = source["table"];
	        this.values = source["values"];
	        this.originalValues = source["originalValues"];
	    }
	}

}

export namespace history {
	
	export class HistoryEntry {
	    id: string;
	    query: string;
	    database: string;
	    timestamp: string;
	    exec_time_ms: number;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.query = source["query"];
	        this.database = source["database"];
	        this.timestamp = source["timestamp"];
	        this.exec_time_ms = source["exec_time_ms"];
	    }
	}

}

export namespace profiles {
	
	export class Profile {
	    id: string;
	    name: string;
	    host: string;
	    port: number;
	    defaultDatabase?: string;
	    database?: string;
	    username: string;
	    ssl_mode: string;
	
	    static createFrom(source: any = {}) {
	        return new Profile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.defaultDatabase = source["defaultDatabase"];
	        this.database = source["database"];
	        this.username = source["username"];
	        this.ssl_mode = source["ssl_mode"];
	    }
	}

}

export namespace queries {
	
	export class Folder {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Folder(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class SavedQuery {
	    id: string;
	    name: string;
	    query: string;
	    folderId: string;
	
	    static createFrom(source: any = {}) {
	        return new SavedQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.query = source["query"];
	        this.folderId = source["folderId"];
	    }
	}
	export class SavedQueries {
	    queries: SavedQuery[];
	    folders: Folder[];
	
	    static createFrom(source: any = {}) {
	        return new SavedQueries(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.queries = this.convertValues(source["queries"], SavedQuery);
	        this.folders = this.convertValues(source["folders"], Folder);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

