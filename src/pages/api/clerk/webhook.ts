import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { buffer } from "micro";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const { headers } = req;
    const raw = (await buffer(req.body.data)).toString();
    const body = JSON.parse(raw);
    const svixId = headers["svix-id"]?.toString();
    const svixSignature = headers["svix-signature"]?.toString();
    const svixTimestamp = headers["svix-timestamp"]?.toString();
    if (!svixId || !svixSignature || !svixTimestamp)
      throw new Error("headers not found");
    const wh = new Webhook(process.env.CLERK_SIGNIN_SECRET as string);
    wh.verify(body, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    });
    res
      .status(200)
      .send(
        `id: ${svixId}. timestamp: ${svixTimestamp}. signature: ${svixSignature}`
      );
  } catch (err: any) {
    res.status(500).send(err.message);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
