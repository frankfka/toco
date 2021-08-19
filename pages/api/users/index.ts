import type { NextApiRequest, NextApiResponse } from 'next';
import appService from '../../../services/appService';
import { DatabaseUser } from '../../../services/database/databaseServiceTypes';
import DigitalBitsBalance from '../../../types/DigitalBitsBalance';

type RequestParams = {
  userId: string;
};

type ResponseData = {
  data: DatabaseUser & { balances: DigitalBitsBalance[] };
};

/*
Retrieves a user given an ID
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { userId } = req.query as RequestParams;
  const userData = await appService.getUser(userId);
  res.status(200).json({
    data: userData,
  });
}
