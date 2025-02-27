/* eslint-disable @typescript-eslint/no-require-imports */
import { Bot, Context } from "grammy"
import { exercises, extra_cali, extra_glute } from "./src/exercises" // Main exercise list

import { Exercises } from "./src/types"
require("dotenv").config()

const bot = new Bot(process.env.BOT_TOKEN!)

interface SessionData {
    exerciseIndex: number
    startTime: number
    lastActivityTime: number // Track last user interaction
    restTimer?: NodeJS.Timeout // Timer for rest periods
    messageIds: number[] // Track message IDs sent during the session
    extraExercises?: Exercises // Store additional exercises if chosen
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
            messageIds: []
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
    const msg = await ctx.replyWithAnimation(
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajYxcWw0d29ramhzYXQ3aG5yYWJqengxcDA2dTEzdGg2aHpzdzUyMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zDpYQooxkwXkAWMxRK/giphy.gif?0",
        { caption: "See you next time!" }
    )
    trackMessage(userId, msg.message_id)
    const session = userSessions[userId]
    await deleteTrackedMessages(ctx, session, msg.message_id)
    delete userSessions[userId]
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
    session.extraExercises = undefined

    await sendExercise(ctx, session)
})

// Handle "Next Exercise" button
bot.callbackQuery("next_exercise", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    session.lastActivityTime = Date.now()
    session.exerciseIndex++

    // Check if there are additional exercises
    const currentExerciseList = session.extraExercises ?? exercises

    if (session.exerciseIndex < currentExerciseList.length) {
        await sendExercise(ctx, session)
    } else {
        await askForMoreExercises(ctx, session)
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

    const msg = await ctx.reply("<i>Rest and Chill 🧘‍♀️</i>", { parse_mode: "HTML" })
    trackMessage(userId, msg.message_id)

    session.restTimer = setTimeout(async () => {
        try {
            clearTimeout(session.restTimer)
            delete session.restTimer

            const backToWorkMsg = await ctx.reply("<b>💪 BACK TO WERK 💪</b>", { parse_mode: "HTML" })
            trackMessage(userId, backToWorkMsg.message_id)

            /* session.exerciseIndex++
            const currentExerciseList = session.extraExercises ?? exercises

            if (session.exerciseIndex < currentExerciseList.length) {
                await sendExercise(ctx, session)
            } else {
                await askForMoreExercises(ctx, session)
            } */
        } catch (error) {
            console.error("Error during rest period:", error)
        }
    }, 1000 * 90) // 1.5 minutes = 90 seconds
})

// Function to send an exercise
async function sendExercise(ctx: Context, session: SessionData) {
    const exerciseList = session.extraExercises ?? exercises
    const exercise = exerciseList[session.exerciseIndex]
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
    if (exercise.animationUrl) {
        const photoMsg = await ctx.replyWithAnimation(exercise.animationUrl, {
            caption,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard }
        })
        trackMessage(userId, photoMsg.message_id)
    } else if (exercise.imgUrl) {
        const photoMsg = await ctx.api.sendPhoto(userId, exercise.imgUrl, {
            caption,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard }
        })
        trackMessage(userId, photoMsg.message_id)
    } else {
        const textMsg = await ctx.reply(caption, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard }
        })
        trackMessage(userId, textMsg.message_id)
    }
}

// Ask user if they want more exercises
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function askForMoreExercises(ctx: Context, _session: SessionData) {
    const msg = await ctx.replyWithAnimation(
        "https://media.giphy.com/media/D3OdaKTGlpTBC/giphy.gif?cid=790b7611cdcm0s80o7a2ayqizsbehxrx3c9bnormv89plrmb&ep=v1_gifs_search&rid=giphy.gif&ct=g",
        {
            caption: "Great job! Do you want more exercises?",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Glute Destroyer 🔥", callback_data: "glute_destroyer" }],
                    [{ text: "More Calisthenics 🏋️‍♂️", callback_data: "calisthenics" }],
                    [{ text: "Mix 🎲", callback_data: "mix" }],
                    [{ text: "Skip 🚪", callback_data: "skip" }]
                ]
            }
        }
    )
    trackMessage(ctx.from?.id?.toString() || "", msg.message_id)
}

// Handle "Glute Destroyer" choice
bot.callbackQuery("glute_destroyer", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    session.extraExercises = getRandomExercises(extra_glute, 3)
    session.exerciseIndex = 0

    await sendExercise(ctx, session)
})

// Handle "Calisthenics" choice
bot.callbackQuery("calisthenics", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    session.extraExercises = getRandomExercises(extra_cali, 3)
    session.exerciseIndex = 0

    await sendExercise(ctx, session)
})

// Handle "Mix" choice
bot.callbackQuery("mix", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    const mixedExercises = [...getRandomExercises(extra_glute, 2), ...getRandomExercises(extra_cali, 2)]
    session.extraExercises = shuffleArray(mixedExercises)
    session.exerciseIndex = 0

    await sendExercise(ctx, session)
})

// Handle "Skip" choice
bot.callbackQuery("skip", async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || ""
    const session = userSessions[userId]
    if (!session) return

    await endSession(ctx, session)
})

// Function to get random exercises
function getRandomExercises(exercises: Exercises, count: number): Exercises {
    return shuffleArray(exercises).slice(0, count)
}

// Function to shuffle an array
function shuffleArray(array: Exercises) {
    return array.sort(() => Math.random() - 0.5)
}

// Function to end the session
async function endSession(ctx: Context, session: SessionData) {
    const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2)
    const exerciseList = session.extraExercises ?? exercises
    // Send the session-end message
    const endMsg = await ctx.replyWithAnimation(
        "https://media.giphy.com/media/yYjG2XfoY36L9Sauri/giphy.gif?cid=ecf05e47tibcqfm6ka7gyzncdbm3csks5yy723pk2z0amkzv&ep=v1_gifs_search&rid=giphy.gif&ct=g",
        {
            caption: `<b>Training session completed!</b>\n\nTotal time: <i>${elapsedTime} minutes</i>\n\nTotal exercises done: <i>${exerciseList.length}</i>`,
            parse_mode: "HTML",
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
    session.messageIds = []
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
                delete userSessions[userId]
            }
        }
    },
    60 * 1000 * 10
)

// Start the bot
bot.start()
console.log("Bot started!")
