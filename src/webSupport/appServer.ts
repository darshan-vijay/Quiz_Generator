import express, { Express } from "express";
import { configureGoogleFormApi } from "../services/server/apiConfig";
import cors from "cors";

export class AppServer {
  private app: Express;

  constructor() {
    this.app = express();

    // Enhanced proxy trust for headers
    this.app.set("trust proxy", 2); // Trust two levels of proxies (load balancer + ingress)

    // Body parsers with increased limits
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Enhanced CORS configuration
    const corsOptions = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        const allowedOrigins = [
          process.env.CORS_ORIGIN,
          "https://quiz-gen.online",
          "https://www.quiz-gen.online",
          "http://localhost:3000", // For local testing
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions)); // Enable pre-flight for all routes

    // Security headers middleware
    this.app.use((req, res, next) => {
      // Remove conflicting headers
      res.removeHeader("Cross-Origin-Opener-Policy");
      res.removeHeader("Cross-Origin-Embedder-Policy");

      // Set security headers
      res.setHeader(
        "Access-Control-Allow-Origin",
        req.headers.origin || process.env.CORS_ORIGIN || "*"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
      res.setHeader("X-Content-Type-Options", "nosniff");

      // For API routes, add additional headers
      if (req.path.startsWith("/api")) {
        res.setHeader("Cache-Control", "no-store, max-age=0");
      }

      next();
    });

    // Health check endpoint
    this.app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        protocol: req.protocol,
        secure: req.secure,
        host: req.get("host"),
        originalUrl: req.originalUrl,
      });
    });
  }

  public configureGoogleFormsApi(): void {
    configureGoogleFormApi(this.app);
  }

  public async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on port ${port}`);
        console.log(`CORS Origin: ${process.env.CORS_ORIGIN}`);
        console.log(
          `Google Forms API available at ${process.env.CORS_ORIGIN}/api/google-forms`
        );

        // Log all available routes
        const routes = this.app._router.stack
          .filter((r: any) => r.route)
          .map((r: any) => ({
            path: r.route.path,
            methods: Object.keys(r.route.methods),
          }));
        console.log("Available routes:", routes);

        resolve();
      });

      // Handle server errors
      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          console.error(`Port ${port} is already in use`);
        } else {
          console.error("Server error:", error);
        }
        process.exit(1);
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }
}
