"use node";

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();

export const processCommand = action({
  args: {
    command: v.string(),
    userId: v.id("users"),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the user's command
    await ctx.runMutation(api.neo.storeMessage, {
      message: args.command,
      userId: args.userId,
      role: "user",
    });

    let response = "Entschuldigung, ich verstehe nicht.";
    
    // Basic command parsing
    const cmd = args.command.toLowerCase();
    
    if (cmd.includes("wetter")) {
      response = await handleWeatherCommand(cmd, args.location);
    } else if (cmd.includes("zeit") || cmd.includes("uhr")) {
      response = await handleTimeCommand();
    } else if (cmd.includes("rechne") || cmd.includes("mal") || cmd.includes("plus")) {
      response = handleMathCommand(cmd);
    } else if (cmd.includes("spiel") || cmd.includes("schere") || cmd.includes("stein") || cmd.includes("papier")) {
      response = handleGameCommand(cmd);
    } else if (cmd.includes("nachrichten") || cmd.includes("news")) {
      response = await handleNewsCommand(cmd);
    } else if (cmd.includes("aktien") || cmd.includes("krypto") || cmd.includes("börse")) {
      response = await handleFinanceCommand(cmd);
    } else {
      // Default to chat mode
      response = await handleChatCommand(cmd);
    }

    // Store Neo's response
    await ctx.runMutation(api.neo.storeMessage, {
      message: response,
      userId: args.userId,
      role: "assistant",
    });

    return response;
  },
});

export const storeMessage = mutation({
  args: {
    message: v.string(),
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getConversationHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
  },
});

export const getPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
    return preferences || { outputMode: "text" };
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    outputMode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { outputMode: args.outputMode });
    } else {
      await ctx.db.insert("preferences", args);
    }
  },
});

async function handleWeatherCommand(cmd: string, location?: string) {
  try {
    const city = location || "Berlin";
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true`
    );
    const weather = response.data.current_weather;
    return `Das Wetter in ${city}: ${weather.temperature}°C`;
  } catch (error) {
    return "Entschuldigung, ich konnte das Wetter nicht abrufen.";
  }
}

async function handleTimeCommand() {
  try {
    const response = await axios.get("http://worldtimeapi.org/api/timezone/Europe/Berlin");
    const time = new Date(response.data.datetime).toLocaleTimeString("de-DE");
    return `Es ist ${time} Uhr.`;
  } catch (error) {
    const time = new Date().toLocaleTimeString("de-DE");
    return `Es ist ${time} Uhr.`;
  }
}

function handleMathCommand(cmd: string) {
  const numbers = cmd.match(/\d+/g)?.map(Number) || [];
  if (numbers.length < 2) return "Ich verstehe die Berechnung nicht.";

  if (cmd.includes("mal")) {
    return `Das Ergebnis ist ${numbers[0] * numbers[1]}.`;
  } else if (cmd.includes("plus")) {
    return `Das Ergebnis ist ${numbers[0] + numbers[1]}.`;
  }
  
  return "Ich verstehe die Berechnung nicht.";
}

function handleGameCommand(cmd: string) {
  const choices = ["Schere", "Stein", "Papier"];
  const neoChoice = choices[Math.floor(Math.random() * choices.length)];
  
  let userChoice = "";
  if (cmd.includes("schere")) userChoice = "Schere";
  else if (cmd.includes("stein")) userChoice = "Stein";
  else if (cmd.includes("papier")) userChoice = "Papier";
  else return "Sage 'Schere', 'Stein' oder 'Papier'.";

  return `Ich wähle ${neoChoice}. ${determineWinner(userChoice, neoChoice)}`;
}

function determineWinner(userChoice: string, neoChoice: string) {
  if (userChoice === neoChoice) return "Unentschieden!";
  if (
    (userChoice === "Schere" && neoChoice === "Papier") ||
    (userChoice === "Stein" && neoChoice === "Schere") ||
    (userChoice === "Papier" && neoChoice === "Stein")
  ) {
    return "Du gewinnst!";
  }
  return "Ich gewinne!";
}

async function handleNewsCommand(cmd: string) {
  try {
    const feed = await parser.parseURL("https://www.tagesschau.de/xml/rss2/");
    const latestNews = feed.items[0];
    return latestNews?.title || "Keine aktuellen Nachrichten verfügbar.";
  } catch (error) {
    return "Entschuldigung, ich konnte keine Nachrichten abrufen.";
  }
}

async function handleFinanceCommand(cmd: string) {
  try {
    const response = await axios.get("https://api.frankfurter.app/latest?from=EUR&to=USD");
    return `Der aktuelle EUR/USD Kurs ist: ${response.data.rates.USD}`;
  } catch (error) {
    return "Entschuldigung, ich konnte keine Finanzdaten abrufen.";
  }
}

async function handleChatCommand(cmd: string) {
  const responses = {
    hallo: "Hallo! Wie kann ich dir helfen?",
    "wie geht's": "Mir geht es gut, danke der Nachfrage! Wie geht es dir?",
    danke: "Gerne! Kann ich sonst noch etwas für dich tun?",
    tschüss: "Auf Wiedersehen! Matrix Ende.",
    default: "Ich verstehe. Kann ich dir irgendwie helfen?"
  };

  for (const [key, value] of Object.entries(responses)) {
    if (cmd.includes(key)) return value;
  }

  return responses.default;
}
