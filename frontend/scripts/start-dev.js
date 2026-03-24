const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const isWindows = process.platform === "win32";
const frontendRoot = path.resolve(__dirname, "..");
const npmCommand = isWindows ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;

function run(label, args) {
  const child = spawn(npmCommand, args, {
    cwd: frontendRoot,
    // On Windows, enabling the shell avoids sporadic spawn EINVAL issues.
    shell: isWindows,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${label}] exited with signal ${signal}`);
      return;
    }

    if (typeof code === "number" && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      process.exitCode = code;
      shutdown();
    }
  });

  child.on("error", (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
    process.exitCode = 1;
    shutdown();
  });

  children.push(child);
  return child;
}

function isPortInUse(port, host = isWindows ? "127.0.0.1" : "0.0.0.0") {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(true);
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, host);
  });
}

async function isPortInUseAny(port) {
  try {
    const checkV4 = await isPortInUse(port, isWindows ? "127.0.0.1" : "0.0.0.0");
    if (checkV4) return true;
  } catch (_) {
    // ignore and try IPv6
  }

  try {
    const checkV6 = await isPortInUse(port, "::");
    if (checkV6) return true;
  } catch (_) {
    // ignore
  }

  return false;
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child && !child.killed) {
      child.kill();
    }
  }
}

async function main() {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    const backendPortInUse = await isPortInUseAny(5000);

    if (backendPortInUse) {
      console.log("[backend] port 5000 is already in use; assuming the backend is already running and skipping a duplicate start.");
    } else {
      run("backend", ["--prefix", "../backend", "run", "start"]);
    }

    run("frontend", ["run", "start:frontend"]);
  } catch (error) {
    console.error(`[start-dev] failed to check port availability: ${error.message}`);
    process.exitCode = 1;
    shutdown();
  }
}

main();
