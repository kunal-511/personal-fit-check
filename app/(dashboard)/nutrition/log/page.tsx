"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Loader2, Check, Sparkles, Send } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nutritionApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fats: number
  source: "manual" | "parsed" | "quick"
}

interface FrequentFood {
  name: string
  unit: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

function LogMealPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export default function LogMealPage() {
  return (
    <Suspense fallback={<LogMealPageSkeleton />}>
      <LogMealPageContent />
    </Suspense>
  )
}

function LogMealPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "lunch"

  const [mealType, setMealType] = useState(defaultType)
  const [mealName, setMealName] = useState("")
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [frequentFoods, setFrequentFoods] = useState<FrequentFood[]>([])
  const [frequentLoading, setFrequentLoading] = useState(true)

  // AI Food Parser
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  useEffect(() => {
    let mounted = true
    const loadFrequentFoods = async () => {
      setFrequentLoading(true)
      try {
        const result = await nutritionApi.getFrequentFoods(6, mealType)
        if (mounted) {
          setFrequentFoods(result.foods || [])
        }
      } catch (error) {
        console.error("Failed to load frequent foods:", error)
      } finally {
        if (mounted) setFrequentLoading(false)
      }
    }
    loadFrequentFoods()
    return () => {
      mounted = false
    }
  }, [mealType])

  const handleAiParse = async () => {
    if (!aiInput.trim()) return

    setAiLoading(true)
    setAiError("")

    try {
      const result = await nutritionApi.parseFood(aiInput)

      if (result.success && result.foods.length > 0) {
        // Add parsed foods to the list
        result.foods.forEach((food) => {
          addFood({
            name: food.name,
            quantity: food.quantity,
            unit: food.unit,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
            source: "parsed",
          })
        })
        setAiInput("")
      } else {
        setAiError(result.message || "Could not identify foods. Try being more specific.")
      }
    } catch (error) {
      setAiError("Failed to parse food. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  // Manual entry form
  const [manualFood, setManualFood] = useState({
    name: "",
    quantity: "1",
    unit: "serving",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  })

  const addFood = (food: Omit<FoodItem, "id">) => {
    setFoods([...foods, { ...food, id: crypto.randomUUID() }])
  }

  const removeFood = (id: string) => {
    setFoods(foods.filter(f => f.id !== id))
  }

  const addFrequentFood = (food: FrequentFood) => {
    addFood({
      name: food.name,
      quantity: 1,
      unit: food.unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      source: "quick",
    })
  }

  const addManualFood = () => {
    if (!manualFood.name) return

    const quantity = Number.parseFloat(manualFood.quantity)
    const calories = Number.parseFloat(manualFood.calories)
    const protein = Number.parseFloat(manualFood.protein)
    const carbs = Number.parseFloat(manualFood.carbs)
    const fats = Number.parseFloat(manualFood.fats)

    addFood({
      name: manualFood.name.trim(),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit: manualFood.unit.trim() || "serving",
      calories: Number.isFinite(calories) ? calories : 0,
      protein: Number.isFinite(protein) ? protein : 0,
      carbs: Number.isFinite(carbs) ? carbs : 0,
      fats: Number.isFinite(fats) ? fats : 0,
      source: "manual",
    })

    setManualFood({
      name: "",
      quantity: "1",
      unit: "serving",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    })
  }

  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories * food.quantity,
      protein: acc.protein + food.protein * food.quantity,
      carbs: acc.carbs + food.carbs * food.quantity,
      fats: acc.fats + food.fats * food.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFood, setEditFood] = useState({
    name: "",
    quantity: "1",
    unit: "serving",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  })

  const startEdit = (food: FoodItem) => {
    setEditingId(food.id)
    setEditFood({
      name: food.name,
      quantity: String(food.quantity),
      unit: food.unit,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fats: String(food.fats),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = () => {
    if (!editingId) return
    const quantity = Number.parseFloat(editFood.quantity)
    const calories = Number.parseFloat(editFood.calories)
    const protein = Number.parseFloat(editFood.protein)
    const carbs = Number.parseFloat(editFood.carbs)
    const fats = Number.parseFloat(editFood.fats)

    setFoods(prev =>
      prev.map(f =>
        f.id === editingId
          ? {
              ...f,
              name: editFood.name.trim() || f.name,
              quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
              unit: editFood.unit.trim() || "serving",
              calories: Number.isFinite(calories) ? calories : 0,
              protein: Number.isFinite(protein) ? protein : 0,
              carbs: Number.isFinite(carbs) ? carbs : 0,
              fats: Number.isFinite(fats) ? fats : 0,
            }
          : f
      )
    )

    setEditingId(null)
  }

  const handleSave = async () => {
    if (foods.length === 0) return

    setSaving(true)
    try {
      await nutritionApi.logMeal({
        meal_type: mealType as "breakfast" | "lunch" | "dinner" | "snack",
        meal_name: mealName || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
        food_items: foods.map(f => ({
          food_name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          calories: f.calories,
          protein_g: f.protein,
          carbs_g: f.carbs,
          fats_g: f.fats,
          fiber_g: null,
          sugar_g: null,
          sodium_mg: null,
          vitamin_c_mg: null,
          vitamin_d_mcg: null,
          calcium_mg: null,
          iron_mg: null,
        })),
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/nutrition")
      }, 1000)
    } catch (error) {
      console.error("Failed to save meal:", error)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium">Meal logged successfully!</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/nutrition">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Log Meal</h1>
          <p className="text-muted-foreground">Add food to your diary</p>
        </div>
      </div>

      {/* Meal Type Selector */}
      <Tabs value={mealType} onValueChange={setMealType}>
        <TabsList className="w-full">
          <TabsTrigger value="breakfast" className="flex-1">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch" className="flex-1">Lunch</TabsTrigger>
          <TabsTrigger value="dinner" className="flex-1">Dinner</TabsTrigger>
          <TabsTrigger value="snack" className="flex-1">Snack</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meal Name */}
      <div className="space-y-2">
        <Label htmlFor="mealName">Meal Name (optional)</Label>
        <Input
          id="mealName"
          placeholder={`e.g., ${mealType === "breakfast" ? "Oatmeal with Berries" : mealType === "lunch" ? "Grilled Chicken Salad" : mealType === "dinner" ? "Salmon with Vegetables" : "Protein Shake"}`}
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      {/* AI Food Parser */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Food Parser</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Describe what you ate in natural language
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 200g chicken breast with 100g rice and salad"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
            disabled={aiLoading}
          />
          <Button
            onClick={handleAiParse}
            disabled={!aiInput.trim() || aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {aiError && (
          <p className="text-sm text-destructive mt-2">{aiError}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Try: &quot;2 eggs with toast&quot;, &quot;protein shake&quot;, &quot;150g salmon with sweet potato&quot;
        </p>
      </GlassCard>

      {/* Added Foods */}
      {foods.length > 0 && (
        <GlassCard className="p-4">
          <h2 className="font-semibold mb-3">Added Foods</h2>
          <div className="space-y-2">
            {foods.map((food) => (
              <div
                key={food.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex-1">
                  {editingId === food.id && food.source === "manual" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Food name"
                        value={editFood.name}
                        onChange={(e) => setEditFood({ ...editFood, name: e.target.value })}
                      />
                      <Input
                        placeholder="Unit"
                        value={editFood.unit}
                        onChange={(e) => setEditFood({ ...editFood, unit: e.target.value })}
                      />
                      <Input
                        placeholder="Quantity"
                        inputMode="decimal"
                        value={editFood.quantity}
                        onChange={(e) => setEditFood({ ...editFood, quantity: e.target.value })}
                      />
                      <Input
                        placeholder="Calories"
                        inputMode="decimal"
                        value={editFood.calories}
                        onChange={(e) => setEditFood({ ...editFood, calories: e.target.value })}
                      />
                      <Input
                        placeholder="Protein (g)"
                        inputMode="decimal"
                        value={editFood.protein}
                        onChange={(e) => setEditFood({ ...editFood, protein: e.target.value })}
                      />
                      <Input
                        placeholder="Carbs (g)"
                        inputMode="decimal"
                        value={editFood.carbs}
                        onChange={(e) => setEditFood({ ...editFood, carbs: e.target.value })}
                      />
                      <Input
                        placeholder="Fats (g)"
                        inputMode="decimal"
                        value={editFood.fats}
                        onChange={(e) => setEditFood({ ...editFood, fats: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.quantity} x {food.unit} - {Math.round(food.calories * food.quantity)} cal
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {food.source === "manual" && editingId !== food.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(food)}
                    >
                      Edit
                    </Button>
                  )}
                  {food.source === "manual" && editingId === food.id && (
                    <>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFood(food.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="font-bold">{Math.round(totals.calories)} cal</span>
            </div>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              <span className="text-protein">P: {Math.round(totals.protein)}g</span>
              <span className="text-carbs">C: {Math.round(totals.carbs)}g</span>
              <span className="text-fats">F: {Math.round(totals.fats)}g</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Common Foods */}
      <div>
        <h2 className="mb-3 font-semibold">Quick Add</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {frequentLoading && (
            <p className="text-sm text-muted-foreground">Loading your frequent foods...</p>
          )}
          {!frequentLoading && frequentFoods.length === 0 && (
            <p className="text-sm text-muted-foreground">Log a few {mealType} meals to build your quick add list.</p>
          )}
          {!frequentLoading && frequentFoods.length > 0 && frequentFoods.map((food, index) => (
            <GlassCard
              key={`${food.name}-${index}`}
              className={cn(
                "p-3 cursor-pointer transition-colors hover:bg-white/[0.07]",
                foods.some(f => f.name === food.name) && "ring-1 ring-primary"
              )}
              onClick={() => addFrequentFood(food)}
            >
              <p className="font-medium text-sm truncate">{food.name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(food.calories)} cal / {food.unit}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Manual Entry */}
      <GlassCard className="p-6">
        <h2 className="mb-4 font-semibold">Manual Entry</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              id="foodName"
              placeholder="Enter food name"
              value={manualFood.name}
              onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 1, 0.5, 150"
              value={manualFood.quantity}
              onChange={(e) => setManualFood({ ...manualFood, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              placeholder="e.g., g, serving, piece"
              value={manualFood.unit}
              onChange={(e) => setManualFood({ ...manualFood, unit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 200"
              value={manualFood.calories}
              onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 25"
              value={manualFood.protein}
              onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 30"
              value={manualFood.carbs}
              onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fats">Fats (g)</Label>
            <Input
              id="fats"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 10"
              value={manualFood.fats}
              onChange={(e) => setManualFood({ ...manualFood, fats: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-4 w-full"
          variant="secondary"
          onClick={addManualFood}
          disabled={!manualFood.name}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Food
        </Button>
      </GlassCard>

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={foods.length === 0 || saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Save Meal ({Math.round(totals.calories)} cal)
          </>
        )}
      </Button>
    </div>
  )
}
