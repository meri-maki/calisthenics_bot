export interface Exercise {
    name: string
    description?: string
    videoUrl?: string
    animationUrl?: string
    imgUrl?: string
    repsMin: number
    repsMax: number
    hasRest: boolean
}

export type Exercises = Exercise[]
