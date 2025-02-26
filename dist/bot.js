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
const exercises_1 = require("./src/exercises");
require("dotenv").config();
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
const userSessions = {};
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now(),
            isInRestMessage: false
        };
    }
    yield ctx.reply("Welcome! Press 'Start Session' to begin.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    });
}));
bot.command("reset", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    delete userSessions[((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || ""];
    yield ctx.reply("See you next time!");
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
    session.isInRestMessage = false;
    yield sendExercise(ctx, session);
}));
bot.callbackQuery("next_exercise", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    const currentExercise = exercises_1.exercises[session.exerciseIndex];
    if (currentExercise.hasRest && session.isInRestMessage) {
        yield handleRestPeriod(ctx, session);
        return;
    }
    session.exerciseIndex++;
    if (session.exerciseIndex < exercises_1.exercises.length) {
        const nextExercise = exercises_1.exercises[session.exerciseIndex];
        if (nextExercise.hasRest) {
            session.isInRestMessage = true;
        }
        else {
            session.isInRestMessage = false;
        }
        yield sendExercise(ctx, session);
    }
    else {
        yield endSession(ctx, session);
    }
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendExercise(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const exercise = exercises_1.exercises[session.exerciseIndex];
        let caption = `${exercise.name}`;
        if (exercise.description) {
            caption += `\n\n${exercise.description}`;
        }
        caption += `\nReps: ${exercise.repsMin}-${exercise.repsMax}`;
        if (exercise.videoUrl) {
            caption += `\n${exercise.videoUrl}`;
        }
        if (exercise.imgUrl) {
            yield ctx.replyWithPhoto({ source: `./photos/${exercise.imgUrl}` }, {
                caption: caption,
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            });
        }
        else {
            yield ctx.reply(caption, {
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            });
        }
        if (!exercise.hasRest) {
            session.isInRestMessage = false;
        }
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleRestPeriod(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        if (session.restTimer) {
            yield ctx.reply("Please wait until the rest period ends.");
            return;
        }
        yield ctx.reply("Rest for 1.5 minutes before continuing...");
        session.restTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            try {
                clearTimeout(session.restTimer);
                delete session.restTimer;
                session.isInRestMessage = false;
                session.exerciseIndex++;
                if (session.exerciseIndex < exercises_1.exercises.length) {
                    yield sendExercise(ctx, session);
                }
                else {
                    yield endSession(ctx, session);
                }
            }
            catch (error) {
                console.error("Error during rest period:", error);
            }
        }), 1000 * 9); // TODO 90 seconds
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function endSession(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2); // mins
        yield ctx.reply(`Training session completed!\n\nTotal time: ${elapsedTime} seconds`, {
            reply_markup: { remove_keyboard: true }
        });
        delete userSessions[((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || ""];
    });
}
// Start the bot
bot.start();
console.log("Bot started!");
