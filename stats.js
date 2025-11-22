/**
 * Stats - Calculs statistiques
 */

class Stats {
    constructor(routinesManager, taskExecution, scheduler) {
        this.routinesManager = routinesManager;
        this.taskExecution = taskExecution;
        this.scheduler = scheduler;
    }

    /**
     * Récupère les statistiques par routine
     */
    getStatsByRoutine(period = 'all') {
        const entries = this.getEntriesForPeriod(period);
        const routines = this.routinesManager.getAllRoutines();
        const stats = [];

        for (const routine of routines) {
            const routineEntries = entries.filter(e => {
                const taskInfo = this.routinesManager.getTask(e.tacheId);
                return taskInfo && taskInfo.routine.id === routine.id;
            });

            const totalDuration = routineEntries.reduce((sum, e) => sum + e.dureeEffectiveMinutes, 0);
            const count = routineEntries.length;

            stats.push({
                routineId: routine.id,
                routineName: routine.nom,
                count,
                totalDuration,
                avgDuration: count > 0 ? Math.round(totalDuration / count) : 0,
                entries: routineEntries
            });
        }

        return stats.sort((a, b) => b.totalDuration - a.totalDuration);
    }

    /**
     * Récupère les statistiques par tâche
     */
    getStatsByTask(period = 'all') {
        const entries = this.getEntriesForPeriod(period);
        const tasksMap = new Map();

        for (const entry of entries) {
            if (!tasksMap.has(entry.tacheId)) {
                tasksMap.set(entry.tacheId, {
                    tacheId: entry.tacheId,
                    tacheLibelle: entry.tacheLibelle,
                    count: 0,
                    totalDuration: 0,
                    minDuration: Infinity,
                    maxDuration: 0,
                    durations: []
                });
            }

            const stat = tasksMap.get(entry.tacheId);
            stat.count++;
            stat.totalDuration += entry.dureeEffectiveMinutes;
            stat.durations.push(entry.dureeEffectiveMinutes);
            stat.minDuration = Math.min(stat.minDuration, entry.dureeEffectiveMinutes);
            stat.maxDuration = Math.max(stat.maxDuration, entry.dureeEffectiveMinutes);
        }

        // Calculer les moyennes
        const stats = Array.from(tasksMap.values()).map(stat => ({
            ...stat,
            avgDuration: Math.round(stat.totalDuration / stat.count),
            medianDuration: this.calculateMedian(stat.durations)
        }));

        return stats.sort((a, b) => b.totalDuration - a.totalDuration);
    }

    /**
     * Compare le planning prévisionnel avec le planning réel
     */
    comparePrevisionnelVsReel(period = 'today') {
        const planningPrev = this.scheduler.getTodayPlanning();
        const entries = this.getEntriesForPeriod(period);

        if (!planningPrev) {
            return {
                hasPrevisionnel: false,
                comparisons: []
            };
        }

        const comparisons = [];
        const plannedTasks = planningPrev.creneaux.filter(c => c.type === 'tache');

        // Grouper les tâches prévues par ID
        const plannedByTask = new Map();
        for (const task of plannedTasks) {
            if (!plannedByTask.has(task.tacheId)) {
                plannedByTask.set(task.tacheId, {
                    tacheId: task.tacheId,
                    tacheLibelle: task.tacheLibelle,
                    dureePrevue: 0,
                    occurrences: 0
                });
            }
            const stat = plannedByTask.get(task.tacheId);
            stat.dureePrevue += task.dureeAllouee;
            stat.occurrences++;
        }

        // Grouper les tâches réelles par ID
        const realByTask = new Map();
        for (const entry of entries) {
            if (!realByTask.has(entry.tacheId)) {
                realByTask.set(entry.tacheId, {
                    tacheId: entry.tacheId,
                    tacheLibelle: entry.tacheLibelle,
                    dureeReelle: 0,
                    occurrences: 0
                });
            }
            const stat = realByTask.get(entry.tacheId);
            stat.dureeReelle += entry.dureeEffectiveMinutes;
            stat.occurrences++;
        }

        // Créer les comparaisons
        const allTaskIds = new Set([...plannedByTask.keys(), ...realByTask.keys()]);

        for (const tacheId of allTaskIds) {
            const planned = plannedByTask.get(tacheId) || { dureePrevue: 0, occurrences: 0, tacheLibelle: '' };
            const real = realByTask.get(tacheId) || { dureeReelle: 0, occurrences: 0, tacheLibelle: '' };

            const tacheLibelle = planned.tacheLibelle || real.tacheLibelle;
            const difference = real.dureeReelle - planned.dureePrevue;
            const percentDiff = planned.dureePrevue > 0
                ? Math.round((difference / planned.dureePrevue) * 100)
                : 0;

            comparisons.push({
                tacheId,
                tacheLibelle,
                dureePrevue: planned.dureePrevue,
                dureeReelle: real.dureeReelle,
                difference,
                percentDiff,
                status: difference > 0 ? 'depassement' : difference < 0 ? 'economie' : 'conforme'
            });
        }

        return {
            hasPrevisionnel: true,
            totalPrevue: Array.from(plannedByTask.values()).reduce((sum, t) => sum + t.dureePrevue, 0),
            totalReelle: Array.from(realByTask.values()).reduce((sum, t) => sum + t.dureeReelle, 0),
            comparisons: comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
        };
    }

    /**
     * Récupère les tâches les plus chronophages
     */
    getMostTimeConsumingTasks(period = 'all', limit = 10) {
        const stats = this.getStatsByTask(period);
        return stats.slice(0, limit);
    }

    /**
     * Calcule le taux d'interruption
     */
    calculateInterruptionRate(period = 'today') {
        const planningPrev = this.scheduler.getTodayPlanning();
        const entries = this.getEntriesForPeriod(period);

        if (!planningPrev || planningPrev.creneaux.length === 0) {
            return {
                hasData: false,
                rate: 0
            };
        }

        const plannedTasks = planningPrev.creneaux.filter(c => c.type === 'tache');
        const plannedTaskIds = new Set(plannedTasks.map(t => t.tacheId));
        const completedTaskIds = new Set(entries.map(e => e.tacheId));

        const plannedCount = plannedTaskIds.size;
        const completedCount = [...plannedTaskIds].filter(id => completedTaskIds.has(id)).length;
        const interruptedCount = plannedCount - completedCount;

        return {
            hasData: true,
            plannedCount,
            completedCount,
            interruptedCount,
            rate: plannedCount > 0 ? Math.round((interruptedCount / plannedCount) * 100) : 0
        };
    }

    /**
     * Récupère les statistiques globales
     */
    getGlobalStats(period = 'all') {
        const entries = this.getEntriesForPeriod(period);

        if (entries.length === 0) {
            return {
                hasData: false,
                totalEntries: 0,
                totalDuration: 0,
                uniqueTasks: 0,
                avgDurationPerTask: 0,
                mostProductiveDay: null,
                totalDays: 0
            };
        }

        const totalDuration = entries.reduce((sum, e) => sum + e.dureeEffectiveMinutes, 0);
        const uniqueTasks = new Set(entries.map(e => e.tacheId)).size;

        // Grouper par jour
        const byDay = new Map();
        for (const entry of entries) {
            const day = entry.date;
            if (!byDay.has(day)) {
                byDay.set(day, { date: day, entries: [], totalDuration: 0 });
            }
            const dayData = byDay.get(day);
            dayData.entries.push(entry);
            dayData.totalDuration += entry.dureeEffectiveMinutes;
        }

        // Trouver le jour le plus productif
        let mostProductiveDay = null;
        let maxDuration = 0;
        for (const [day, data] of byDay) {
            if (data.totalDuration > maxDuration) {
                maxDuration = data.totalDuration;
                mostProductiveDay = {
                    date: day,
                    totalDuration: data.totalDuration,
                    taskCount: data.entries.length
                };
            }
        }

        return {
            hasData: true,
            totalEntries: entries.length,
            totalDuration,
            uniqueTasks,
            avgDurationPerTask: Math.round(totalDuration / entries.length),
            mostProductiveDay,
            totalDays: byDay.size,
            avgDurationPerDay: Math.round(totalDuration / byDay.size)
        };
    }

    /**
     * Récupère les entrées pour une période donnée
     */
    getEntriesForPeriod(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                return this.taskExecution.getTodayEntries();

            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi
                return this.taskExecution.getEntriesByPeriod(
                    weekStart.toISOString().split('T')[0],
                    now.toISOString().split('T')[0]
                );

            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return this.taskExecution.getEntriesByPeriod(
                    monthStart.toISOString().split('T')[0],
                    now.toISOString().split('T')[0]
                );

            case 'all':
            default:
                return this.taskExecution.getAllEntries();
        }
    }

    /**
     * Calcule la médiane d'un tableau de nombres
     */
    calculateMedian(numbers) {
        if (numbers.length === 0) return 0;

        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
        }
        return sorted[mid];
    }

    /**
     * Formate une durée en minutes en format lisible
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours === 0) {
            return `${mins}min`;
        } else if (mins === 0) {
            return `${hours}h`;
        }
        return `${hours}h${String(mins).padStart(2, '0')}`;
    }

    /**
     * Génère un rapport statistique complet
     */
    generateReport(period = 'all') {
        return {
            period,
            globalStats: this.getGlobalStats(period),
            byRoutine: this.getStatsByRoutine(period),
            byTask: this.getStatsByTask(period),
            comparison: this.comparePrevisionnelVsReel(period),
            mostTimeConsuming: this.getMostTimeConsumingTasks(period, 10),
            interruptionRate: this.calculateInterruptionRate(period),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Exporte les statistiques
     */
    exportStats(period = 'all') {
        return this.generateReport(period);
    }
}

// Instance globale
const stats = new Stats(routinesManager, taskExecution, scheduler);
