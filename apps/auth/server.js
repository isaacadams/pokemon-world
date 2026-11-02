const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
require("dotenv").config({ quiet: true });

const config = {
   CLIENT_URL: String(process.env.CLIENT_URL || "http://localhost:9000"),
   SLACK_CLIENT_SECRET: String(process.env.SLACK_CLIENT_SECRET)
};

app.use(
   cors({
      origin: [config.CLIENT_URL],
      methods: ["POST"],
      allowedHeaders: ["Content-Type"]
   })
);

app.get("/", async (req, res) => {
   res.status(200).send("hello world.");
});

app.post("/auth/slack", async (req, res) => {
   const code = req.query.code;
   if (typeof code !== "string" || code.length === 0) {
      res.status(400).json({ ok: false, error: "missing_code" });
      return;
   }
   const clientId = "618968880548.8580073800295";
   const clientSecret = config.SLACK_CLIENT_SECRET;
   const redirectUri = config.CLIENT_URL + "/callback.html";

   try {
      const response = await axios.post(
         "https://slack.com/api/oauth.v2.access",
         {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
         },
         {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
         }
      );

      // https://api.slack.com/methods/oauth.v2.access#errors
      // Never log or return full Slack responses: they hold access tokens and user PII.
      if (!response.data.ok) {
         console.error("oauth.v2.access failed:", response.data.error);
         res.status(400).json({ ok: false, error: "slack_auth_failed" });
         return;
      }

      const token = response.data.authed_user.access_token;
      const identity = await getSlackUserIdentity(token);
      if (!identity.ok) {
         console.error("users.identity failed:", identity.error);
         res.status(400).json({ ok: false, error: "slack_auth_failed" });
         return;
      }

      res.json({
         ok: true,
         user: { id: identity.user.id, name: identity.user.name, email: identity.user.email },
         team: { id: identity.team.id }
      });
   } catch (error) {
      // Not the error object itself: axios errors include the request body (client secret).
      console.error("Slack auth error:", error.message);
      res.status(500).json({ ok: false, error: "auth_failed" });
   }
});

app.listen(3000, () => console.log("Auth server on port 3000"));

async function getSlackUserIdentity(token) {
   const response = await axios.get("https://slack.com/api/users.identity", {
      headers: {
         Authorization: `Bearer ${token}`
      }
   });

   return response.data;
}
