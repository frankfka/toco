import { nanoid } from 'nanoid';
import DigitalBitsBalance from '../types/DigitalBitsBalance';
import DigitalBitsToken from '../types/DigitalBitsToken';
import DatabaseService from './database/databaseService';
import { DatabaseUser } from './database/databaseServiceTypes';
import DigitalBitsService from './digitalBits/digitalBitsService';

export class AppService {
  private dbService: DatabaseService;
  private digitalBitsService: DigitalBitsService;

  constructor() {
    this.dbService = new DatabaseService();
    this.digitalBitsService = new DigitalBitsService();
  }

  // Returns user ID
  public async createUser(): Promise<string> {
    const userId = nanoid();
    const digitalBitsAccount = await this.digitalBitsService.createAccount();

    console.log('Created XDB account', digitalBitsAccount, 'for user', userId);

    const newUser: DatabaseUser = {
      id: userId,
      digitalBitsAccount,
    };

    await this.dbService.saveUser(newUser);

    console.log('Saved user', newUser);

    return userId;
  }

  // Retrieves user info
  public async getUser(
    id: string
  ): Promise<DatabaseUser & { balances: DigitalBitsBalance[] }> {
    const userAccount = await this.dbService.getUser(id);

    if (userAccount == null) {
      throw Error('User does not exist');
    }
    const userBalances = await this.digitalBitsService.getAccountBalances(
      userAccount.digitalBitsAccount
    );

    return {
      ...userAccount,
      balances: userBalances,
    };
  }

  // Creates a new merchant token
  public async createToken(
    userId: string,
    token: DigitalBitsToken
  ): Promise<void> {
    // Get required data
    const tocoDigitalBitsAccount =
      await this.dbService.getTocoDigitalBitsAccount();
    const user = await this.dbService.getUser(userId);

    if (user == null) {
      throw Error('User does not exist');
    }

    // Create the token
    await this.digitalBitsService.createToken(
      token,
      user.digitalBitsAccount,
      tocoDigitalBitsAccount
    );

    // Save to user data
    await this.dbService.saveCreatedToken(userId, token);
  }

  public async transferToken(
    fromId: string,
    toId: string,
    tokenCode: string,
    amount: number
  ): Promise<void> {
    const fromUser = await this.dbService.getUser(fromId);
    const toUser = await this.dbService.getUser(toId);
    const token = await this.dbService.getToken(tokenCode);

    if (fromUser == null || toUser == null || token == null) {
      console.error('Some entities are null', fromUser, toUser, token);
      throw Error('Invalid request');
    }

    await this.digitalBitsService.transferToken(
      fromUser.digitalBitsAccount,
      toUser.digitalBitsAccount,
      await this.dbService.getTocoDigitalBitsAccount(),
      token,
      amount
    );
  }
}

const appService = new AppService();

export default appService;
