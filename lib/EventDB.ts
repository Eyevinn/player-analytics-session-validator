import winston from 'winston';

export class EventDB {
  logger: winston.Logger;
  DBAdapter: any;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  /**
   *
   * @param {string} sessionId of a session
   * @param {string} tableName optional, the table to get the event from
   *
  */
  async getEvents(sessionId: string, tableName?: string): Promise<any[] | undefined> {
    try {
      if (!this.DBAdapter) {
        let dbAdapter: any;
        switch (process.env.DB_TYPE) {
          case 'DYNAMODB':
            dbAdapter = (await import('@eyevinn/player-analytics-shared')).DynamoDBAdapter;
            break;
          case 'MONGODB':
            dbAdapter = (await import('@eyevinn/player-analytics-shared')).MongoDBAdapter;
            break;
          default:
            this.logger.warn(`No database type specified`);
            return undefined;
        }
        this.DBAdapter = new dbAdapter(this.logger);
      }
      const list = await this.DBAdapter.getItemsBySession({
        tableName: tableName ? tableName : process.env.TABLE_NAME,
        sessionId: sessionId,
      });
      return list;
    } catch (err) {
      this.logger.error(err);
      return [];
    }
  }
}
