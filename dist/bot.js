"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const grammy_1 = require("grammy");
const exercises_1 = require("./src/exercises");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
const userSessions = {};
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    if (!userSessions[userId]) {
        userSessions[userId] = {
            exerciseIndex: 0,
            startTime: Date.now()
        };
    }
    yield ctx.reply("Welcome to the Training Program! Press 'Start Session' to begin.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    });
}));
bot.command("reset", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    if (userSessions[userId])
        delete userSessions[((_d = (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString()) || ""];
    yield ctx.reply("See you next time!", {
        reply_markup: {
            inline_keyboard: [[{ text: "Start Session", callback_data: "start_session" }]]
        }
    });
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
    yield sendExercise(ctx, session);
}));
bot.callbackQuery("next_exercise", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || "";
    const session = userSessions[userId];
    if (!session)
        return;
    session.exerciseIndex++;
    if (session.exerciseIndex < exercises_1.exercises.length) {
        const currentExercise = exercises_1.exercises[session.exerciseIndex];
        if (currentExercise.hasRest && session.restTimer) {
            // If a rest timer is already running, do nothing
            yield ctx.reply("Please wait until the rest period ends.");
            return;
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
        // Construct the caption dynamically
        let caption = `${exercise.name}`;
        if (exercise.description) {
            caption += `\n\n${exercise.description}`;
        }
        caption += `\nReps: ${exercise.repsMin}-${exercise.repsMax}`;
        if (exercise.imgUrl) {
            // Use `replyWithPhoto` to send the local photo
            yield ctx.replyWithPhoto({ source: `./photos/${exercise.imgUrl}` }, {
                caption: caption,
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            });
        }
        else {
            // If no photo exists, send only the text message
            yield ctx.reply(`${exercise.name}\n\n${exercise.description || ""}\nReps: ${exercise.repsMin}-${exercise.repsMax}`, {
                reply_markup: {
                    inline_keyboard: [[{ text: "Next", callback_data: "next_exercise" }]]
                }
            });
        }
        if (exercise.hasRest) {
            yield handleRestPeriod(ctx, session);
        }
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleRestPeriod(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        if (session.restTimer) {
            // If a rest timer is already running, ignore the "Next" button click
            return;
        }
        // Start the rest period countdown
        session.restTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            try {
                // Send the "Rest" message
                yield ctx.reply("Rest for 1.5 minutes before continuing...");
                // Wait for 1.5 minutes
                yield new Promise((resolve) => setTimeout(resolve, 90000)); // 90 seconds
                // Clear the rest timer
                clearTimeout(session.restTimer);
                delete session.restTimer;
                // Proceed to the next exercise
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
        }), 0); // Start the timer immediately
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function endSession(ctx, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const elapsedTime = ((Date.now() - session.startTime) / 1000 / 60).toFixed(2); // Time in minutes
        yield ctx.reply(`Training session completed!\n\nTotal time: ${elapsedTime} seconds`, {
            reply_markup: { remove_keyboard: true }
        });
        delete userSessions[((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || ""];
    });
}
// Start the bot
bot.start();
console.log("Bot started!");
