import DigitalBitsAccount from '../../types/DigitalBitsAccount';
import DigitalBitsToken from '../../types/DigitalBitsToken';

export type DatabaseUser = {
  id: string;
  digitalBitsAccount: DigitalBitsAccount;
};

export type DatabaseSchema = {
  globals: {
    // Issuing account for ALL assets under Toco
    issuingAccount: DigitalBitsAccount;
  };
  // A user can be a merchant or a customer - to the Digitalbits blockchain, there is no difference
  users: Record<string, DatabaseUser>;
  // A mapping of the token asset code to the token metadata
  // Also holds the ID of the user that created the token
  tokens: Record<string, DigitalBitsToken & { creatorId: string }>;
};
