import { error } from 'console';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const response = await fetch(process.env.BACKEND_URL + "/auth/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    const data = await response.json();
    if (!data.token) {
      res.status(500).json({message: "Failed to login. Please check your email and password."})
      return;
    }
    res.status(200).json({ token: data.token });
  } catch (error) {
    console.error('Login error:', error);
  }
}