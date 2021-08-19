import { tmpdir } from 'os';
import { join } from 'path';
import { JSONFile, Low } from 'lowdb';
import DigitalBitsAccount from '../../types/DigitalBitsAccount';
import DigitalBitsToken from '../../types/DigitalBitsToken';
import { DatabaseSchema, DatabaseUser } from './databaseServiceTypes';
import mockInitialData from './mockInitialData';

type DatabaseState = 'ready' | 'initializing' | 'initialized';

// Essentially a mock database
export default class DatabaseService {
  private currentState: DatabaseState = 'ready';
  private readonly db: Low<DatabaseSchema>;

  constructor() {
    const dbBasePath = process.env.NODE_ENV === 'production' ? tmpdir() : './';
    // Use demo data - in reality, we would establish a connection to a remote DB
    this.db = new Low<DatabaseSchema>(
      new JSONFile(join(dbBasePath, 'local-mock-db.json'))
    );
    this.init();
  }

  private async init() {
    if (this.currentState != 'ready') {
      return;
    }

    await this.db.read();
    if (this.db.data != null) {
      console.log('Skipping initialization as DB already has data');
      this.currentState = 'initialized';
      return;
    }

    console.log('Recreating DB with mock data');

    this.currentState = 'initializing';
    this.db.data = mockInitialData;
    await this.db.write();
    this.currentState = 'initialized';
  }

  async getTocoDigitalBitsAccount(): Promise<DigitalBitsAccount> {
    const dbData = await this.getDatabaseData();

    return dbData.globals.issuingAccount;
  }

  async saveUser(user: DatabaseUser): Promise<void> {
    const dbData = await this.getDatabaseData();

    dbData.users[user.id] = user;
    await this.db.write();
  }

  async getUser(id: string): Promise<DatabaseUser | undefined> {
    const dbData = await this.getDatabaseData();

    return dbData.users[id];
  }

  async saveCreatedToken(
    userId: string,
    token: DigitalBitsToken
  ): Promise<void> {
    const dbData = await this.getDatabaseData();

    // Add to created tokens
    dbData.tokens[token.code] = {
      ...token,
      creatorId: userId,
    };
    await this.db.write();
  }

  async getToken(
    code: string
  ): Promise<(DigitalBitsToken & { creatorId: string }) | undefined> {
    const dbData = await this.getDatabaseData();

    return dbData.tokens[code];
  }

  private async getDatabaseData(): Promise<DatabaseSchema> {
    await this.init();
    return this.db.data!;
  }
}
