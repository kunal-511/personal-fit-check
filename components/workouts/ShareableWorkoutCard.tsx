"use client"

import { Dumbbell, Calendar, Clock, Target, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import type { Workout } from "@/types"

interface ShareableWorkoutCardProps {
  workout: Workout
  totalSets: number
  totalReps: number
}

export function ShareableWorkoutCard({ workout, totalSets, totalReps }: ShareableWorkoutCardProps) {
  // Inline styles using RGB colors only (html2canvas compatible)
  const cardStyle = {
    width: "600px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    padding: "32px",
    borderRadius: "16px",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  }

  const headerIconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.2)",
  }

  const statCardStyle = {
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(51, 65, 85, 0.5)",
  }

  const exerciseCardStyle = {
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(51, 65, 85, 0.5)",
  }

  const badgeStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.2)",
    fontSize: "12px",
    fontWeight: "500",
    color: "#10b981",
  }

  const footerIconStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  return (
    <div id="shareable-workout-card" style={cardStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={headerIconStyle}>
            <Dumbbell style={{ width: "24px", height: "24px", color: "#10b981" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", margin: "0 0 4px 0" }}>{workout.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94a3b8" }}>
              <Calendar style={{ width: "12px", height: "12px" }} />
              <span>{format(new Date(workout.date), "MMMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Clock style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Duration</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{workout.duration_minutes || 0}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>minutes</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Target style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exercises</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{workout.exercises?.length || 0}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>completed</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <TrendingUp style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Sets</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{totalSets}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>sets completed</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Dumbbell style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Reps</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{totalReps}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>reps completed</p>
        </div>
      </div>

      {/* Exercise List */}
      {workout.exercises && workout.exercises.length > 0 && (
        <div style={{ ...exerciseCardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Exercises
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {workout.exercises.slice(0, 5).map((exercise, idx) => (
              <div key={exercise.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={badgeStyle}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: "500" }}>{exercise.exercise_name}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {exercise.sets?.length || 0} sets
                </span>
              </div>
            ))}
            {workout.exercises.length > 5 && (
              <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", paddingTop: "8px", margin: "0" }}>
                +{workout.exercises.length - 5} more exercises
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={footerIconStyle}>
            <Dumbbell style={{ width: "16px", height: "16px", color: "#10b981" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#cbd5e1" }}>Fitness Tracker</span>
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {workout.workout_type}
        </div>
      </div>
    </div>
  )
}
