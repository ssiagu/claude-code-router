import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import path, { join } from "path";
import { initConfig, initDir, cleanupLogFiles } from "./utils";
import { createServer } from "./server";
import { router } from "./utils/router";
import { apiKeyAuth } from "./middleware/auth";
import {
  cleanupPidFile,
  isServiceRunning,
  savePid,
} from "./utils/processCheck";
import { CONFIG_FILE } from "./constants";
import createWriteStream from "pino-rotating-file-stream";
import { HOME_DIR } from "./constants";
import { configureLogging } from "./utils/log";
import { sessionUsageCache } from "./utils/cache";
import Stream from "node:stream";

async function initializeClaudeConfig() {
  const homeDir = homedir();
  const configPath = join(homeDir, ".claude.json");
  if (!existsSync(configPath)) {
    const userID = Array.from(
      { length: 64 },
      () => Math.random().toString(16)[2]
    ).join("");
    const configContent = {
      numStartups: 184,
      autoUpdaterStatus: "enabled",
      userID,
      hasCompletedOnboarding: true,
      lastOnboardingVersion: "1.0.17",
      projects: {},
    };
    await writeFile(configPath, JSON.stringify(configContent, null, 2));
  }
}

interface RunOptions {
  port?: number;
}

async function run(options: RunOptions = {}) {
  // Check if service is already running
  if (isServiceRunning()) {
    console.log("✅ Service is already running in the background.");
    return;
  }

  await initializeClaudeConfig();
  await initDir();
  // Clean up old log files, keeping only the 10 most recent ones
  await cleanupLogFiles();
  const config = await initConfig();

  // Configure logging based on config
  configureLogging(config);

  let HOST = config.HOST;

  if (config.HOST && !config.APIKEY) {
    HOST = "127.0.0.1";
    console.warn("⚠️ API key is not set. HOST is forced to 127.0.0.1.");
  }

  const port = config.PORT || 3456;

  // Save the PID of the background process
  savePid(process.pid);

  // Handle SIGINT (Ctrl+C) to clean up PID file
  process.on("SIGINT", () => {
    console.log("Received SIGINT, cleaning up...");
    cleanupPidFile();
    process.exit(0);
  });

  // Handle SIGTERM to clean up PID file
  process.on("SIGTERM", () => {
    cleanupPidFile();
    process.exit(0);
  });
  console.log(HOST);

  // Use port from environment variable if set (for background process)
  const servicePort = process.env.SERVICE_PORT
    ? parseInt(process.env.SERVICE_PORT)
    : port;

  // Configure logger based on config settings
  const loggerConfig =
    config.LOG !== false
      ? {
          level: config.LOG_LEVEL || "debug",
          stream: createWriteStream({
            path: HOME_DIR,
            filename: config.LOGNAME || `./logs/ccr-${+new Date()}.log`,
            maxFiles: 3,
            interval: "1d",
          }),
        }
      : false;

  const server = createServer({
    jsonPath: CONFIG_FILE,
    initialConfig: {
      // ...config,
      providers: config.Providers || config.providers,
      HOST: HOST,
      PORT: servicePort,
      LOG_FILE: join(
        homedir(),
        ".claude-code-router",
        "claude-code-router.log"
      ),
    },
    logger: loggerConfig,
  });
  // Add async preHandler hook for authentication
  server.addHook("preHandler", async (req, reply) => {
    return new Promise((resolve, reject) => {
      const done = (err?: Error) => {
        if (err) reject(err);
        else resolve();
      };
      // Call the async auth function
      apiKeyAuth(config)(req, reply, done).catch(reject);
    });
  });
  server.addHook("preHandler", async (req, reply) => {
    if (req.url.startsWith("/v1/messages")) {
      try {
        await router(req, reply, config);
      } catch (error: any) {
        // 处理/model命令相关的错误
        if (error.message && (error.message.includes('模型') || error.message.includes('命令格式错误'))) {
          // 生成符合 Claude API 格式的错误响应
          const errorResponse = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "message",
            role: "assistant",
            content: [
              {
                type: "text",
                text: `❌ ${error.message}`
              }
            ],
            model: req.body.model || "unknown",
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: {
              input_tokens: 0,
              output_tokens: Math.ceil(error.message.length / 4) // 估算token数量
            }
          };
          
          reply.code(200).send(errorResponse);
          return;
        }
        // 其他错误继续抛出
        throw error;
      }
    }
  });
  server.addHook("onSend", (req, reply, payload, done) => {
    if (req.sessionId && req.url.startsWith("/v1/messages")) {
      if (payload instanceof ReadableStream) {
        const [originalStream, clonedStream] = payload.tee();
        const read = async (stream: ReadableStream) => {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Process the value if needed
            const dataStr = new TextDecoder().decode(value);
            if (!dataStr.startsWith("event: message_delta")) {
              continue;
            }
            const str = dataStr.slice(27);
            try {
              const message = JSON.parse(str);
              sessionUsageCache.put(req.sessionId, message.usage);
            } catch {}
          }
        }
        read(clonedStream);
        done(null, originalStream)
      } else {
        req.log.debug({payload}, 'onSend Hook')
        sessionUsageCache.put(req.sessionId, payload.usage);
        if (payload instanceof Buffer || payload instanceof Response) {
          done(null, payload);
        } else if(typeof payload === "object") {
          done(null, JSON.stringify(payload));
        } else {
          done(null, payload);
        }
      }
    } else {
      if(payload instanceof Buffer || payload instanceof Response || payload === null || payload instanceof ReadableStream || payload instanceof Stream) {
        done(null, payload);
      } else if(typeof payload === "object") {
        req.log.debug({payload}, 'onSend Hook')
        done(null, JSON.stringify(payload));
      } else {
        done(null, payload);
      }
    }
  });
  server.start();
}

export { run };
// run();
