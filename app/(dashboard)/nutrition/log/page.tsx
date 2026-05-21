"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Loader2, Check, Sparkles, Send, Calendar, ImagePlus, X } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nutritionApi } from "@/lib/api"
import { useAppStore, formatDateForApi } from "@/lib/store"
import { format, isToday } from "date-fns"
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
  const selectedDate = useAppStore((s) => s.selectedDate)
  const dateStr = formatDateForApi(selectedDate)

  const [mealType, setMealType] = useState(defaultType)
  const [mealName, setMealName] = useState("")
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [frequentFoods, setFrequentFoods] = useState<FrequentFood[]>([])
  const [frequentLoading, setFrequentLoading] = useState(true)

  // AI Food Parser — text
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  // AI Food Parser — image
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

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

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Please drop an image file (JPG, PNG, WEBP, etc.)")
      return
    }
    setImageFile(file)
    setImageError("")
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    loadImageFile(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    loadImageFile(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImageParse = async () => {
    if (!imageFile) return

    setImageLoading(true)
    setImageError("")

    try {
      const result = await nutritionApi.parseFoodImage(imageFile)

      if (result.success && result.foods.length > 0) {
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
        clearImage()
      } else {
        setImageError(result.message || "Could not identify foods in the image. Try a clearer photo.")
      }
    } catch {
      setImageError("Failed to analyse image. Please try again.")
    } finally {
      setImageLoading(false)
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
        date: dateStr,
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium">Meal logged successfully!</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    // Extra bottom padding on mobile so sticky save bar doesn't overlap content
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/nutrition">
          <Button variant="ghost" size="icon" className="shrink-0 touch-manipulation">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">Log Meal</h1>
          <p className="text-sm text-muted-foreground">Add food to your diary</p>
        </div>
      </div>

      {/* Past date banner */}
      {!isToday(selectedDate) && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-500">
            Logging for {format(selectedDate, "EEEE, MMMM d")}
          </span>
        </div>
      )}

      {/* Meal Type Selector */}
      <Tabs value={mealType} onValueChange={setMealType}>
        <TabsList className="w-full">
          <TabsTrigger value="breakfast" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
            <span className="sm:hidden">🌅</span>
            <span className="hidden sm:inline">Breakfast</span>
            <span className="sm:hidden ml-1">Bkfst</span>
          </TabsTrigger>
          <TabsTrigger value="lunch" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
            <span className="sm:hidden">☀️</span>
            <span className="ml-1">Lunch</span>
          </TabsTrigger>
          <TabsTrigger value="dinner" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
            <span className="sm:hidden">🌙</span>
            <span className="ml-1">Dinner</span>
          </TabsTrigger>
          <TabsTrigger value="snack" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
            <span className="sm:hidden">🍎</span>
            <span className="ml-1">Snack</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meal Name */}
      <div className="space-y-2">
        <Label htmlFor="mealName">Meal Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="mealName"
          placeholder="e.g., Grilled Chicken Salad"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      {/* AI Food Parser */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <h2 className="font-semibold">AI Food Parser</h2>
        </div>

        {/* Text parser */}
        <p className="text-sm text-muted-foreground mb-2">
          Describe what you ate
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 2 eggs with toast and butter"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
            disabled={aiLoading}
            className="min-w-0"
          />
          <Button
            onClick={handleAiParse}
            disabled={!aiInput.trim() || aiLoading}
            className="shrink-0 touch-manipulation"
            size="icon"
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
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Try: &quot;200g chicken with rice&quot;, &quot;protein shake&quot;, &quot;2 rotis with dal&quot;
        </p>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Image parser */}
        <p className="text-sm text-muted-foreground mb-3">
          Upload a photo of your meal
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageSelect}
        />

        {!imagePreview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-7 transition-all touch-manipulation",
              isDragging
                ? "border-primary bg-primary/10 text-primary scale-[1.01]"
                : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary active:bg-primary/5"
            )}
          >
            <ImagePlus className={cn("h-7 w-7 transition-transform", isDragging && "scale-110")} />
            <span className="text-sm font-medium">
              {isDragging ? "Drop your image here" : (
                <>
                  <span className="sm:hidden">Tap to take or upload a photo</span>
                  <span className="hidden sm:inline">Drag & drop or click to upload</span>
                </>
              )}
            </span>
            <span className="text-xs opacity-60">JPG, PNG, WEBP · up to 20 MB</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Meal preview"
                className="w-full max-h-56 object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-destructive transition-colors touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="w-full touch-manipulation"
              onClick={handleImageParse}
              disabled={imageLoading}
            >
              {imageLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing image...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse Nutrition from Image
                </>
              )}
            </Button>
          </div>
        )}

        {imageError && (
          <p className="text-sm text-destructive mt-2">{imageError}</p>
        )}
      </GlassCard>

      {/* Added Foods */}
      {foods.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Added Foods</h2>
            <span className="text-xs text-muted-foreground">{foods.length} item{foods.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {foods.map((food) => (
              <div key={food.id} className="rounded-lg bg-secondary/50 overflow-hidden">
                {editingId === food.id && food.source === "manual" ? (
                  // Edit form — full width, stacks cleanly on mobile
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Food name"
                        value={editFood.name}
                        className="col-span-2"
                        onChange={(e) => setEditFood({ ...editFood, name: e.target.value })}
                      />
                      <Input
                        placeholder="Qty"
                        inputMode="decimal"
                        value={editFood.quantity}
                        onChange={(e) => setEditFood({ ...editFood, quantity: e.target.value })}
                      />
                      <Input
                        placeholder="Unit"
                        value={editFood.unit}
                        onChange={(e) => setEditFood({ ...editFood, unit: e.target.value })}
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
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 touch-manipulation" onClick={saveEdit}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 touch-manipulation" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display row
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{food.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {food.quantity} {food.unit} · {Math.round(food.calories * food.quantity)} cal
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-protein">P {Math.round(food.protein * food.quantity)}g</span>
                        <span className="text-xs text-carbs">C {Math.round(food.carbs * food.quantity)}g</span>
                        <span className="text-xs text-fats">F {Math.round(food.fats * food.quantity)}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {food.source === "manual" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs touch-manipulation"
                          onClick={() => startEdit(food)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive touch-manipulation"
                        onClick={() => removeFood(food.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Total</span>
              <span className="font-bold">{Math.round(totals.calories)} cal</span>
            </div>
            <div className="flex gap-4 mt-1">
              <span className="text-sm text-protein">P: {Math.round(totals.protein)}g</span>
              <span className="text-sm text-carbs">C: {Math.round(totals.carbs)}g</span>
              <span className="text-sm text-fats">F: {Math.round(totals.fats)}g</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Quick Add */}
      <div>
        <h2 className="mb-3 font-semibold">Quick Add</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {frequentLoading && (
            <p className="text-sm text-muted-foreground col-span-2 sm:col-span-3">Loading your frequent foods...</p>
          )}
          {!frequentLoading && frequentFoods.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 sm:col-span-3">
              Log a few {mealType} meals to build your quick add list.
            </p>
          )}
          {!frequentLoading && frequentFoods.length > 0 && frequentFoods.map((food, index) => (
            <GlassCard
              key={`${food.name}-${index}`}
              className={cn(
                "p-3 cursor-pointer transition-colors hover:bg-white/[0.07] active:bg-white/[0.10] touch-manipulation",
                foods.some(f => f.name === food.name) && "ring-1 ring-primary"
              )}
              onClick={() => addFrequentFood(food)}
            >
              <p className="font-medium text-sm truncate">{food.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {Math.round(food.calories)} cal / {food.unit}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Manual Entry */}
      <GlassCard className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Manual Entry</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              id="foodName"
              placeholder="Enter food name"
              value={manualFood.name}
              onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              inputMode="decimal"
              placeholder="1"
              value={manualFood.quantity}
              onChange={(e) => setManualFood({ ...manualFood, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              placeholder="g / serving"
              value={manualFood.unit}
              onChange={(e) => setManualFood({ ...manualFood, unit: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="text"
              inputMode="decimal"
              placeholder="200"
              value={manualFood.calories}
              onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="text"
              inputMode="decimal"
              placeholder="25"
              value={manualFood.protein}
              onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="text"
              inputMode="decimal"
              placeholder="30"
              value={manualFood.carbs}
              onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fats">Fats (g)</Label>
            <Input
              id="fats"
              type="text"
              inputMode="decimal"
              placeholder="10"
              value={manualFood.fats}
              onChange={(e) => setManualFood({ ...manualFood, fats: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-4 w-full touch-manipulation"
          variant="secondary"
          onClick={addManualFood}
          disabled={!manualFood.name}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Food
        </Button>
      </GlassCard>

      {/* Save Button — static on desktop, sticky bottom bar on mobile */}
      <div className="hidden sm:block">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={foods.length === 0 || saving}
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" />Save Meal ({Math.round(totals.calories)} cal)</>
          )}
        </Button>
      </div>

      {/* Mobile sticky save bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-area-inset-bottom">
        <div className="py-3 bg-background/80 backdrop-blur-md border-t border-border/50">
          <Button
            className="w-full touch-manipulation"
            size="lg"
            onClick={handleSave}
            disabled={foods.length === 0 || saving}
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : foods.length === 0 ? (
              "Add food to save"
            ) : (
              <><Check className="mr-2 h-4 w-4" />Save · {Math.round(totals.calories)} cal</>
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}
