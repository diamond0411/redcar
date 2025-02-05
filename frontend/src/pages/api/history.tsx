import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' || !req.headers.authorization) {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const response = await fetch(process.env.BACKEND_URL + "/history", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization,
        },
        
    })
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}