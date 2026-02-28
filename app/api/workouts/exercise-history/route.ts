import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const exerciseName = request.nextUrl.searchParams.get("exercise")
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "5")

  if (!exerciseName) {
    return NextResponse.json({ error: "Exercise name required" }, { status: 400 })
  }

  try {
    // Fetch all sets for this exercise ordered by date desc
    const rows = await sql`
      SELECT
        w.id        AS workout_id,
        w.date,
        w.title     AS workout_title,
        e.id        AS exercise_id,
        e.notes     AS exercise_notes,
        es.set_number,
        es.weight_kg,
        es.reps,
        es.rpe
      FROM workouts w
      JOIN exercises e  ON w.id = e.workout_id
      JOIN exercise_sets es ON e.id = es.exercise_id
      WHERE w.user_id = ${USER_ID}
        AND LOWER(TRIM(e.exercise_name)) = LOWER(TRIM(${exerciseName}))
      ORDER BY w.date DESC, w.id DESC, es.set_number ASC
      LIMIT 200
    `

    // Group rows by workout_id (preserves DESC date order)
    const sessionMap = new Map<number, {
      workout_id: number
      date: string
      workout_title: string
      exercise_notes: string | null
      sets: Array<{ set_number: number; weight_kg: number; reps: number; rpe: number | null }>
    }>()

    for (const row of rows) {
      if (!sessionMap.has(row.workout_id)) {
        sessionMap.set(row.workout_id, {
          workout_id: row.workout_id,
          date: row.date,
          workout_title: row.workout_title,
          exercise_notes: row.exercise_notes,
          sets: [],
        })
      }
      sessionMap.get(row.workout_id)!.sets.push({
        set_number: row.set_number,
        weight_kg: parseFloat(row.weight_kg),
        reps: row.reps,
        rpe: row.rpe != null ? parseFloat(row.rpe) : null,
      })
    }

    // Total sessions count (can exceed the limit)
    const totalCount = await sql`
      SELECT COUNT(DISTINCT w.id)::int AS count
      FROM workouts w
      JOIN exercises e ON w.id = e.workout_id
      WHERE w.user_id = ${USER_ID}
        AND LOWER(TRIM(e.exercise_name)) = LOWER(TRIM(${exerciseName}))
    `

    // Build sessions array (limited) with derived stats
    const sessions = Array.from(sessionMap.values())
      .slice(0, limit)
      .map((session) => {
        const totalVolume = session.sets.reduce(
          (acc, s) => acc + s.weight_kg * s.reps,
          0
        )
        const maxWeight = session.sets.length
          ? Math.max(...session.sets.map((s) => s.weight_kg))
          : 0
        return { ...session, total_volume: Math.round(totalVolume), max_weight: maxWeight }
      })

    // Find overall PR across all rows (not just the limited slice)
    let pr: { weight: number; reps: number; date: string } | null = null
    for (const session of sessionMap.values()) {
      for (const set of session.sets) {
        if (
          !pr ||
          set.weight_kg > pr.weight ||
          (set.weight_kg === pr.weight && set.reps > pr.reps)
        ) {
          pr = { weight: set.weight_kg, reps: set.reps, date: session.date }
        }
      }
    }

    return NextResponse.json({
      exercise_name: exerciseName,
      sessions,
      personal_record: pr,
      total_sessions: totalCount[0]?.count ?? 0,
    })
  } catch (error) {
    console.error("Error fetching exercise history:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercise history" },
      { status: 500 }
    )
  }
}
