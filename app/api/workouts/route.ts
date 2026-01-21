import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date")
  const limit = parseInt(searchParams.get("limit") || "10")

  try {
    let workouts

    if (date) {
      workouts = await sql`
        SELECT
          w.id,
          w.date,
          w.workout_type,
          w.title,
          w.duration_minutes,
          w.notes,
          w.started_at,
          w.completed_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', e.id,
                'exercise_name', e.exercise_name,
                'muscle_group', e.muscle_group,
                'sets_completed', e.sets_completed,
                'target_sets', e.target_sets,
                'weight_kg', e.weight_kg
              )
            ) FILTER (WHERE e.id IS NOT NULL),
            '[]'
          ) as exercises
        FROM workouts w
        LEFT JOIN exercises e ON w.id = e.workout_id
        WHERE w.user_id = ${USER_ID} AND w.date = ${date}
        GROUP BY w.id
        ORDER BY w.started_at DESC
      `
    } else {
      workouts = await sql`
        SELECT
          w.id,
          w.date,
          w.workout_type,
          w.title,
          w.duration_minutes,
          w.total_volume,
          w.notes,
          w.completed_at,
          COUNT(e.id)::int as exercise_count
        FROM workouts w
        LEFT JOIN exercises e ON w.id = e.workout_id
        WHERE w.user_id = ${USER_ID}
        GROUP BY w.id
        ORDER BY w.date DESC, w.started_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exercises, date, duration_minutes } = body
    // Convert undefined to null for postgres.js
    const workout_type = body.workout_type ?? "strength"
    const title = body.title ?? "Workout"
    const notes = body.notes ?? null

    const workoutDate = date || formatDate(new Date())

    // Calculate total volume from exercises
    let totalVolume = 0
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        if (ex.sets && ex.sets.length > 0) {
          for (const set of ex.sets) {
            totalVolume += (set.weight_kg || 0) * (set.reps || 0)
          }
        }
      }
    }

    // Create workout with completed timestamp and duration
    const workout = await sql`
      INSERT INTO workouts (user_id, date, workout_type, title, notes, duration_minutes, total_volume, started_at, completed_at)
      VALUES (${USER_ID}, ${workoutDate}, ${workout_type}, ${title}, ${notes}, ${duration_minutes || null}, ${totalVolume || null}, NOW(), NOW())
      RETURNING id
    `

    const workoutId = workout[0].id

    // Add exercises if provided
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        const setsCompleted = ex.sets ? ex.sets.length : 0

        const exercise = await sql`
          INSERT INTO exercises (
            workout_id, exercise_name, muscle_group, target_sets, sets_completed
          )
          VALUES (
            ${workoutId}, ${ex.exercise_name}, ${ex.muscle_group || null}, ${ex.target_sets || 3}, ${setsCompleted}
          )
          RETURNING id
        `

        // Add sets if provided
        if (ex.sets && ex.sets.length > 0) {
          const exerciseId = exercise[0].id
          for (let i = 0; i < ex.sets.length; i++) {
            const set = ex.sets[i]
            await sql`
              INSERT INTO exercise_sets (
                exercise_id, set_number, reps, weight_kg, rest_seconds, rpe
              )
              VALUES (
                ${exerciseId}, ${i + 1}, ${set.reps}, ${set.weight_kg},
                ${set.rest_seconds || null}, ${set.rpe || null}
              )
            `
          }
        }
      }
    }

    return NextResponse.json({ success: true, workout_id: workoutId })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Failed to create workout" },
      { status: 500 }
    )
  }
}
