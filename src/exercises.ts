import { Exercises } from "./types"

export const exercises: Exercises = [
    {
        name: "Yuri's Shoulder Band Warmup",
        description: "Start with a gentle stretch to prepare your shoulders.",
        videoUrl: "https://www.youtube.com/watch?v=Vwn5hSf3WEg&ab_channel=YuriMarmerstein",
        imgUrl: "https://ibb.co/9kbMfrPm?random=64",
        repsMin: 5,
        repsMax: 10,
        hasRest: false
    },
    {
        name: "Squat Sky Reaches",
        imgUrl: "https://ibb.co/G41cgCBx?random=64",
        repsMin: 5,
        repsMax: 10,
        hasRest: false
    },
    {
        name: "Hips Mobility",
        imgUrl: "https://ibb.co/Mxbqgc8W?random=64",
        repsMin: 10,
        repsMax: 30,
        hasRest: false
    },
    {
        name: "Dead Bugs",
        videoUrl: "http://www.nick-e.com/deadbug/",
        imgUrl: "https://ibb.co/nMJ4tLvt?random=64",
        repsMin: 10,
        repsMax: 30,
        hasRest: false
    },
    {
        name: "SUPERSET: Pull-ups + Squats",
        description: "Pull-up with THUMB OVER BAR  /  Squat leaning over knees",
        hasRest: true,
        repsMin: 5,
        repsMax: 8
    },
    {
        name: "SUPERSET: Dips + Romanian Deadlift",
        hasRest: true,
        repsMin: 5,
        repsMax: 8
    },
    {
        name: "SUPERSET: Rows + Push-ups",
        hasRest: true,
        repsMin: 5,
        repsMax: 8
    },
    {
        name: "Anti-Extension",
        description: "Plank / Langing Leg Raises (video)",
        videoUrl: "https://www.youtube.com/watch?v=Gw3RyyARhBQ&ab_channel=TomConner",
        hasRest: true,
        repsMin: 8,
        repsMax: 12
    },
    {
        name: "Anti-Rotation",
        description:
            "Pallof press using a band as resistance. You can also use a pulley cable, just try to set it so that the cable is roughly at your umbilical height.",
        videoUrl: "https://www.youtube.com/watch?v=AH_QZLm_0-s&ab_channel=BreathingtoHeal",
        hasRest: true,
        repsMin: 8,
        repsMax: 12
    },
    {
        name: "Extension",
        description: "Reverse Hyperextension / Arch Raises",
        videoUrl: "https://www.youtube.com/watch?v=ZeRsNzFcQLQ&l",
        hasRest: true,
        repsMin: 8,
        repsMax: 12
    }
]
