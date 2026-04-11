export namespace db {
	
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

