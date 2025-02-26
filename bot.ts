import { Bot } from "grammy"
import { exercises } from "./src/exercises"
import * as dotenv from "dotenv"

dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN!)

interface SessionData {
    exerciseIndex: number
    startTime: number
    restTimer?: NodeJS.Timeout // Timer for rest periods
    restMessageId?: number // ID of the rest message
    lastMessageId?: number // ID of the last sent message
}

const userSessions: Record<string, SessionData> = {}

bot.command("start", async (ctx) => {
    const userId = ctx.from?.id?.toString() || ""

    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now()
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
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]

    if (!session) return

    session.exerciseIndex = 0
    session.startTime = Date.now()

    await sendExercise(ctx, session)
})

bot.callbackQuery("next_exercise", async (ctx) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]

    if (!session) return

    // Move to the next exercise
    session.exerciseIndex++

    if (session.exerciseIndex < exercises.length) {
        const currentExercise = exercises[session.exerciseIndex]

        if (currentExercise.hasRest) {
            // If the exercise has a rest period, send the exercise details first
            await sendExercise(ctx, session)

            // Then prepare for the rest period
            session.restTimer = setTimeout(async () => {
                try {
                    // Send the rest message
                    const restMessage = await ctx.reply("Rest for 1.5 minutes before continuing...")
                    session.restMessageId = restMessage.message_id

                    // Wait for 1.5 minutes
                    await new Promise((resolve) => setTimeout(resolve, 90000)) // 90 seconds

                    // Clear the rest timer
                    clearTimeout(session.restTimer)
                    delete session.restTimer

                    // Proceed to the next exercise
                    session.exerciseIndex++
                    if (session.exerciseIndex < exercises.length) {
                        await sendExercise(ctx, session)
                    } else {
                        await endSession(ctx, session)
                    }
                } catch (error) {
                    console.error("Error during rest period:", error)
                }
            }, 0) // Start the timer immediately
        } else {
            // If the exercise does not have a rest period, send it directly
            await sendExercise(ctx, session)
        }
    } else {
        // End the session if all exercises are completed
        await endSession(ctx, session)
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendExercise(ctx: any, session: SessionData) {
    const exercise = exercises[session.exerciseIndex]

    // Construct the caption dynamically
    let caption = `${exercise.name}`
    if (exercise.description) {
        caption += `\n\n${exercise.description}`
    }
    caption += `\nReps: ${exercise.repsMin}-${exercise.repsMax}`

    let messageId: number

    if (exercise.imgUrl) {
        // Use `replyWithPhoto` to send the local photo
        const response = await ctx.replyWithPhoto(
            { source: `./photos/${exercise.imgUrl}` },
            {
                caption: caption,
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            }
        )
        messageId = response.message_id
    } else {
        // If no photo exists, send only the text message
        const response = await ctx.reply(caption, {
            reply_markup: {
                inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
            }
        })
        messageId = response.message_id
    }

    // Store the last message ID
    session.lastMessageId = messageId
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function endSession(ctx: any, session: SessionData) {
    const elapsedTime = ((Date.now() - session.startTime) / 1000).toFixed(2) // Time in seconds

    // Delete the last message
    if (session.lastMessageId) {
        try {
            await ctx.deleteMessage(session.lastMessageId)
        } catch (error) {
            console.error("Error deleting previous message:", error)
        }
    }

    // Send the session completion message
    await ctx.reply(`Training session completed!\n\nTotal time: ${elapsedTime} seconds`, {
        reply_markup: { remove_keyboard: true }
    })

    // Clean up session data
    delete userSessions[ctx.from?.id?.toString() || ""]
}
