/* eslint-disable @typescript-eslint/no-require-imports */
import { Bot, Context } from "grammy"
import { exercises } from "./src/exercises" // Ensure this file contains your exercise data
require("dotenv").config()

const bot = new Bot(process.env.BOT_TOKEN!)

interface SessionData {
    exerciseIndex: number
    startTime: number
    lastActivityTime: number // Track last user interaction
    restTimer?: NodeJS.Timeout // Timer for rest periods
    messageIds: number[] // Track message IDs sent during the session
}

const userSessions: Record<string, SessionData> = {}

// Handle /start command
bot.command("start", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now(),
            lastActivityTime: Date.now(),
            messageIds: [] // Initialize message IDs array
        }
    }
    const msg = await ctx.replyWithAnimation("https://media.giphy.com/media/oEtmNMz4AoZPu9SPvS/giphy.gif", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    })
    trackMessage(userId, msg.message_id)
})

// Handle /reset command
bot.command("reset", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    delete userSessions[userId]
    const msg = await ctx.replyWithAnimation(
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajYxcWw0d29ramhzYXQ3aG5yYWJqengxcDA2dTEzdGg2aHpzdzUyMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zDpYQooxkwXkAWMxRK/giphy.gif?0",
        { caption: "See you next time!" }
    )
    trackMessage(userId, msg.message_id)
})

// Handle "Start Session" button
bot.callbackQuery("start_session", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    session.exerciseIndex = 0
    session.startTime = Date.now()
    session.lastActivityTime = Date.now()
    session.messageIds = [] 

    await sendExercise(ctx, session)
})

// Handle "Next Exercise" button
bot.callbackQuery("next_exercise", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    session.lastActivityTime = Date.now()
    session.exerciseIndex++
    if (session.exerciseIndex < exercises.length) {
        await sendExercise(ctx, session)
    } else {
        await endSession(ctx, session)
    }
})

// Handle "Start Rest" button
bot.callbackQuery("start_rest", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    if (session.restTimer) {
        await ctx.reply("A rest period is already in progress.")
        return
    }

    const msg = await ctx.reply("<i>Rest and Chill 🧘‍♀️</i>", {parse_mode: 'HTML'})
    trackMessage(userId, msg.message_id)

    session.restTimer = setTimeout(async () => {
        try {
            clearTimeout(session.restTimer)
            delete session.restTimer

            const backToWorkMsg = await ctx.reply("<b>💪 BACK TO WERK 💪</b>", {parse_mode: 'HTML'})
            trackMessage(userId, backToWorkMsg.message_id)

            /* session.exerciseIndex++
            if (session.exerciseIndex < exercises.length) {
                await sendExercise(ctx, session)
            } else {
                await endSession(ctx, session)
            } */
        } catch (error) {
            console.error("Error during rest period:", error)
        }
    }, 1000 * 90) // 1.5 minutes = 90 seconds
})

// Function to send an exercise
async function sendExercise(ctx: Context, session: SessionData) {
    const exercise = exercises[session.exerciseIndex]
    const userId = ctx.from?.id?.toString() || ""

    session.lastActivityTime = Date.now()

    let caption = `<b>${exercise.name}</b>`
    if (exercise.description) {
        caption += `\n\n${exercise.description}`
    }
    caption += `\n<b>Reps</b>: ${exercise.repsMin}-${exercise.repsMax}`
    if (exercise.videoUrl) {
        caption += `\n<b><a href="${exercise.videoUrl}">Video Tutorial</a></b>`
    }

    const inlineKeyboard = exercise.hasRest
        ? [
              [
                  { text: "Next 🏋️‍♂️", callback_data: "next_exercise" },
                  { text: "Rest 🧘‍♀️", callback_data: "start_rest" }
              ]
          ]
        : [[{ text: "Next 🏋️‍♂️", callback_data: "next_exercise" }]]

    if (exercise.imgUrl) {
        const photoMsg = await ctx.api.sendPhoto(userId, exercise.imgUrl, {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineKeyboard }
        })
        trackMessage(userId, photoMsg.message_id)
    } else {
        const textMsg = await ctx.reply(caption, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineKeyboard }
        })
        trackMessage(userId, textMsg.message_id)
    }
}

// Function to end the session
async function endSession(ctx: Context, session: SessionData) {
    const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2)

    // Send the session-end message
    const endMsg = await ctx.replyWithAnimation(
        "https://media.giphy.com/media/yYjG2XfoY36L9Sauri/giphy.gif?cid=ecf05e47tibcqfm6ka7gyzncdbm3csks5yy723pk2z0amkzv&ep=v1_gifs_search&rid=giphy.gif&ct=g",
        {
            caption: `<b>Training session completed!</b>\n\nTotal time: <i>${elapsedTime} minutes</i>`,
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
        }
    )

    // Delete all tracked messages except the session-end message
    await deleteTrackedMessages(ctx, session, endMsg.message_id)

    delete userSessions[ctx.from?.id?.toString() || ""]
}

// Function to track message IDs
function trackMessage(userId: string, messageId: number) {
    if (userSessions[userId]) {
        userSessions[userId].messageIds.push(messageId)
    }
}

// Function to delete tracked messages
async function deleteTrackedMessages(ctx: Context, session: SessionData, excludeId: number) {
    for (const messageId of session.messageIds) {
        if (messageId !== excludeId) {
            try {
                await ctx.api.deleteMessage(ctx.chat!.id, messageId)
            } catch (error) {
                console.error(`Failed to delete message ${messageId}:`, error)
            }
        }
    }
    session.messageIds = [] // Clear the message IDs array
}

// Check for inactive sessions every minute
setInterval(
    async () => {
        const now = Date.now()
        const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours
        for (const userId in userSessions) {
            const session = userSessions[userId]
            if (now - session.lastActivityTime > INACTIVITY_TIMEOUT) {
                try {
                    await bot.api.sendMessage(userId, "⚠️ Your training session has ended due to inactivity.")
                } catch (error) {
                    console.error("Failed to send session end message:", error)
                }
                if (session.restTimer) {
                    clearTimeout(session.restTimer)
                    delete session.restTimer
                }
                //await deleteTrackedMessages(ctx, session, null) // Delete all messages
                delete userSessions[userId]
            }
        }
    },
    60 * 1000 * 10
) // Check every 10 minutes

// Start the bot
bot.start()
console.log("Bot started!")
