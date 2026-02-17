import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

// Add an exercise (with optional sets) to an existing workout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Verify workout belongs to user
    const workout = await sql`
      SELECT id FROM workouts WHERE id = ${id} AND user_id = ${USER_ID}
    `
    if (workout.length === 0) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    const body = await request.json()
    const { exercise_name, muscle_group, sets } = body

    if (!exercise_name) {
      return NextResponse.json({ error: "exercise_name is required" }, { status: 400 })
    }

    const setsCount = Array.isArray(sets) ? sets.length : 0

    // Create the exercise
    const result = await sql`
      INSERT INTO exercises (workout_id, exercise_name, muscle_group, target_sets, sets_completed)
      VALUES (${id}, ${exercise_name}, ${muscle_group || null}, ${setsCount || 3}, ${setsCount})
      RETURNING id, exercise_name, muscle_group, target_sets, sets_completed, weight_kg, notes
    `
    const exerciseId = result[0].id

    // Insert sets if provided
    if (setsCount > 0) {
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        await sql`
          INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe)
          VALUES (${exerciseId}, ${i + 1}, ${set.reps}, ${set.weight_kg}, ${set.rpe ?? null})
        `
      }

      // Recalculate total volume for the workout
      const volumeResult = await sql`
        SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) as total_volume
        FROM exercise_sets es
        JOIN exercises e ON es.exercise_id = e.id
        WHERE e.workout_id = ${id}
      `
      await sql`
        UPDATE workouts SET total_volume = ${volumeResult[0].total_volume} WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true, exercise: result[0] })
  } catch (error) {
    console.error("Error adding exercise:", error)
    return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 })
  }
}
