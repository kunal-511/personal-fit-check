import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

// Delete an exercise and all its sets from a workout
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const exerciseId = parseInt(id)

  if (isNaN(exerciseId)) {
    return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 })
  }

  try {
    // Verify this exercise belongs to a workout owned by the user
    const check = await sql`
      SELECT e.id, e.workout_id FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.id = ${exerciseId} AND w.user_id = ${USER_ID}
    `
    if (check.length === 0) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    const workoutId = check[0].workout_id

    // Delete all sets for this exercise first
    await sql`DELETE FROM exercise_sets WHERE exercise_id = ${exerciseId}`

    // Delete the exercise
    await sql`DELETE FROM exercises WHERE id = ${exerciseId}`

    // Recalculate total volume for the workout
    const volumeResult = await sql`
      SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) as total_volume
      FROM exercise_sets es
      JOIN exercises e ON es.exercise_id = e.id
      WHERE e.workout_id = ${workoutId}
    `

    await sql`
      UPDATE workouts
      SET total_volume = ${volumeResult[0].total_volume}
      WHERE id = ${workoutId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 })
  }
}
