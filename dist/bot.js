"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-require-imports */
const grammy_1 = require("grammy");
const exercises_1 = require("./src/exercises"); // Main exercise list
require("dotenv").config();
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
const userSessions = {};
// Handle /start command
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now(),
            lastActivityTime: Date.now(),
            messageIds: []
        };
    }
    const msg = yield ctx.replyWithAnimation("https://media.giphy.com/media/oEtmNMz4AoZPu9SPvS/giphy.gif", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    });
    trackMessage(userId, msg.message_id);
}));
// Handle /reset command
bot.command("reset", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    delete userSessions[userId];
    const msg = yield ctx.replyWithAnimation("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajYxcWw0d29ramhzYXQ3aG5yYWJqengxcDA2dTEzdGg2aHpzdzUyMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zDpYQooxkwXkAWMxRK/giphy.gif?0", { caption: "See you next time!" });
    trackMessage(userId, msg.message_id);
}));
// Handle "Start Session" button
bot.callbackQuery("start_session", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    session.exerciseIndex = 0;
    session.startTime = Date.now();
    session.lastActivityTime = Date.now();
    session.messageIds = [];
    session.extraExercises = undefined;
    yield sendExercise(ctx, session);
}));
// Handle "Next Exercise" button
bot.callbackQuery("next_exercise", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    session.lastActivityTime = Date.now();
    session.exerciseIndex++;
    // Check if there are additional exercises
    const currentExerciseList = (_c = session.extraExercises) !== null && _c !== void 0 ? _c : exercises_1.exercises;
    if (session.exerciseIndex < currentExerciseList.length) {
        yield sendExercise(ctx, session);
    }
    else {
        yield askForMoreExercises(ctx, session);
    }
}));
// Handle "Start Rest" button
bot.callbackQuery("start_rest", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    if (session.restTimer) {
        yield ctx.reply("A rest period is already in progress.");
        return;
    }
    const msg = yield ctx.reply("<i>Rest and Chill 🧘‍♀️</i>", { parse_mode: "HTML" });
    trackMessage(userId, msg.message_id);
    session.restTimer = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            clearTimeout(session.restTimer);
            delete session.restTimer;
            const backToWorkMsg = yield ctx.reply("<b>💪 BACK TO WERK 💪</b>", { parse_mode: "HTML" });
            trackMessage(userId, backToWorkMsg.message_id);
            /* session.exerciseIndex++
            const currentExerciseList = session.extraExercises ?? exercises

            if (session.exerciseIndex < currentExerciseList.length) {
                await sendExercise(ctx, session)
            } else {
                await askForMoreExercises(ctx, session)
            } */
        }
        catch (error) {
            console.error("Error during rest period:", error);
        }
    }), 1000 * 90); // 1.5 minutes = 90 seconds
}));
// Function to send an exercise
function sendExercise(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const exerciseList = (_a = session.extraExercises) !== null && _a !== void 0 ? _a : exercises_1.exercises;
        const exercise = exerciseList[session.exerciseIndex];
        const userId = ((_c = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.toString()) || "";
        session.lastActivityTime = Date.now();
        let caption = `<b>${exercise.name}</b>`;
        if (exercise.description) {
            caption += `\n\n${exercise.description}`;
        }
        caption += `\n<b>Reps</b>: ${exercise.repsMin}-${exercise.repsMax}`;
        if (exercise.videoUrl) {
            caption += `\n<b><a href="${exercise.videoUrl}">Video Tutorial</a></b>`;
        }
        const inlineKeyboard = exercise.hasRest
            ? [
                [
                    { text: "Next 🏋️‍♂️", callback_data: "next_exercise" },
                    { text: "Rest 🧘‍♀️", callback_data: "start_rest" }
                ]
            ]
            : [[{ text: "Next 🏋️‍♂️", callback_data: "next_exercise" }]];
        if (exercise.animationUrl) {
            const photoMsg = yield ctx.replyWithAnimation(exercise.animationUrl, {
                caption,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
            trackMessage(userId, photoMsg.message_id);
        }
        else if (exercise.imgUrl) {
            const photoMsg = yield ctx.api.sendPhoto(userId, exercise.imgUrl, {
                caption,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
            trackMessage(userId, photoMsg.message_id);
        }
        else {
            const textMsg = yield ctx.reply(caption, {
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
            trackMessage(userId, textMsg.message_id);
        }
    });
}
// Ask user if they want more exercises
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function askForMoreExercises(ctx, _session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const msg = yield ctx.replyWithAnimation("https://media.giphy.com/media/D3OdaKTGlpTBC/giphy.gif?cid=790b7611cdcm0s80o7a2ayqizsbehxrx3c9bnormv89plrmb&ep=v1_gifs_search&rid=giphy.gif&ct=g", {
            caption: "Great job! Do you want more exercises?",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Glute Destroyer 🔥", callback_data: "glute_destroyer" }],
                    [{ text: "More Calisthenics 🏋️‍♂️", callback_data: "calisthenics" }],
                    [{ text: "Mix 🎲", callback_data: "mix" }],
                    [{ text: "Skip 🚪", callback_data: "skip" }]
                ]
            }
        });
        trackMessage(((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "", msg.message_id);
    });
}
// Handle "Glute Destroyer" choice
bot.callbackQuery("glute_destroyer", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    session.extraExercises = getRandomExercises(exercises_1.extra_glute, 3);
    session.exerciseIndex = 0;
    yield sendExercise(ctx, session);
}));
// Handle "Calisthenics" choice
bot.callbackQuery("calisthenics", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    session.extraExercises = getRandomExercises(exercises_1.extra_cali, 3);
    session.exerciseIndex = 0;
    yield sendExercise(ctx, session);
}));
// Handle "Mix" choice
bot.callbackQuery("mix", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    const mixedExercises = [...getRandomExercises(exercises_1.extra_glute, 2), ...getRandomExercises(exercises_1.extra_cali, 2)];
    session.extraExercises = shuffleArray(mixedExercises);
    session.exerciseIndex = 0;
    yield sendExercise(ctx, session);
}));
// Handle "Skip" choice
bot.callbackQuery("skip", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    yield endSession(ctx, session);
}));
// Function to get random exercises
function getRandomExercises(exercises, count) {
    return shuffleArray(exercises).slice(0, count);
}
// Function to shuffle an array
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
// Function to end the session
function endSession(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2);
        const exerciseList = (_a = session.extraExercises) !== null && _a !== void 0 ? _a : exercises_1.exercises;
        // Send the session-end message
        const endMsg = yield ctx.replyWithAnimation("https://media.giphy.com/media/yYjG2XfoY36L9Sauri/giphy.gif?cid=ecf05e47tibcqfm6ka7gyzncdbm3csks5yy723pk2z0amkzv&ep=v1_gifs_search&rid=giphy.gif&ct=g", {
            caption: `<b>Training session completed!</b>\n\nTotal time: <i>${elapsedTime} minutes</i>\n\nTotal exercises done: <i>${exerciseList.length}</i>`,
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true }
        });
        // Delete all tracked messages except the session-end message
        yield deleteTrackedMessages(ctx, session, endMsg.message_id);
        delete userSessions[((_c = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.toString()) || ""];
    });
}
// Function to track message IDs
function trackMessage(userId, messageId) {
    if (userSessions[userId]) {
        userSessions[userId].messageIds.push(messageId);
    }
}
// Function to delete tracked messages
function deleteTrackedMessages(ctx, session, excludeId) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const messageId of session.messageIds) {
            if (messageId !== excludeId) {
                try {
                    yield ctx.api.deleteMessage(ctx.chat.id, messageId);
                }
                catch (error) {
                    console.error(`Failed to delete message ${messageId}:`, error);
                }
            }
        }
        session.messageIds = [];
    });
}
// Check for inactive sessions every minute
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
    for (const userId in userSessions) {
        const session = userSessions[userId];
        if (now - session.lastActivityTime > INACTIVITY_TIMEOUT) {
            try {
                yield bot.api.sendMessage(userId, "⚠️ Your training session has ended due to inactivity.");
            }
            catch (error) {
                console.error("Failed to send session end message:", error);
            }
            if (session.restTimer) {
                clearTimeout(session.restTimer);
                delete session.restTimer;
            }
            delete userSessions[userId];
        }
    }
}), 60 * 1000 * 10);
// Start the bot
bot.start();
console.log("Bot started!");
