const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
require("dotenv").config();

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
      if (!response.data.ok) {
         console.error(response.data);
         res.status(400).send(response.data);
         return;
      }

      console.log(response.data);
      const token = response.data.authed_user.access_token;
      const user = await getSlackUserIdentity(token);
      res.json(user);
   } catch (error) {
      console.error(error);
      res.status(500).send("Authentication failed");
   }
});

app.listen(3000, () => console.log("Auth server on port 3000"));

async function getSlackUserIdentity(token) {
   const response = await axios.get("https://slack.com/api/users.identity", {
      headers: {
         Authorization: `Bearer ${token}`
      }
   });

   console.log("identity response:", response.data);

   if (response.data.ok) {
      const slackUser = {
         id: response.data.user.id, // e.g., "U1234567890"
         name: response.data.user.name, // e.g., "johndoe" (username)
         realName: response.data.user.real_name // e.g., "John Doe" (display name)
      };
      console.log(slackUser);
   }

   return response.data;
}
