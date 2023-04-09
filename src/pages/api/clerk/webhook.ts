import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { prisma } from "@src/lib/prisma";

// const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";

// // These were all sent from the server
// const headers = {
//   "svix-id": "msg_p5jXN8AQM9LWM0D4loKWxJek",
//   "svix-timestamp": "1614265330",
//   "svix-signature": "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
// };
// const payload = '{"test": 2432232314}';

// const wh = new Webhook(secret);
// // Throws on error, returns the verified content on success
// const payload = wh.verify(payload, headers);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const { body, headers } = req;
    const wh = new Webhook(process.env.CLERK_SIGNIN_SECRET as string);
    const payload = wh.verify(body, headers as any) as {
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
