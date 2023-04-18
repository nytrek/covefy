import { getAuth } from "@clerk/nextjs/server";
import fs from "fs";
import { sign } from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  if (req.method === "GET") {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).send("Unauthorized");
    const dir = path.resolve("./certs/jwt_rs256.key");
    const token = sign(
      {
        access: {
          pathPermissions: [
            {
              match: {
                path: "/uploads",
                scope: "Grandchildren+",
              },
              permissions: {
                read: {
                  file: {
                    downloadFile: ["*"],
                  },
                },
              },
            },
          ],
        },
      },
      fs.readFileSync(dir, "utf8"),
      {
        expiresIn: "60s",
        subject: userId,
        algorithm: "RS256",
      }
    );
    return res.status(200).setHeader("content-type", "text/plain").send(token);
  } else {
    return res.status(501).send("Not implemented");
  }
}
