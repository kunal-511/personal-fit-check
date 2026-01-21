import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Get workout with exercises and sets
    const workouts = await sql`
      SELECT
        w.id,
        w.date,
        w.workout_type,
        w.title,
        w.duration_minutes,
        w.total_volume,
        w.notes,
        w.started_at,
        w.completed_at
      FROM workouts w
      WHERE w.user_id = ${USER_ID} AND w.id = ${id}
    `

    if (workouts.length === 0) {
      return NextResponse.json({ workout: null })
    }

    const workout = workouts[0]

    // Get exercises for this workout
    const exercises = await sql`
      SELECT
        e.id,
        e.exercise_name,
        e.muscle_group,
        e.sets_completed,
        e.target_sets,
        e.weight_kg,
        e.notes
      FROM exercises e
      WHERE e.workout_id = ${id}
      ORDER BY e.id
    `

    // Get sets for each exercise
    const exercisesWithSets = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await sql`
          SELECT
            set_number,
            reps,
            weight_kg,
            rest_seconds,
            rpe
          FROM exercise_sets
          WHERE exercise_id = ${exercise.id}
          ORDER BY set_number
        `
        return {
          ...exercise,
          sets,
        }
      })
    )

    return NextResponse.json({
      workout: {
        ...workout,
        exercises: exercisesWithSets,
      },
    })
  } catch (error) {
    console.error("Error fetching workout:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout" },
      { status: 500 }
    )
  }
}
