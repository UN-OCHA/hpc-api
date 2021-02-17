import {Connection, createConnection} from "typeorm";

class ConnectionService {
    public connections: Map<any, Promise<Connection>> = new Map();

   public async getConnection(entityType: object) {
      const key = entityType;
      if (!this.connections.has(key)) {
         const tableName = (entityType as any).tableName;
         const name = `table:${tableName}`;
         const connection = createConnection({
             type: 'postgres',
             host: process.env.DEV_DB_HOST,
             port: 5432,
             username: 'demo',
             password: 'demo',
             database: 'demo',
             synchronize: true,
             logging: false,
             name,
             entities: [entityType] as any
         })
         this.connections.set(key, connection);
      }
      return this.connections.get(key) as Promise<Connection>;
   }
}

export const connectionService = new ConnectionService();