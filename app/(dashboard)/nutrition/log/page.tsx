"use client"

import { useState, Suspense } from "react"
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
}

const commonFoods = [
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6, unit: "100g" },
  { name: "Brown Rice", calories: 112, protein: 2.6, carbs: 24, fats: 0.9, unit: "100g" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, unit: "1 medium" },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fats: 0.7, unit: "170g" },
  { name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fats: 11, unit: "2 large" },
  { name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fats: 3, unit: "40g" },
  { name: "Salmon", calories: 208, protein: 20, carbs: 0, fats: 13, unit: "100g" },
  { name: "Broccoli", calories: 55, protein: 3.7, carbs: 11, fats: 0.6, unit: "150g" },
  { name: "Sweet Potato", calories: 103, protein: 2.3, carbs: 24, fats: 0.1, unit: "130g" },
  { name: "Almonds", calories: 164, protein: 6, carbs: 6, fats: 14, unit: "28g" },
]

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

  // AI Food Parser
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

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
    quantity: 1,
    unit: "serving",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  })

  const addFood = (food: Omit<FoodItem, "id">) => {
    setFoods([...foods, { ...food, id: crypto.randomUUID() }])
  }

  const removeFood = (id: string) => {
    setFoods(foods.filter(f => f.id !== id))
  }

  const addCommonFood = (food: typeof commonFoods[0]) => {
    addFood({
      name: food.name,
      quantity: 1,
      unit: food.unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    })
  }

  const addManualFood = () => {
    if (!manualFood.name) return

    addFood({
      name: manualFood.name,
      quantity: manualFood.quantity,
      unit: manualFood.unit,
      calories: manualFood.calories,
      protein: manualFood.protein,
      carbs: manualFood.carbs,
      fats: manualFood.fats,
    })

    setManualFood({
      name: "",
      quantity: 1,
      unit: "serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
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
                <div>
                  <p className="font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.quantity} x {food.unit} - {Math.round(food.calories * food.quantity)} cal
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeFood(food.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
          {commonFoods.slice(0, 6).map((food, index) => (
            <GlassCard
              key={index}
              className={cn(
                "p-3 cursor-pointer transition-colors hover:bg-white/[0.07]",
                foods.some(f => f.name === food.name) && "ring-1 ring-primary"
              )}
              onClick={() => addCommonFood(food)}
            >
              <p className="font-medium text-sm truncate">{food.name}</p>
              <p className="text-xs text-muted-foreground">
                {food.calories} cal / {food.unit}
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
              type="number"
              min="0.1"
              step="0.1"
              value={manualFood.quantity}
              onChange={(e) => setManualFood({ ...manualFood, quantity: parseFloat(e.target.value) || 0 })}
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
              type="number"
              min="0"
              value={manualFood.calories}
              onChange={(e) => setManualFood({ ...manualFood, calories: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              min="0"
              step="0.1"
              value={manualFood.protein}
              onChange={(e) => setManualFood({ ...manualFood, protein: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              step="0.1"
              value={manualFood.carbs}
              onChange={(e) => setManualFood({ ...manualFood, carbs: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fats">Fats (g)</Label>
            <Input
              id="fats"
              type="number"
              min="0"
              step="0.1"
              value={manualFood.fats}
              onChange={(e) => setManualFood({ ...manualFood, fats: parseFloat(e.target.value) || 0 })}
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
