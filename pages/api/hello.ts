import type { NextApiRequest, NextApiResponse } from 'next';
import appService from '../../services/appService';

/*
Test Endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const resp = await appService.createToken(req.body.id, req.body.token);
  res.status(200).json(resp);
}
