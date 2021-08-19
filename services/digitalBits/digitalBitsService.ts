import DigitalBitsSdk, {
  AccountResponse,
  Asset,
  AssetType,
  Frontier,
  Keypair,
  Operation,
  OperationOptions,
  Server,
  Transaction,
  TransactionBuilder,
} from 'xdb-digitalbits-sdk';
import DigitalBitsAccount from '../../types/DigitalBitsAccount';
import DigitalBitsBalance from '../../types/DigitalBitsBalance';
import DigitalBitsToken from '../../types/DigitalBitsToken';

const convertStrToAmount = (amount: string): number => {
  return Number(amount);
};

const convertAmountToStr = (amount: number): string => {
  // XDB allows 7 decimal places
  return amount.toFixed(7);
};

export default class DigitalBitsService {
  private readonly xdbServer: Server;

  constructor() {
    this.xdbServer = new DigitalBitsSdk.Server(
      'https://frontier.testnet.digitalbits.io'
    );
  }

  async createAccount(): Promise<DigitalBitsAccount> {
    // Generate a new account
    const keyPair = DigitalBitsSdk.Keypair.random();
    const acct: DigitalBitsAccount = {
      publicKey: keyPair.publicKey(),
      secretKey: keyPair.secret(),
    };

    // Fund the account for testnet transactions. In production, we'd
    // fund the account from our distribution account as needed for transactions
    await fetch(
      `https://frontier.testnet.digitalbits.io/friendbot?addr=${encodeURIComponent(
        acct.publicKey
      )}`
    );

    return acct;
  }

  async getAccountBalances(
    account: DigitalBitsAccount
  ): Promise<DigitalBitsBalance[]> {
    const loadedAccount = await this.xdbServer.loadAccount(account.publicKey);

    return loadedAccount.balances;
  }

  async createToken(
    token: DigitalBitsToken,
    merchantAccount: DigitalBitsAccount,
    tocoAccount: DigitalBitsAccount
  ): Promise<void> {
    // A create token is just a transfer from the Toco issuing account to the merchant account
    await this.transferToken(
      tocoAccount,
      merchantAccount,
      tocoAccount,
      token,
      922337203685.4775807 // Max int64
    );
  }

  async transferToken(
    fromAccount: DigitalBitsAccount,
    toAccount: DigitalBitsAccount,
    tocoAccount: DigitalBitsAccount,
    token: DigitalBitsToken,
    amount: number
  ): Promise<void> {
    // Check trust first
    const fromAcctBalance = await this.getBalance(
      fromAccount,
      tocoAccount,
      token
    );
    const toAcctBalance = await this.getBalance(toAccount, tocoAccount, token);

    console.log('From account balance', fromAcctBalance);
    console.log('To account balance', toAcctBalance);

    if (
      // Only check source balance if we're not issuing
      fromAccount.publicKey != tocoAccount.publicKey &&
      (fromAcctBalance == null ||
        convertStrToAmount(fromAcctBalance.balance) < amount)
    ) {
      throw Error('Insufficient source balance');
    }

    if (toAcctBalance == null) {
      console.log('Destination account has no trust, initializing trust now');
      // No trust, create a change trust operation
      await this.changeTrust(toAccount, tocoAccount, token);
    }

    // Make the payment transaction
    const paymentTransactionBuilder = await this.getTransactionBuilder(
      fromAccount
    );
    const paymentOpts: OperationOptions.Payment = {
      amount: convertAmountToStr(amount),
      asset: this.getAsset(token, tocoAccount),
      destination: toAccount.publicKey,
    };
    const paymentTransaction: Transaction = paymentTransactionBuilder
      .addOperation(Operation.payment(paymentOpts))
      .setTimeout(30)
      .build();

    try {
      await this.submitTransaction(fromAccount, paymentTransaction);
    } catch (err) {
      console.error('Error submitting payment transaction');
      if (err.response?.data != null) {
        console.error(JSON.stringify(err.response.data));
      }
      throw err;
    }
  }

  // If undefined, then no trustline exists
  async getBalance(
    account: DigitalBitsAccount,
    tocoAccount: DigitalBitsAccount,
    token: DigitalBitsToken
  ): Promise<DigitalBitsBalance | undefined> {
    const accountBalances = await this.getAccountBalances(account);
    return accountBalances.find(
      (balance) =>
        balance.asset_issuer === tocoAccount.publicKey &&
        balance.asset_code === token.code
    );
  }

  // Creates trust from the given account to the issuing account (the Toco account) for the token
  private async changeTrust(
    account: DigitalBitsAccount,
    tocoAccount: DigitalBitsAccount,
    token: DigitalBitsToken
  ): Promise<void> {
    const asset = this.getAsset(token, tocoAccount);

    const changeTrustTransactionBuilder = await this.getTransactionBuilder(
      account
    );

    const changeTrustTransaction: Transaction = changeTrustTransactionBuilder
      .addOperation(
        Operation.changeTrust({
          asset,
        })
      )
      .setTimeout(30)
      .build();

    try {
      await this.submitTransaction(account, changeTrustTransaction);
    } catch (err) {
      console.error('Error executing change trust');
      if (err.response?.data != null) {
        console.error(JSON.stringify(err.response.data));
      }
      throw err;
    }
  }

  private getAsset(
    token: DigitalBitsToken,
    tocoAccount: DigitalBitsAccount
  ): Asset {
    return new Asset(token.code, tocoAccount.publicKey);
  }

  private async getTransactionBuilder(
    sourceAccount: DigitalBitsAccount
  ): Promise<TransactionBuilder> {
    const txnFee = await this.xdbServer.fetchBaseFee();
    const account = await this.getAccount(sourceAccount);

    return new TransactionBuilder(account, {
      fee: convertAmountToStr(txnFee),
      networkPassphrase: DigitalBitsSdk.Networks.TESTNET,
    });
  }

  private async submitTransaction(
    submittingAccount: DigitalBitsAccount,
    transaction: Transaction
  ): Promise<Frontier.SubmitTransactionResponse> {
    console.log('Submitting transaction', transaction.operations);
    const keyPair = this.getKeyPair(submittingAccount);
    transaction.sign(keyPair);

    return this.xdbServer.submitTransaction(transaction);
  }

  private async getAccount(
    storedAccount: DigitalBitsAccount
  ): Promise<AccountResponse> {
    return this.xdbServer.loadAccount(storedAccount.publicKey);
  }

  private getKeyPair(account: DigitalBitsAccount): Keypair {
    return DigitalBitsSdk.Keypair.fromSecret(account.secretKey);
  }

  private async getTransactionBuilderParams() {}
}
