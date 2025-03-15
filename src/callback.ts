import build from "@config/build";
import PlayerData from "./game/PlayerData";

window.onload = async () => {
   try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (!!code) {
         // Create an AbortController to timeout the fetch request
         const controller = new AbortController();
         const timeoutId = setTimeout(() => {
            controller.abort(); // Abort the request after 5 seconds
         }, 5000);

         await fetch(new URL(`/auth/slack?code=${code}`, build.auth).toString(), {
            method: "POST",
            signal: controller.signal // Attach the abort signal
         })
            .then(response => {
               clearTimeout(timeoutId); // Clear timeout if response is received
               return response.json();
            })
            .then(data => {
               console.log(data);
               PlayerData.set(data);
            })
            .catch(error => {
               clearTimeout(timeoutId); // Clear timeout on error

               if (error.name === "AbortError") {
                  // Timeout case is already handled by proceedWithDefaultData
                  console.log("Request timed out after 5 seconds");
               } else {
                  localStorage.setItem("error", JSON.stringify(error));
               }
            });
      }
   } catch (error) {
      localStorage.setItem("error", JSON.stringify(error));
   } finally {
      window.location.href = "/game.html";
   }
};
