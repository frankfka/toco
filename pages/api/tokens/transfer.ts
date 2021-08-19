import type { NextApiRequest, NextApiResponse } from 'next';
import appService from '../../../services/appService';

type RequestBody = {
  fromId: string; // User ID transferring token
  toId: string; // Destination user ID
  tokenCode: string; // Asset code of token (must be issued by the toco issuing account)
  amount: number;
};

type ResponseData = {
  success: boolean;
};

/*
Creates a token given the calling user and token parameters
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { fromId, toId, tokenCode, amount } = req.body as RequestBody;
  await appService.transferToken(fromId, toId, tokenCode, amount);
  res.status(200).json({
    success: true,
  });
}
