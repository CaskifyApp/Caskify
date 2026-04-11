export namespace db {
	
	export class ColumnDef {
	    name: string;
	    type: string;
	    isNullable: boolean;
	    defaultVal?: string;
	    isPrimaryKey: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ColumnDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.isNullable = source["isNullable"];
	        this.defaultVal = source["defaultVal"];
	        this.isPrimaryKey = source["isPrimaryKey"];
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

}

export namespace profiles {
	
	export class Profile {
	    id: string;
	    name: string;
	    host: string;
	    port: number;
	    database: string;
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
	        this.database = source["database"];
	        this.username = source["username"];
	        this.ssl_mode = source["ssl_mode"];
	    }
	}

}

