import { z } from "zod";

const key = "data";

// Zod schema for validating localStorage data
const Schema = z.object({
   ok: z.boolean().refine(val => val === true, { message: "ok must be true" }),
   user: z.object({
      name: z.string(),
      id: z.string(),
      email: z.string().email()
   }),
   team: z.object({
      id: z.string()
   })
});

export type UserData = z.infer<typeof Schema>;

class PlayerData {
   createDefaultData(name: string): UserData {
      return {
         ok: true,
         user: {
            name: name,
            id: "GUEST_" + Math.random().toString(36).substring(2, 9),
            email: "guest@example.com"
         },
         team: {
            id: "GUEST_TEAM"
         }
      };
   }

   validate(data: any) {
      return Schema.safeParse(data);
   }

   clear() {
      localStorage.removeItem(key);
   }

   set(data: any) {
      if (Schema.safeParse(data).success) {
         localStorage.setItem(key, JSON.stringify(data));
         return true;
      }

      return false;
   }

   check(): UserData | null {
      console.log("Checking user data...");
      const rawData = localStorage.getItem(key);
      let userData: UserData | null = null;

      if (rawData) {
         try {
            const parsedData = JSON.parse(rawData);
            const result = Schema.safeParse(parsedData);
            if (result.success) {
               userData = result.data;
               console.log("Valid user data found:", userData);
            } else {
               console.log("Invalid user data:", result.error);
            }
         } catch (e) {
            console.error("Failed to parse localStorage data:", e);
         }
      } else {
         console.log("No user data found in localStorage");
      }

      return userData;
   }
}

export default new PlayerData();
