import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Update a specific set
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)

    if (isNaN(setId)) {
      return NextResponse.json(
        { error: "Invalid set ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reps, weight_kg, rpe } = body

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: (number | null)[] = []

    if (reps !== undefined) {
      updates.push("reps")
      values.push(reps)
    }
    if (weight_kg !== undefined) {
      updates.push("weight_kg")
      values.push(weight_kg)
    }
    if (rpe !== undefined) {
      updates.push("rpe")
      values.push(rpe)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE exercise_sets
      SET
        reps = COALESCE(${reps ?? null}, reps),
        weight_kg = COALESCE(${weight_kg ?? null}, weight_kg),
        rpe = COALESCE(${rpe ?? null}, rpe)
      WHERE id = ${setId}
      RETURNING id, exercise_id, set_number, reps, weight_kg, rpe
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
      )
    }

    // Update the exercise's sets_completed count and recalculate workout volume
    const exerciseId = result[0].exercise_id

    // Get workout id for volume recalculation
    const exercise = await sql`
      SELECT workout_id FROM exercises WHERE id = ${exerciseId}
    `

    if (exercise.length > 0) {
      const workoutId = exercise[0].workout_id

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
    }

    return NextResponse.json({
      success: true,
      set: result[0]
    })
  } catch (error) {
    console.error("Error updating set:", error)
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    )
  }
}

// Delete a specific set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)

    if (isNaN(setId)) {
      return NextResponse.json(
        { error: "Invalid set ID" },
        { status: 400 }
      )
    }

    // Get the exercise_id before deleting
    const setInfo = await sql`
      SELECT exercise_id, set_number FROM exercise_sets WHERE id = ${setId}
    `

    if (setInfo.length === 0) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
      )
    }

    const exerciseId = setInfo[0].exercise_id
    const deletedSetNumber = setInfo[0].set_number

    // Delete the set
    await sql`
      DELETE FROM exercise_sets WHERE id = ${setId}
    `

    // Renumber remaining sets to maintain sequence
    await sql`
      UPDATE exercise_sets
      SET set_number = set_number - 1
      WHERE exercise_id = ${exerciseId} AND set_number > ${deletedSetNumber}
    `

    // Update sets_completed count on the exercise
    const setsCount = await sql`
      SELECT COUNT(*) as count FROM exercise_sets WHERE exercise_id = ${exerciseId}
    `

    await sql`
      UPDATE exercises
      SET sets_completed = ${setsCount[0].count}
      WHERE id = ${exerciseId}
    `

    // Get workout id for volume recalculation
    const exercise = await sql`
      SELECT workout_id FROM exercises WHERE id = ${exerciseId}
    `

    if (exercise.length > 0) {
      const workoutId = exercise[0].workout_id

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
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting set:", error)
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    )
  }
}
