import fs from "node:fs/promises";
import { buscarCalendario } from "./calendario.js";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const conversations = new Map();
const processedMessages = new Set();

let systemPrompt = "";

async function loadPrompt() {
  if (!systemPrompt) {
    systemPrompt = await fs.readFile(
      new URL("./prompt.txt", import.meta.url),
      "utf8"
    );
  }

  return systemPrompt;
}

function getConversation(phoneNumber) {
  if (!conversations.has(phoneNumber)) {
    conversations.set(phoneNumber, []);
  }

  return conversations.get(phoneNumber);
}

function trimConversation(messages) {
  return messages.slice(-20);
}

function buildToolResult(query, modalidad) {
  return buscarCalendario({
    query,
    modalidad
  });
}

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_calendario_duoc",
      description:
        "Busca fechas claras y verificadas de los calendarios académicos 2026 de Duoc UC base/presencial y online. Úsala obligatoriamente para cualquier pregunta de fechas, matrícula, clases, semana cero, semestre cero, inducción, inscripción, retiro, suspensión, apelación, exámenes, cierres y feriados.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Pregunta completa del estudiante. En seguimientos debe incluir el tema anterior."
          },
          modalidad: {
            type: "string",
            enum: ["base", "presencial", "online", ""],
            description:
              "Modalidad base/presencial, online o vacío si no se conoce."
          }
        },
        required: ["query"]
      }
    }
  }
];

async function callOpenRouter(messages) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-OpenRouter-Title":
        process.env.APP_NAME || "Asistente Academico Duoc"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-5.4",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

function getAssistantMessage(data) {
  return data?.choices?.[0]?.message || null;
}

function cleanText(value) {
  return String(value || "").trim();
}

export async function generateReply({
  phoneNumber,
  userMessage
}) {
  const prompt = await loadPrompt();
  const history = getConversation(phoneNumber);

  history.push({
    role: "user",
    content: userMessage
  });

  const messages = [
    {
      role: "system",
      content: prompt
    },
    ...trimConversation(history)
  ];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const data = await callOpenRouter(messages);
    const assistantMessage = getAssistantMessage(data);

    if (!assistantMessage) {
      throw new Error("OpenRouter no devolvió un mensaje válido");
    }

    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls.length === 0) {
      const reply =
        cleanText(assistantMessage.content) ||
        "No pude generar una respuesta en este momento.";

      history.push({
        role: "assistant",
        content: reply
      });

      conversations.set(
        phoneNumber,
        trimConversation(history)
      );

      return reply;
    }

    for (const toolCall of toolCalls) {
      if (toolCall.function?.name !== "buscar_calendario_duoc") {
        continue;
      }

      let args = {};

      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        args = {
          query: userMessage,
          modalidad: ""
        };
      }

      const result = buildToolResult(
        args.query || userMessage,
        args.modalidad || ""
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: "buscar_calendario_duoc",
        content: JSON.stringify(result)
      });
    }
  }

  const fallback =
    "No pude completar la consulta. Intenta nuevamente.";

  history.push({
    role: "assistant",
    content: fallback
  });

  conversations.set(
    phoneNumber,
    trimConversation(history)
  );

  return fallback;
}

export function hasProcessedMessage(messageId) {
  return processedMessages.has(messageId);
}

export function markMessageProcessed(messageId) {
  processedMessages.add(messageId);

  if (processedMessages.size > 5000) {
    const first = processedMessages.values().next().value;
    processedMessages.delete(first);
  }
}

export function clearConversation(phoneNumber) {
  conversations.delete(phoneNumber);
}
