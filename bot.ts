import { Bot } from "grammy"
import { exercises } from "./src/exercises"
import * as dotenv from "dotenv";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

interface SessionData {
  exerciseIndex: number;
  startTime: number; // Timestamp when the session started
  restTimer?: NodeJS.Timeout; // Timer for rest periods
  isInRestMessage: boolean; // Indicates if the user is in the rest message state
}

const userSessions: Record<string, SessionData> = {}

bot.command("start", async (ctx) => {
    const userId = ctx.from?.id?.toString() || ""

    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now(),
            isInRestMessage: false
        }
    }

    await ctx.reply("Welcome to the Training Program! Press 'Start Session' to begin.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    })
})

bot.command("reset", async (ctx) => {
    const userId = ctx.from?.id?.toString() || ""

    if (userSessions[userId]) delete userSessions[ctx.from?.id?.toString() || ""]

    await ctx.reply("See you next time!", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    })
})

// Handle "Start Session" button
bot.callbackQuery("start_session", async (ctx) => {
  const userId = ctx.from?.id?.toString() || "";
  const session = userSessions[userId];

  if (!session) return;

  session.exerciseIndex = 0;
  session.startTime = Date.now();
  session.isInRestMessage = false; // Initialize the rest message state

  await sendExercise(ctx, session);
});

bot.callbackQuery("next_exercise", async (ctx) => {
  const userId = ctx.from?.id?.toString() || "";
  const session = userSessions[userId];

  if (!session) return;

  const currentExercise = exercises[session.exerciseIndex];

  if (currentExercise.hasRest && session.isInRestMessage) {
    // If the user is in the rest message state, start the rest period
    await handleRestPeriod(ctx, session);
    return;
  }

  // Move to the next exercise
  session.exerciseIndex++;

  if (session.exerciseIndex < exercises.length) {
    const nextExercise = exercises[session.exerciseIndex];

    if (nextExercise.hasRest) {
      // Mark the session as in rest message state
      session.isInRestMessage = true;
    } else {
      // Reset the rest message state
      session.isInRestMessage = false;
    }

    await sendExercise(ctx, session);
  } else {
    await endSession(ctx, session);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendExercise(ctx: any, session: SessionData) {
  const exercise = exercises[session.exerciseIndex];

  // Construct the caption dynamically
  let caption = `${exercise.name}`;
  if (exercise.description) {
    caption += `\n\n${exercise.description}`;
  }
  caption += `\nReps: ${exercise.repsMin}-${exercise.repsMax}`;

  if (exercise.imgUrl) {
    // Use `replyWithPhoto` to send the local photo
    await ctx.replyWithPhoto(
      { source: `./photos/${exercise.imgUrl}` },
      {
        caption: caption,
        reply_markup: {
          inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]],
        },
      }
    );
  } else {
    // If no photo exists, send only the text message
    await ctx.reply(caption, {
      reply_markup: {
        inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]],
      },
    });
  }

  // Reset the rest message state if needed
  if (!exercise.hasRest) {
    session.isInRestMessage = false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRestPeriod(ctx: any, session: SessionData) {
  if (session.restTimer) {
    // If a rest timer is already running, ignore the "Next" button click
    await ctx.reply("Please wait until the rest period ends.");
    return;
  }

  // Send the "Rest" message
  await ctx.reply("Rest for 1.5 minutes before continuing...");

  // Start the rest period countdown
  session.restTimer = setTimeout(async () => {
    try {
      // Clear the rest timer
      clearTimeout(session.restTimer);
      delete session.restTimer;

      // Reset the rest message state
      session.isInRestMessage = false;

      // Proceed to the next exercise
      session.exerciseIndex++;
      if (session.exerciseIndex < exercises.length) {
        await sendExercise(ctx, session);
      } else {
        await endSession(ctx, session);
      }
    } catch (error) {
      console.error("Error during rest period:", error);
    }
  }, 90); // 90 seconds
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function endSession(ctx: any, session: SessionData) {
    const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2) // Time in minutes

    await ctx.reply(`Training session completed!\n\nTotal time: ${elapsedTime} seconds`, {
        reply_markup: { remove_keyboard: true }
    })

    delete userSessions[ctx.from?.id?.toString() || ""]
}

// Start the bot
bot.start()
console.log("Bot started!")
