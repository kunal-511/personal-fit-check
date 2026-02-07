"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Apple, Coffee, Moon, Sun, Trash2, Droplets, Loader2, Pencil, X as XIcon } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CircularProgress, Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { nutritionApi } from "@/lib/api"
import { useAppStore, formatDateForApi } from "@/lib/store"
import { format, isToday } from "date-fns"
import Link from "next/link"
import type { DailyNutrition } from "@/types"

const mealIcons: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Apple,
  dinner: Moon,
}

const mealColors: Record<string, string> = {
  breakfast: "amber",
  lunch: "orange",
  snack: "green",
  dinner: "purple",
}

export default function NutritionPage() {
  const selectedDate = useAppStore((s) => s.selectedDate)
  const dateStr = formatDateForApi(selectedDate)
  const [data, setData] = useState<DailyNutrition | null>(null)
  const [waterData, setWaterData] = useState<{ total: number; logs: Array<{ id: number; amount_ml: number }> }>({ total: 0, logs: [] })
  const [loading, setLoading] = useState(true)
  const [addingWater, setAddingWater] = useState(false)
  const [deletingMeal, setDeletingMeal] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState("today")
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null)
  const [savingGoals, setSavingGoals] = useState(false)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goalsForm, setGoalsForm] = useState({
    daily_calories: "1900",
    protein_g: "110",
    carbs_g: "230",
    fats_g: "60",
    water_ml: "4000",
  })
  const [editingMeal, setEditingMeal] = useState<any | null>(null)
  const [editMealForm, setEditMealForm] = useState({
    foods: [] as any[],
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [nutritionRes, waterRes] = await Promise.all([
        nutritionApi.getDaily(dateStr).catch(() => null),
        nutritionApi.getWater(dateStr).catch(() => ({ total: 0, logs: [] })),
      ])
      setData(nutritionRes)
      setWaterData(waterRes || { total: 0, logs: [] })
    } catch (error) {
      console.error("Failed to fetch nutrition data:", error)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddWater = async (amount: number) => {
    setAddingWater(true)
    try {
      const result = await nutritionApi.logWater(amount, dateStr)
      if (result.success) {
        setWaterData(prev => ({ ...prev, total: result.total }))
      }
    } catch (error) {
      console.error("Failed to add water:", error)
    } finally {
      setAddingWater(false)
    }
  }

  const handleDeleteMeal = async (mealId: number) => {
    setDeletingMeal(mealId)
    try {
      await nutritionApi.deleteMeal(mealId)
      await fetchData()
    } catch (error) {
      console.error("Failed to delete meal:", error)
    } finally {
      setDeletingMeal(null)
    }
  }

  useEffect(() => {
    if (!data?.goals) return
    setGoalsForm({
      daily_calories: String(data.goals.daily_calories),
      protein_g: String(data.goals.protein_g),
      carbs_g: String(data.goals.carbs_g),
      fats_g: String(data.goals.fats_g),
      water_ml: String(data.goals.water_ml),
    })
  }, [data?.goals])

  if (loading) {
    return <NutritionSkeleton />
  }

  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }
  const goals = data?.goals || { daily_calories: 1900, protein_g: 110, carbs_g: 230, fats_g: 60, water_ml: 4000 }
  const meals = data?.meals || []
  const waterTarget = goals.water_ml || 4000

  const caloriePercentage = Math.round((totals.calories / goals.daily_calories) * 100)
  const remaining = goals.daily_calories - totals.calories
  const waterPercentage = Math.round((waterData.total / waterTarget) * 100)

  const handleOpenEditMeal = (meal: any) => {
    setEditingMeal(meal)
    setEditMealForm({
      foods: (meal.food_items || []).map((f: any) => ({
        id: crypto.randomUUID(),
        food_name: f.food_name || f.name,
        quantity: f.quantity || 1,
        unit: f.unit || "serving",
        calories: f.calories || 0,
        protein_g: f.protein_g || f.protein || 0,
        carbs_g: f.carbs_g || f.carbs || 0,
        fats_g: f.fats_g || f.fats || 0,
      })),
    })
  }

  const handleSaveEditMeal = async () => {
    if (!editingMeal) return
    setSavingEdit(true)
    try {
      await nutritionApi.updateMeal({
        id: editingMeal.id,
        food_items: editMealForm.foods.map(f => ({
          food_name: f.food_name,
          quantity: f.quantity,
          unit: f.unit,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fats_g: f.fats_g,
        })),
      })
      await fetchData()
      setEditingMeal(null)
    } catch (error) {
      console.error("Failed to update meal:", error)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSaveGoals = async () => {
    setSavingGoals(true)
    try {
      const dailyCalories = Number.parseFloat(goalsForm.daily_calories)
      const protein = Number.parseFloat(goalsForm.protein_g)
      const carbs = Number.parseFloat(goalsForm.carbs_g)
      const fats = Number.parseFloat(goalsForm.fats_g)
      const water = Number.parseFloat(goalsForm.water_ml)

      await nutritionApi.updateGoals({
        daily_calories: Number.isFinite(dailyCalories) && dailyCalories > 0 ? dailyCalories : goals.daily_calories,
        protein_g: Number.isFinite(protein) && protein >= 0 ? protein : goals.protein_g,
        carbs_g: Number.isFinite(carbs) && carbs >= 0 ? carbs : goals.carbs_g,
        fats_g: Number.isFinite(fats) && fats >= 0 ? fats : goals.fats_g,
        water_ml: Number.isFinite(water) && water > 0 ? water : goals.water_ml,
      })

      await fetchData()
      setEditingGoals(false)
    } catch (error) {
      console.error("Failed to update goals:", error)
    } finally {
      setSavingGoals(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nutrition</h1>
          <p className="text-muted-foreground">
            {isToday(selectedDate) ? "Track your daily intake" : format(selectedDate, "EEEE, MMM d")}
          </p>
        </div>
        <Link href="/nutrition/log">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
        </Link>
      </div>

      {/* View Toggle */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="today" className="flex-1">
            {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM d")}
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
        </TabsList>

        {/* Today View */}
        <TabsContent value="today" className="space-y-6 mt-6">
          {/* Goals */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Goals</h2>
                <p className="text-sm text-muted-foreground">Update your daily targets</p>
              </div>
              {editingGoals ? (
                <div className="flex items-center gap-2">
                  <Button onClick={handleSaveGoals} disabled={savingGoals}>
                    {savingGoals ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Goals"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditingGoals(false)}
                    disabled={savingGoals}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setEditingGoals(true)}>
                  Edit Goals
                </Button>
              )}
            </div>
            {!editingGoals ? (
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                <p><span className="font-medium text-foreground">{goals.daily_calories}</span> cal</p>
                <p><span className="font-medium text-foreground">{goals.protein_g}</span> g protein</p>
                <p><span className="font-medium text-foreground">{goals.carbs_g}</span> g carbs</p>
                <p><span className="font-medium text-foreground">{goals.fats_g}</span> g fats</p>
                <p><span className="font-medium text-foreground">{goals.water_ml}</span> ml water</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="goalCalories">Calories</Label>
                  <Input
                    id="goalCalories"
                    type="text"
                    inputMode="decimal"
                    value={goalsForm.daily_calories}
                    onChange={(e) => setGoalsForm({ ...goalsForm, daily_calories: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalProtein">Protein (g)</Label>
                  <Input
                    id="goalProtein"
                    type="text"
                    inputMode="decimal"
                    value={goalsForm.protein_g}
                    onChange={(e) => setGoalsForm({ ...goalsForm, protein_g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalCarbs">Carbs (g)</Label>
                  <Input
                    id="goalCarbs"
                    type="text"
                    inputMode="decimal"
                    value={goalsForm.carbs_g}
                    onChange={(e) => setGoalsForm({ ...goalsForm, carbs_g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalFats">Fats (g)</Label>
                  <Input
                    id="goalFats"
                    type="text"
                    inputMode="decimal"
                    value={goalsForm.fats_g}
                    onChange={(e) => setGoalsForm({ ...goalsForm, fats_g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalWater">Water (ml)</Label>
                  <Input
                    id="goalWater"
                    type="text"
                    inputMode="decimal"
                    value={goalsForm.water_ml}
                    onChange={(e) => setGoalsForm({ ...goalsForm, water_ml: e.target.value })}
                  />
                </div>
              </div>
            )}
          </GlassCard>
          {/* Calorie Overview */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <CircularProgress
                value={totals.calories}
                max={goals.daily_calories}
                size={160}
                strokeWidth={12}
                indicatorClassName="stroke-primary"
                trackClassName="stroke-primary/20"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold">{Math.round(totals.calories)}</p>
                  <p className="text-xs text-muted-foreground">of {goals.daily_calories} cal</p>
                </div>
              </CircularProgress>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-2xl font-bold text-protein">{Math.round(totals.protein)}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <Progress
                      value={(totals.protein / goals.protein_g) * 100}
                      className="mt-1 h-1.5"
                      indicatorClassName="bg-protein"
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-carbs">{Math.round(totals.carbs)}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <Progress
                      value={(totals.carbs / goals.carbs_g) * 100}
                      className="mt-1 h-1.5"
                      indicatorClassName="bg-carbs"
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-fats">{Math.round(totals.fats)}g</p>
                    <p className="text-xs text-muted-foreground">Fats</p>
                    <Progress
                      value={(totals.fats / goals.fats_g) * 100}
                      className="mt-1 h-1.5"
                      indicatorClassName="bg-fats"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm">
                    {remaining > 0 ? (
                      <>
                        <span className="font-medium">{Math.round(remaining)}</span>
                        <span className="text-muted-foreground"> calories remaining</span>
                      </>
                    ) : remaining < 0 ? (
                      <>
                        <span className="font-medium">{Math.abs(Math.round(remaining))}</span>
                        <span className="text-muted-foreground"> calories over goal</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Goal reached!</span>
                    )}
                  </p>
                  <Progress value={Math.min(100, caloriePercentage)} className="mt-2 h-2" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Water Tracker */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Droplets className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Water Intake</p>
                  <p className="text-sm text-muted-foreground">
                    {(waterData.total / 1000).toFixed(1)}L / {(waterTarget / 1000).toFixed(1)}L
                  </p>
                </div>
              </div>
            </div>

            <Progress
              value={Math.min(100, waterPercentage)}
              className="h-3 mb-4"
              indicatorClassName="bg-blue-500"
            />

            <div className="flex gap-2">
              {[250, 500, 750, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleAddWater(amount)}
                  disabled={addingWater}
                >
                  {addingWater ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    `+${amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}`
                  )}
                </Button>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              {waterData.total >= waterTarget
                ? "Goal reached! Great job staying hydrated!"
                : `${((waterTarget - waterData.total) / 1000).toFixed(1)}L remaining to reach your goal`
              }
            </p>
          </GlassCard>

          {/* Meals */}
          <div>
            <h2 className="mb-4 font-semibold">{isToday(selectedDate) ? "Today's" : format(selectedDate, "MMM d")} Meals</h2>
            {meals.length > 0 ? (
              <div className="space-y-3">
                {meals.map((meal) => {
                  const Icon = mealIcons[meal.meal_type] || Apple
                  const color = mealColors[meal.meal_type] || "green"

                  return (
                    <GlassCard key={meal.id} className="overflow-hidden">
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer"
                        onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                      >
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          color === "amber" && "bg-amber-500/10",
                          color === "orange" && "bg-orange-500/10",
                          color === "green" && "bg-green-500/10",
                          color === "purple" && "bg-purple-500/10"
                        )}>
                          <Icon className={cn(
                            "h-6 w-6",
                            color === "amber" && "text-amber-500",
                            color === "orange" && "text-orange-500",
                            color === "green" && "text-green-500",
                            color === "purple" && "text-purple-500"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{meal.meal_name || meal.meal_type}</p>
                            <p className="text-sm font-medium">{Math.round(meal.totals?.calories || 0)} cal</p>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="capitalize">{meal.meal_type}</span>
                            <span className="text-protein">P: {Math.round(meal.totals?.protein || 0)}g</span>
                            <span className="text-carbs">C: {Math.round(meal.totals?.carbs || 0)}g</span>
                            <span className="text-fats">F: {Math.round(meal.totals?.fats || 0)}g</span>
                          </div>
                        </div>
                      </div>

                      {expandedMeal === meal.id && (
                        <div className="border-t border-border/50 bg-secondary/20 p-4">
                          {meal.food_items && meal.food_items.length > 0 && (
                            <>
                              <p className="text-sm font-medium mb-2">Foods:</p>
                              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                                {meal.food_items.map((food, idx) => (
                                  <li key={idx}>
                                    {food.food_name || (food as unknown as { name: string }).name} - {food.quantity}{food.unit} ({Math.round(food.calories)} cal)
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditMeal(meal)}
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteMeal(meal.id)}
                              disabled={deletingMeal === meal.id}
                            >
                              {deletingMeal === meal.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-3 w-3" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  )
                })}
              </div>
            ) : (
              <GlassCard className="p-8">
                <div className="flex flex-col items-center justify-center">
                  <Apple className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No meals logged {isToday(selectedDate) ? "today" : `on ${format(selectedDate, "MMM d")}`}</p>
                  <Link href="/nutrition/log" className="mt-2 text-sm text-primary hover:underline">
                    Log your first meal
                  </Link>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Quick Add */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Breakfast", icon: Coffee, color: "amber" },
              { label: "Lunch", icon: Sun, color: "orange" },
              { label: "Snack", icon: Apple, color: "green" },
              { label: "Dinner", icon: Moon, color: "purple" },
            ].map((item) => (
              <Link key={item.label} href={`/nutrition/log?type=${item.label.toLowerCase()}`}>
                <GlassCard className="flex cursor-pointer flex-col items-center gap-2 p-4 transition-colors hover:bg-white/[0.07]">
                  <item.icon className={cn(
                    "h-6 w-6",
                    item.color === "amber" && "text-amber-500",
                    item.color === "orange" && "text-orange-500",
                    item.color === "green" && "text-green-500",
                    item.color === "purple" && "text-purple-500"
                  )} />
                  <span className="text-sm">{item.label}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Week View - Coming Soon placeholder */}
        <TabsContent value="week" className="space-y-6 mt-6">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-medium mb-2">Weekly View</p>
              <p className="text-sm text-muted-foreground text-center">
                Weekly nutrition tracking will show your progress over the past 7 days.
                <br />Start logging meals to see your weekly trends!
              </p>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Edit Meal Dialog */}
      <Dialog open={editingMeal !== null} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Food Items</Label>
              <div className="space-y-3">
                {editMealForm.foods.map((food, idx) => (
                  <div key={food.id} className="grid gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditMealForm({
                            ...editMealForm,
                            foods: editMealForm.foods.filter((_, i) => i !== idx),
                          })
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Food Name</Label>
                        <Input
                          placeholder="e.g., Chicken Breast"
                          value={food.food_name}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].food_name = e.target.value
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <Input
                          placeholder="1"
                          type="text"
                          inputMode="decimal"
                          value={food.quantity}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].quantity = Number.parseFloat(e.target.value) || 1
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unit</Label>
                        <Input
                          placeholder="e.g., serving, g, oz"
                          value={food.unit}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].unit = e.target.value
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Calories</Label>
                        <Input
                          placeholder="0"
                          type="text"
                          inputMode="decimal"
                          value={food.calories}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].calories = Number.parseFloat(e.target.value) || 0
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                        <Input
                          placeholder="0"
                          type="text"
                          inputMode="decimal"
                          value={food.protein_g}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].protein_g = Number.parseFloat(e.target.value) || 0
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
                        <Input
                          placeholder="0"
                          type="text"
                          inputMode="decimal"
                          value={food.carbs_g}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].carbs_g = Number.parseFloat(e.target.value) || 0
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fats (g)</Label>
                        <Input
                          placeholder="0"
                          type="text"
                          inputMode="decimal"
                          value={food.fats_g}
                          className="bg-transparent"
                          onChange={(e) => {
                            const newFoods = [...editMealForm.foods]
                            newFoods[idx].fats_g = Number.parseFloat(e.target.value) || 0
                            setEditMealForm({ ...editMealForm, foods: newFoods })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMealForm({
                      ...editMealForm,
                      foods: [
                        ...editMealForm.foods,
                        {
                          id: crypto.randomUUID(),
                          food_name: "",
                          quantity: 1,
                          unit: "serving",
                          calories: 0,
                          protein_g: 0,
                          carbs_g: 0,
                          fats_g: 0,
                        },
                      ],
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Food Item
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMeal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditMeal} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NutritionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <GlassCard className="p-6">
        <div className="flex gap-6">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-16" />
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <Skeleton className="h-24" />
      </GlassCard>
    </div>
  )
}
