"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import html2canvas from "html2canvas"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Flame,
  Target,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Share2,
  Loader2,
  Download,
  Plus,
} from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { workoutsApi } from "@/lib/api"
import { ShareableWorkoutCard } from "@/components/workouts/ShareableWorkoutCard"
import { ExerciseLibrary } from "@/components/workouts"
import type { Workout, Exercise } from "@/types"

const muscleGroupColors: Record<string, string> = {
  Chest: "bg-red-500/10 text-red-500",
  Back: "bg-blue-500/10 text-blue-500",
  Shoulders: "bg-orange-500/10 text-orange-500",
  Biceps: "bg-purple-500/10 text-purple-500",
  Triceps: "bg-pink-500/10 text-pink-500",
  Legs: "bg-green-500/10 text-green-500",
  Glutes: "bg-emerald-500/10 text-emerald-500",
  Core: "bg-amber-500/10 text-amber-500",
}

export default function WorkoutHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())

  // Workout meta edit
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: "", notes: "" })
  const [savingEdit, setSavingEdit] = useState(false)

  // Share
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)

  // Set edit
  const [editSetDialogOpen, setEditSetDialogOpen] = useState(false)
  const [editSetForm, setEditSetForm] = useState({ id: 0, weight: "", reps: "" })
  const [savingSet, setSavingSet] = useState(false)

  // Exercise management — two-step: pick → log sets
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [pendingExercise, setPendingExercise] = useState<{ name: string; muscleGroup: string } | null>(null)
  const [logSetsOpen, setLogSetsOpen] = useState(false)
  const [setRows, setSetRows] = useState<Array<{ weight: string; reps: string }>>([
    { weight: "", reps: "" },
  ])
  const [savingExercise, setSavingExercise] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState<number | null>(null)

  useEffect(() => {
    fetchWorkout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchWorkout() {
    try {
      const res = await workoutsApi.getById(id)
      if (res.workout) {
        setWorkout(res.workout)
        if (res.workout.exercises) {
          setExpandedExercises(new Set(res.workout.exercises.map((e: Exercise) => e.id)))
        }
      }
    } catch (error) {
      console.error("Failed to fetch workout:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExercise = (exerciseId: number) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) next.delete(exerciseId)
      else next.add(exerciseId)
      return next
    })
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateTotalStats = () => {
    if (!workout?.exercises) return { totalSets: 0, totalReps: 0 }
    let totalSets = 0
    let totalReps = 0
    workout.exercises.forEach((ex) => {
      if (ex.sets) {
        totalSets += ex.sets.length
        ex.sets.forEach((set) => { totalReps += set.reps || 0 })
      }
    })
    return { totalSets, totalReps }
  }

  const getMuscleGroups = () => {
    if (!workout?.exercises) return []
    const groups = new Set(workout.exercises.map((e) => e.muscle_group).filter(Boolean))
    return Array.from(groups) as string[]
  }

  const canEdit = (() => {
    if (!workout) return false
    return new Date(workout.date).toDateString() === new Date().toDateString()
  })()

  // ── Workout meta ──────────────────────────────────────────────────────────

  const handleSaveWorkoutEdit = async () => {
    if (!workout) return
    setSavingEdit(true)
    try {
      await workoutsApi.updateWorkout(workout.id, {
        title: editForm.title,
        notes: editForm.notes || undefined,
      })
      await fetchWorkout()
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Failed to update workout:", error)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteWorkout = async () => {
    if (!workout) return
    if (!confirm("Delete this workout? This cannot be undone.")) return
    try {
      await workoutsApi.deleteWorkout(workout.id)
      router.push("/workouts")
    } catch (error) {
      console.error("Failed to delete workout:", error)
    }
  }

  // ── Exercise management ───────────────────────────────────────────────────

  // Step 1: user picks an exercise from the library → move to set-logging dialog
  const handlePickExercise = (exerciseData: { id: string; name: string; muscleGroup: string }) => {
    setPendingExercise({ name: exerciseData.name, muscleGroup: exerciseData.muscleGroup })
    setSetRows([{ weight: "", reps: "" }])
    setAddExerciseOpen(false)
    setLogSetsOpen(true)
  }

  // Step 2: user fills in sets → save
  const handleConfirmAddExercise = async () => {
    if (!workout || !pendingExercise) return
    const validSets = setRows.filter((r) => r.reps && r.weight)
    if (validSets.length === 0) return
    setSavingExercise(true)
    try {
      await workoutsApi.addExercise(workout.id, {
        exercise_name: pendingExercise.name,
        muscle_group: pendingExercise.muscleGroup,
        sets: validSets.map((r) => ({
          weight_kg: parseFloat(r.weight),
          reps: parseInt(r.reps),
        })),
      })
      await fetchWorkout()
      setLogSetsOpen(false)
      setPendingExercise(null)
    } catch (error) {
      console.error("Failed to add exercise:", error)
    } finally {
      setSavingExercise(false)
    }
  }

  const addSetRow = () => setSetRows((prev) => [...prev, { weight: "", reps: "" }])
  const removeSetRow = (i: number) => setSetRows((prev) => prev.filter((_, idx) => idx !== i))
  const updateSetRow = (i: number, field: "weight" | "reps", value: string) =>
    setSetRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm("Remove this exercise and all its sets from this workout?")) return
    setDeletingExerciseId(exerciseId)
    try {
      await workoutsApi.deleteExercise(exerciseId)
      await fetchWorkout()
    } catch (error) {
      console.error("Failed to delete exercise:", error)
    } finally {
      setDeletingExerciseId(null)
    }
  }

  // ── Set management ────────────────────────────────────────────────────────

  const handleEditSet = (setId: number, weight: number, reps: number) => {
    setEditSetForm({
      id: setId,
      weight: weight.toString(),
      reps: reps.toString()    })
    setEditSetDialogOpen(true)
  }

  const handleSaveSetEdit = async () => {
    if (!editSetForm.reps || !editSetForm.weight) return
    setSavingSet(true)
    try {
      await workoutsApi.updateSet(editSetForm.id, {
        reps: parseInt(editSetForm.reps),
        weight_kg: parseFloat(editSetForm.weight),
      })
      await fetchWorkout()
      setEditSetDialogOpen(false)
    } catch (error) {
      console.error("Failed to update set:", error)
    } finally {
      setSavingSet(false)
    }
  }

  const handleDeleteSet = async (setId: number) => {
    if (!confirm("Delete this set?")) return
    try {
      await workoutsApi.deleteSet(setId)
      await fetchWorkout()
    } catch (error) {
      console.error("Failed to delete set:", error)
    }
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!workout) return
    setGeneratingImage(true)
    setShareDialogOpen(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const element = document.getElementById("shareable-workout-card")
      if (!element) return

      const canvas = await html2canvas(element, { backgroundColor: null, scale: 2, logging: false })

      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `workout-${workout.title.replace(/\s+/g, "-")}.png`, { type: "image/png" })

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `My ${workout.title}`, text: `Check out my workout: ${workout.title}` })
            setShareDialogOpen(false)
          } catch (error) {
            if ((error as Error).name !== "AbortError") downloadImage(canvas)
          }
        } else {
          downloadImage(canvas)
        }
      }, "image/png")
    } catch (error) {
      console.error("Failed to generate image:", error)
    } finally {
      setGeneratingImage(false)
    }
  }

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `workout-${workout?.title.replace(/\s+/g, "-")}.png`
    link.href = url
    link.click()
    setShareDialogOpen(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Workout not found</p>
          <Link href="/workouts">
            <Button variant="outline" className="mt-4">Back to Workouts</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { totalSets, totalReps } = calculateTotalStats()
  const muscleGroups = getMuscleGroups()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{workout.title}</h1>
              {canEdit && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                  Editable
                </span>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatFullDate(workout.date)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuItem onClick={() => router.push("/workouts/new")}>
              <Copy className="h-4 w-4 mr-2" />
              Repeat Workout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEditForm({ title: workout.title, notes: workout.notes || "" })
              setEditDialogOpen(true)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Title / Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleDeleteWorkout}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Duration</span>
          </div>
          <p className="text-xl font-bold">{workout.duration_minutes || 0} min</p>
          <p className="text-xs text-muted-foreground capitalize">{workout.workout_type}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Dumbbell className="h-4 w-4" />
            <span className="text-xs">Volume</span>
          </div>
          <p className="text-xl font-bold">NA</p>
          <p className="text-xs text-muted-foreground">{totalSets} sets {totalReps} reps</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Calories</span>
          </div>
          <p className="text-xl font-bold">NA</p>
          <p className="text-xs text-muted-foreground">kcal burned</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Exercises</span>
          </div>
          <p className="text-xl font-bold">{workout.exercises?.length || 0}</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </GlassCard>
      </div>

      {/* Muscle Groups */}
      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((muscle) => (
            <span
              key={muscle}
              className={cn("px-3 py-1 rounded-full text-sm font-medium", muscleGroupColors[muscle] || "bg-secondary")}
            >
              {muscle}
            </span>
          ))}
        </div>
      )}

      {/* Workout Notes */}
      {workout.notes && (
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Notes</p>
          <p>{workout.notes}</p>
        </GlassCard>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Exercises ({workout.exercises?.length || 0})
          </h2>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setAddExerciseOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          )}
        </div>

        {workout.exercises && workout.exercises.length > 0 ? (
          workout.exercises.map((exercise, index) => {
            const isExpanded = expandedExercises.has(exercise.id)
            const isDeleting = deletingExerciseId === exercise.id

            return (
              <GlassCard key={exercise.id} className="overflow-hidden">
                {/* Exercise Header */}
                <div className="flex items-center">
                  <button
                    className="flex-1 p-4 flex items-center justify-between text-left"
                    onClick={() => toggleExercise(exercise.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{exercise.exercise_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets?.length || exercise.sets_completed || 0} sets
                          {exercise.muscle_group ? ` · ${exercise.muscle_group}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                      {isExpanded
                        ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Delete exercise button (same-day only) */}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 mr-2 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDeleteExercise(exercise.id)}
                      disabled={isDeleting}
                      title="Remove exercise"
                    >
                      {isDeleting
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {/* Exercise Details — sets table */}
                {isExpanded && exercise.sets && exercise.sets.length > 0 && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="bg-secondary/30 rounded-lg overflow-hidden">
                      <div className={cn(
                        "grid gap-2 p-2 text-xs text-muted-foreground font-medium border-b border-border/50",
                        canEdit ? "grid-cols-5" : "grid-cols-4"
                      )}>
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        {canEdit && <span className="text-right">Actions</span>}
                      </div>
                      {exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className={cn(
                            "grid gap-2 p-2 text-sm items-center",
                            canEdit ? "grid-cols-5" : "grid-cols-4"
                          )}
                        >
                          <span className="font-medium">{set.set_number}</span>
                          <span>{set.weight_kg} kg</span>
                          <span>{set.reps}</span>
                          {canEdit && (
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditSet(set.id, set.weight_kg, set.reps)}
                                title="Edit set"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteSet(set.id)}
                                title="Delete set"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground italic p-2 bg-secondary/20 rounded-lg">
                        &ldquo;{exercise.notes}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded but no sets recorded */}
                {isExpanded && (!exercise.sets || exercise.sets.length === 0) && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground text-center py-3">No sets recorded for this exercise</p>
                  </div>
                )}
              </GlassCard>
            )
          })
        ) : (
          <GlassCard className="p-8">
            <div className="flex flex-col items-center justify-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No exercise details recorded</p>
              {canEdit && (
                <Button size="sm" onClick={() => setAddExerciseOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12" onClick={() => router.push("/workouts/new")}>
          <Copy className="h-4 w-4 mr-2" />
          Repeat Workout
        </Button>
        <Button className="h-12" onClick={() => router.push("/workouts")}>
          <Dumbbell className="h-4 w-4 mr-2" />
          View All Workouts
        </Button>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}

      {/* Add Exercise Dialog */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
          </DialogHeader>
          <ExerciseLibrary
            onSelectExercise={handlePickExercise}
            className="border-0 shadow-none p-0"
          />
        </DialogContent>
      </Dialog>

      {/* Log Sets Dialog (step 2 of add exercise) */}
      <Dialog open={logSetsOpen} onOpenChange={(open) => { if (!open) { setLogSetsOpen(false); setPendingExercise(null) } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{pendingExercise?.name}</DialogTitle>
            {pendingExercise?.muscleGroup && (
              <p className="text-sm text-muted-foreground mt-0.5">{pendingExercise.muscleGroup}</p>
            )}
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs text-muted-foreground font-medium px-1">
              <span>#</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span />
            </div>

            {/* Set rows */}
            {setRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center">
                <span className="text-sm font-medium text-muted-foreground text-center">{i + 1}</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={row.weight}
                  onChange={(e) => updateSetRow(i, "weight", e.target.value)}
                  className="h-10 text-center"
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={row.reps}
                  onChange={(e) => updateSetRow(i, "reps", e.target.value)}
                  className="h-10 text-center"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSetRow(i)}
                  disabled={setRows.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* Add set row */}
            <Button variant="outline" size="sm" className="w-full" onClick={addSetRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Set
            </Button>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setLogSetsOpen(false); setPendingExercise(null) }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAddExercise}
              disabled={savingExercise || setRows.every((r) => !r.reps || !r.weight)}
            >
              {savingExercise ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add to Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workout Meta Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Input
                id="editNotes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkoutEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Set Dialog */}
      <Dialog open={editSetDialogOpen} onOpenChange={setEditSetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Set</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSetWeight">Weight (kg)</Label>
              <Input
                id="editSetWeight"
                type="number"
                step="0.5"
                value={editSetForm.weight}
                onChange={(e) => setEditSetForm({ ...editSetForm, weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSetReps">Reps</Label>
              <Input
                id="editSetReps"
                type="number"
                value={editSetForm.reps}
                onChange={(e) => setEditSetForm({ ...editSetForm, reps: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSetEdit} disabled={savingSet || !editSetForm.weight || !editSetForm.reps}>
              {savingSet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Share Workout</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {workout && (
              <div className="overflow-hidden rounded-2xl">
                <ShareableWorkoutCard
                  workout={workout}
                  totalSets={calculateTotalStats().totalSets}
                  totalReps={calculateTotalStats().totalReps}
                />
              </div>
            )}
            {generatingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating image...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button
              className="cursor-pointer"
              onClick={async () => {
                if (!workout) return
                const element = document.getElementById("shareable-workout-card")
                if (!element) return
                const canvas = await html2canvas(element, { backgroundColor: null, scale: 2, logging: false })
                downloadImage(canvas)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
