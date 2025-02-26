import { Bot } from "grammy"
import { exercises } from "./src/exercises"
import * as dotenv from "dotenv"

dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN!)

interface SessionData {
    exerciseIndex: number
    startTime: number
    restTimer?: NodeJS.Timeout
    isInRestMessage: boolean
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

    await ctx.reply("Welcome! Press 'Start Session' to begin.", {
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
    session.isInRestMessage = false

    await sendExercise(ctx, session)
})

bot.callbackQuery("next_exercise", async (ctx) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]

    if (!session) return

    const currentExercise = exercises[session.exerciseIndex]

    if (currentExercise.hasRest && session.isInRestMessage) {
        await handleRestPeriod(ctx, session)
        return
    }

    session.exerciseIndex++

    if (session.exerciseIndex < exercises.length) {
        const nextExercise = exercises[session.exerciseIndex]

        if (nextExercise.hasRest) {
            session.isInRestMessage = true
        } else {
            session.isInRestMessage = false
        }

        await sendExercise(ctx, session)
    } else {
        await endSession(ctx, session)
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendExercise(ctx: any, session: SessionData) {
    const exercise = exercises[session.exerciseIndex]


    let caption = `${exercise.name}`
    if (exercise.description) {
        caption += `\n\n${exercise.description}`
    }
    caption += `\nReps: ${exercise.repsMin}-${exercise.repsMax}`

    if (exercise.imgUrl) {
        await ctx.replyWithPhoto(
            { source: `./photos/${exercise.imgUrl}` },
            {
                caption: caption,
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            }
        )
    } else {
        await ctx.reply(caption, {
            reply_markup: {
                inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
            }
        })
    }

    if (!exercise.hasRest) {
        session.isInRestMessage = false
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRestPeriod(ctx: any, session: SessionData) {
    if (session.restTimer) {
        await ctx.reply("Please wait until the rest period ends.")
        return
    }

    await ctx.reply("Rest for 1.5 minutes before continuing...")

    session.restTimer = setTimeout(async () => {
        try {
            clearTimeout(session.restTimer)
            delete session.restTimer


            session.isInRestMessage = false

            session.exerciseIndex++
            if (session.exerciseIndex < exercises.length) {
                await sendExercise(ctx, session)
            } else {
                await endSession(ctx, session)
            }
        } catch (error) {
            console.error("Error during rest period:", error)
        }
    }, 90) // TODO 90 seconds 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function endSession(ctx: any, session: SessionData) {
    const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2) // mins

    await ctx.reply(`Training session completed!\n\nTotal time: ${elapsedTime} seconds`, {
        reply_markup: { remove_keyboard: true }
    })

    delete userSessions[ctx.from?.id?.toString() || ""]
}

// Start the bot
bot.start()
console.log("Bot started!")
