import { Config } from "./infrastructure/config";
import { createServer } from "./server";

(async () => {
  try {
    const app = await createServer();
    app.listen(Config.port, () => {
      console.log(`Server running on port ${Config.port}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
})();
