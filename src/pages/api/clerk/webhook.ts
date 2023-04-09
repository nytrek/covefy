import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { prisma } from "@src/lib/prisma";

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
    const payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as {
      data: {
        id: string;
        fullName: string;
        username: string;
        profileImageUrl: string;
      };
    };
    await prisma.profile.create({
      data: {
        id: payload.data.id,
        name: payload.data.fullName,
        imageUrl: payload.data.profileImageUrl,
        username: payload.data.username,
        credits: 0,
      },
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
