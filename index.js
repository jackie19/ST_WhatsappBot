const { spawn } = require("child_process");
const log = require("./logger/logs.js");

console.log("Starting WhatsApp Bot...\n");

function startProject() {
  const child = spawn("node", ["ST.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("error", (error) => {
    console.error("Failed to start bot:", error);
  });

  child.on("close", (code) => {
    console.log(`\nBot process exited with code ${code}`);
    if (code == 2) {
      log.info("Restarting Project...");
      setTimeout(() => startProject(), 1000);
    } else if (code !== 0) {
      console.error("Bot exited with error. Check logs above.");
    }
  });
}

startProject();