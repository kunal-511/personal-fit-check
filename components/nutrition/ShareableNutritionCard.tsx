"use client"

import { Apple, Calendar, Droplets, Flame, Target, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import type { Meal } from "@/types"

interface ShareableNutritionCardProps {
  date: Date
  calories: number
  calorieGoal: number
  protein: number
  proteinGoal: number
  carbs: number
  carbsGoal: number
  fats: number
  fatsGoal: number
  waterMl: number
  waterGoalMl: number
  meals: Meal[]
}

export function ShareableNutritionCard({
  date,
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fats,
  fatsGoal,
  waterMl,
  waterGoalMl,
  meals,
}: ShareableNutritionCardProps) {
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
    background: "rgba(59, 130, 246, 0.2)",
  }

  const statCardStyle = {
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(51, 65, 85, 0.5)",
  }

  const mealCardStyle = {
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(51, 65, 85, 0.5)",
  }

  const footerIconStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const displayMeals = meals.slice(0, 5)

  return (
    <div id="shareable-nutrition-card" style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={headerIconStyle}>
            <Apple style={{ width: "24px", height: "24px", color: "#60a5fa" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", margin: "0 0 4px 0" }}>Daily Nutrition</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94a3b8" }}>
              <Calendar style={{ width: "12px", height: "12px" }} />
              <span>{format(date, "MMMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Flame style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calories</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{Math.round(calories)}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>of {calorieGoal}</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Droplets style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Water</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{(waterMl / 1000).toFixed(1)}L</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>of {(waterGoalMl / 1000).toFixed(1)}L</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <Target style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Macros</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", margin: "0 0 6px 0" }}>
            P {Math.round(protein)}g / C {Math.round(carbs)}g / F {Math.round(fats)}g
          </p>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0" }}>
            Goals: {proteinGoal}g / {carbsGoal}g / {fatsGoal}g
          </p>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "8px" }}>
            <TrendingUp style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Meals</span>
          </div>
          <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ffffff", margin: "0" }}>{meals.length}</p>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>logged today</p>
        </div>
      </div>

      {displayMeals.length > 0 && (
        <div style={{ ...mealCardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Meals
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayMeals.map((meal) => (
              <div key={meal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: "500", textTransform: "capitalize" }}>
                  {meal.meal_name || meal.meal_type}
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {Math.round(meal.totals?.calories || 0)} cal
                </span>
              </div>
            ))}
            {meals.length > 5 && (
              <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", paddingTop: "8px", margin: "0" }}>
                +{meals.length - 5} more meals
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={footerIconStyle}>
            <Apple style={{ width: "16px", height: "16px", color: "#60a5fa" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#cbd5e1" }}>Fitness Tracker</span>
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Nutrition
        </div>
      </div>
    </div>
  )
}
