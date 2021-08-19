import type { NextApiRequest, NextApiResponse } from 'next';
import appService from '../../../services/appService';

type ResponseData = {
  userId: string;
};

/*
Creates a user with a valid DigitalBits account
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const userId = await appService.createUser();
  res.status(200).json({
    userId,
  });
}
