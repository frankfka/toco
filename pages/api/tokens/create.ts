import type { NextApiRequest, NextApiResponse } from 'next';
import appService from '../../../services/appService';

type RequestBody = {
  userId: string; // User ID creating this token
  token: {
    code: string; // Alphanumeric up to 12 characters as per XDB guidelines
    name: string; // Not required, but good metadata
  };
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
  const { userId, token } = req.body as RequestBody;
  await appService.createToken(userId, token);
  res.status(200).json({
    success: true,
  });
}
