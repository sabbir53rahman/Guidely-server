import app from "./app";
import { seedSuperAdmin } from "./app/utils/seed";
import { envVars } from "./config/env";

const bootstrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on PORT 5000`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

bootstrap();
