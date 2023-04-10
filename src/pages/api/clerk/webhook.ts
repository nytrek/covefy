import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { prisma } from "@src/lib/prisma";
import { buffer } from "micro";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const { headers } = req;
    const raw = (await buffer(req)).toString();
    const svixId = headers["svix-id"]?.toString();
    const svixSignature = headers["svix-signature"]?.toString();
    const svixTimestamp = headers["svix-timestamp"]?.toString();
    if (!svixId || !svixSignature || !svixTimestamp)
      throw new Error("headers not found");
    const wh = new Webhook(process.env.CLERK_SIGNIN_SECRET as string);
    const payload = wh.verify(raw, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as {
      data: {
        id: string;
        first_name: string;
        last_name: string;
        image_url: string;
        username: string;
      };
      type: "user.created" | "user.updated" | "user.deleted";
    };
    if (payload.type === "user.created") {
      await prisma.profile.create({
        data: {
          id: payload.data.id,
          name: payload.data.first_name + " " + payload.data.last_name,
          imageUrl: payload.data.image_url,
          username: payload.data.username,
          credits: 10,
        },
      });
    } else if (payload.type === "user.updated") {
      await prisma.profile.update({
        data: {
          name: payload.data.first_name + " " + payload.data.last_name,
          imageUrl: payload.data.image_url,
          username: payload.data.username,
        },
        where: {
          id: payload.data.id,
        },
      });
    } else {
      await prisma.profile.delete({
        where: {
          id: payload.data.id,
        },
      });
    }
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
