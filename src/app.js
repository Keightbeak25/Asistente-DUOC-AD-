import "dotenv/config";
import readline from "node:readline";
import { generateReply } from "./chatbot.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log("asistente académico duoc");
  console.log("escribe 'salir' para terminar.\n");

  const phoneNumber = "usuario-local";

  while (true) {
    const userMessage = await ask("tú: ");

    if (userMessage.trim().toLowerCase() === "salir") {
      break;
    }

    if (!userMessage.trim()) {
      continue;
    }

    try {
      const reply = await generateReply({
        phoneNumber,
        userMessage
      });

      console.log(`bot: ${reply}\n`);
    } catch (error) {
      console.error("error:", error.message);
    }
  }

  rl.close();
}

main();
