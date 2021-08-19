import { DatabaseSchema } from './databaseServiceTypes';

const mockInitialData: DatabaseSchema = {
  globals: {
    issuingAccount: {
      publicKey: 'GCL3PIK65NGMJC4YSR2HFL3EJDCZVQ7IAXTHIJGEIX3BMBQ4VN5X72JO',
      secretKey: 'SDTBVPWDUG2Z46BRM6G4TNFKJI5S7KWCQKWZHUSMUV6VXU6DQCBUZYGB',
    },
  },
  users: {},
  tokens: {},
};

export default mockInitialData;
