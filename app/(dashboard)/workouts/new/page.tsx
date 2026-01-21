"use client"

import { useState } from "react"
import { ArrowLeft, Plus, X, Dumbbell, Timer, Play, Bookmark, Activity } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExerciseLibrary, CardioLogger } from "@/components/workouts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { workoutsApi } from "@/lib/api"
import { useActiveWorkoutStore } from "@/lib/store"

// Workout templates
const templates = [
  {
    id: "push",
    title: "Push Day",
    description: "Chest, Shoulders, Triceps",
    exercises: 5,
    duration: "45-60 min",
    muscles: ["Chest", "Shoulders", "Triceps"],
    lastUsed: "3 days ago",
  },
  {
    id: "pull",
    title: "Pull Day",
    description: "Back, Biceps, Rear Delts",
    exercises: 6,
    duration: "45-60 min",
    muscles: ["Back", "Biceps", "Shoulders"],
    lastUsed: "2 days ago",
  },
  {
    id: "legs",
    title: "Leg Day",
    description: "Quads, Hamstrings, Glutes, Calves",
    exercises: 6,
    duration: "50-65 min",
    muscles: ["Legs"],
    lastUsed: "4 days ago",
  },
  {
    id: "upper",
    title: "Upper Body",
    description: "Full upper body workout",
    exercises: 8,
    duration: "55-70 min",
    muscles: ["Chest", "Back", "Shoulders", "Arms"],
    lastUsed: "1 week ago",
  },
  {
    id: "lower",
    title: "Lower Body",
    description: "Complete leg workout",
    exercises: 7,
    duration: "50-65 min",
    muscles: ["Legs", "Glutes"],
    lastUsed: "1 week ago",
  },
  {
    id: "fullbody",
    title: "Full Body",
    description: "Hit all major muscle groups",
    exercises: 8,
    duration: "60-75 min",
    muscles: ["Full Body"],
    lastUsed: "2 weeks ago",
  },
]

const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
  "Full Body",
]

interface Exercise {
  id: string
  name: string
  sets: number
  muscleGroup: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const startWorkoutStore = useActiveWorkoutStore((state) => state.startWorkout)
  const [workoutType, setWorkoutType] = useState("strength")
  const [title, setTitle] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState("Chest")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)

  const addExercise = (exercise: { id: string; name: string; muscleGroup: string }) => {
    if (!exercises.find((e) => e.id === exercise.id)) {
      setExercises([
        ...exercises,
        { ...exercise, sets: 3 },
      ])
    }
    setShowExerciseLibrary(false)
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id))
  }

  const updateSets = (id: string, sets: number) => {
    setExercises(exercises.map((e) =>
      e.id === id ? { ...e, sets: Math.max(1, sets) } : e
    ))
  }

  const startWorkout = () => {
    const workoutTitle = title || `${selectedMuscle} Workout`

    // Start workout in store with exercises
    startWorkoutStore(
      workoutTitle,
      exercises.map((ex) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        targetSets: ex.sets,
      }))
    )

    router.push("/workouts/active")
  }

  const startTemplate = (templateId: string) => {
    router.push(`/workouts/active?template=${templateId}`)
  }

  const handleCardioSave = async (data: {
    type: string
    duration: number
    distance?: number
    calories?: number
    avgHeartRate?: number
    notes?: string
  }) => {
    try {
      await workoutsApi.logCardio({
        cardio_type: data.type,
        duration_minutes: Math.round(data.duration / 60),
        distance_km: data.distance,
        avg_heart_rate: data.avgHeartRate,
        calories_burned: data.calories,
        notes: data.notes,
      })
      router.push("/workouts")
    } catch (error) {
      console.error("Failed to save cardio session:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Workout</h1>
          <p className="text-muted-foreground">Create or start a workout</p>
        </div>
      </div>

      {/* Workout Type */}
      <Tabs value={workoutType} onValueChange={setWorkoutType}>
        <TabsList className="w-full">
          <TabsTrigger value="strength" className="flex-1">
            <Dumbbell className="mr-2 h-4 w-4" />
            Strength
          </TabsTrigger>
          <TabsTrigger value="cardio" className="flex-1">
            <Activity className="mr-2 h-4 w-4" />
            Cardio
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">
            <Bookmark className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Strength Training */}
        <TabsContent value="strength" className="space-y-6 mt-6">
          {/* Workout Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Workout Name</Label>
            <Input
              id="title"
              placeholder="e.g., Push Day, Leg Day..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Muscle Group Selector */}
          <div>
            <Label className="mb-3 block">Primary Muscle Group</Label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((muscle) => (
                <Button
                  key={muscle}
                  variant={selectedMuscle === muscle ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMuscle(muscle)}
                >
                  {muscle}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Exercises Button */}
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => setShowExerciseLibrary(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Exercises from Library
          </Button>

          {/* Selected Exercises */}
          {exercises.length > 0 && (
            <div>
              <Label className="mb-3 block">
                Selected Exercises ({exercises.length})
              </Label>
              <div className="space-y-2">
                {exercises.map((exercise, index) => (
                  <GlassCard key={exercise.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.muscleGroup}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSets(exercise.id, exercise.sets - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{exercise.sets}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSets(exercise.id, exercise.sets + 1)}
                          >
                            +
                          </Button>
                          <span className="text-sm text-muted-foreground">sets</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeExercise(exercise.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Duration */}
          {exercises.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated Duration</span>
              </div>
              <span className="font-medium">
                {Math.round(exercises.reduce((acc, e) => acc + e.sets * 3, 0))} - {Math.round(exercises.reduce((acc, e) => acc + e.sets * 4, 0))} min
              </span>
            </div>
          )}

          {/* Start Workout Button */}
          <Button
            className="w-full h-14 text-lg"
            onClick={startWorkout}
          >
            <Play className="mr-2 h-5 w-5" />
            {exercises.length === 0 ? "Start Empty Workout" : "Start Workout"}
          </Button>
        </TabsContent>

        {/* Cardio */}
        <TabsContent value="cardio" className="mt-6">
          <CardioLogger
            onSave={handleCardioSave}
            onCancel={() => router.push("/workouts")}
          />
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6 mt-6">
          <div>
            <h2 className="font-semibold mb-4">Your Templates</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <GlassCard
                  key={template.id}
                  className="p-4 cursor-pointer transition-all hover:bg-white/[0.07] hover:-translate-y-1"
                  onClick={() => startTemplate(template.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{template.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.muscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {template.exercises} exercises • {template.duration}
                    </span>
                    <Play className="h-4 w-4 text-primary" />
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Last used: {template.lastUsed}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Create New Template */}
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        </TabsContent>
      </Tabs>

      {/* Exercise Library Dialog */}
      <Dialog open={showExerciseLibrary} onOpenChange={setShowExerciseLibrary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Exercises</DialogTitle>
          </DialogHeader>
          <ExerciseLibrary
            onSelectExercise={(exercise) => addExercise({
              id: exercise.id,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
            })}
            selectedExercises={exercises.map((e) => e.id)}
            className="border-0 shadow-none p-0"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
