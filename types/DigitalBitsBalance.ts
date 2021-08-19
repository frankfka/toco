import { AssetType } from 'xdb-digitalbits-sdk';

export default interface DigitalBitsBalance {
  balance: string;
  asset_type: AssetType;
  // These are defined if asset type is NOT native
  asset_code?: string;
  asset_issuer?: string;
}
