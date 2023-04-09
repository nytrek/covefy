import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { buffer } from "micro";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const { body, headers } = req;
    const svixId = headers["svix-id"]?.toString();
    const svixSignature = headers["svix-signature"]?.toString();
    const svixTimestamp = headers["svix-timestamp"]?.toString();
    if (!svixId || !svixSignature || !svixTimestamp)
      throw new Error("headers not found");
    const wh = new Webhook(process.env.CLERK_SIGNIN_SECRET as string);
    wh.verify(JSON.parse((await buffer(body)).toString()), {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    });
    res.status(200).send("success");
  } catch (err: any) {
    res.status(500).send(err.message);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
