/**
 * TaskExecution - Gestion de l'exécution réelle des tâches
 */

class TaskExecution {
    constructor() {
        this.storageKey = 'planning_reel';
        this.currentExecutions = {}; // Tâches en cours d'exécution
    }

    /**
     * Démarre l'exécution d'une tâche
     */
    startTask(tacheId, tacheLibelle) {
        const debutReel = new Date();

        this.currentExecutions[tacheId] = {
            tacheId,
            tacheLibelle,
            debutReel: debutReel.toISOString(),
            status: 'en_cours'
        };

        return this.currentExecutions[tacheId];
    }

    /**
     * Termine l'exécution d'une tâche
     */
    finishTask(tacheId) {
        const execution = this.currentExecutions[tacheId];

        if (!execution) {
            console.error('Aucune tâche en cours avec cet ID');
            return null;
        }

        const finReel = new Date();
        const debutReel = new Date(execution.debutReel);
        const dureeEffectiveMinutes = Math.round((finReel - debutReel) / 1000 / 60);

        const completedExecution = {
            tacheId: execution.tacheId,
            tacheLibelle: execution.tacheLibelle,
            debutReel: execution.debutReel,
            finReel: finReel.toISOString(),
            dureeEffectiveMinutes,
            date: new Date().toISOString().split('T')[0]
        };

        // Enregistrer dans le planning réel
        this.addToRealPlanning(completedExecution);

        // Retirer des exécutions en cours
        delete this.currentExecutions[tacheId];

        return completedExecution;
    }

    /**
     * Vérifie si une tâche est en cours d'exécution
     */
    isTaskRunning(tacheId) {
        return !!this.currentExecutions[tacheId];
    }

    /**
     * Récupère l'exécution en cours d'une tâche
     */
    getCurrentExecution(tacheId) {
        return this.currentExecutions[tacheId];
    }

    /**
     * Récupère toutes les exécutions en cours
     */
    getAllCurrentExecutions() {
        return Object.values(this.currentExecutions);
    }

    /**
     * Annule l'exécution en cours d'une tâche
     */
    cancelTask(tacheId) {
        if (this.currentExecutions[tacheId]) {
            delete this.currentExecutions[tacheId];
            return true;
        }
        return false;
    }

    /**
     * Ajoute une entrée au planning réel
     */
    addToRealPlanning(execution) {
        const planning = this.loadRealPlanning();
        planning.entrees.push(execution);
        this.saveRealPlanning(planning);
    }

    /**
     * Charge le planning réel depuis localStorage
     */
    loadRealPlanning() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du planning réel:', error);
        }

        return {
            entrees: [],
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Sauvegarde le planning réel dans localStorage
     */
    saveRealPlanning(planning) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(planning));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du planning réel:', error);
        }
    }

    /**
     * Récupère les entrées du jour
     */
    getTodayEntries() {
        const planning = this.loadRealPlanning();
        const today = new Date().toISOString().split('T')[0];

        return planning.entrees.filter(e => e.date === today);
    }

    /**
     * Récupère les entrées d'une période
     */
    getEntriesByPeriod(startDate, endDate) {
        const planning = this.loadRealPlanning();
        const start = new Date(startDate);
        const end = new Date(endDate);

        return planning.entrees.filter(e => {
            const date = new Date(e.date);
            return date >= start && date <= end;
        });
    }

    /**
     * Récupère toutes les entrées
     */
    getAllEntries() {
        const planning = this.loadRealPlanning();
        return planning.entrees;
    }

    /**
     * Supprime une entrée du planning réel
     */
    deleteEntry(index) {
        const planning = this.loadRealPlanning();
        if (index >= 0 && index < planning.entrees.length) {
            planning.entrees.splice(index, 1);
            this.saveRealPlanning(planning);
            return true;
        }
        return false;
    }

    /**
     * Met à jour une entrée du planning réel
     */
    updateEntry(index, updates) {
        const planning = this.loadRealPlanning();
        if (index >= 0 && index < planning.entrees.length) {
            Object.assign(planning.entrees[index], updates);
            this.saveRealPlanning(planning);
            return planning.entrees[index];
        }
        return null;
    }

    /**
     * Calcule la durée totale pour une tâche spécifique
     */
    getTotalDurationForTask(tacheId) {
        const planning = this.loadRealPlanning();
        return planning.entrees
            .filter(e => e.tacheId === tacheId)
            .reduce((total, e) => total + e.dureeEffectiveMinutes, 0);
    }

    /**
     * Calcule la durée totale pour une période
     */
    getTotalDurationForPeriod(startDate, endDate) {
        const entries = this.getEntriesByPeriod(startDate, endDate);
        return entries.reduce((total, e) => total + e.dureeEffectiveMinutes, 0);
    }

    /**
     * Récupère les statistiques des tâches
     */
    getTaskStats() {
        const planning = this.loadRealPlanning();
        const stats = {};

        for (const entry of planning.entrees) {
            if (!stats[entry.tacheId]) {
                stats[entry.tacheId] = {
                    tacheId: entry.tacheId,
                    tacheLibelle: entry.tacheLibelle,
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    entries: []
                };
            }

            stats[entry.tacheId].count++;
            stats[entry.tacheId].totalDuration += entry.dureeEffectiveMinutes;
            stats[entry.tacheId].entries.push(entry);
        }

        // Calculer les moyennes
        for (const tacheId in stats) {
            stats[tacheId].avgDuration = Math.round(
                stats[tacheId].totalDuration / stats[tacheId].count
            );
        }

        return Object.values(stats);
    }

    /**
     * Récupère les tâches les plus chronophages
     */
    getMostTimeConsumingTasks(limit = 10) {
        const stats = this.getTaskStats();
        return stats
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, limit);
    }

    /**
     * Calcule le taux d'achèvement (par rapport au planning prévisionnel)
     */
    calculateCompletionRate(planningPrevisionnel) {
        if (!planningPrevisionnel || !planningPrevisionnel.creneaux) return 0;

        const plannedTasks = planningPrevisionnel.creneaux.filter(c => c.type === 'tache');
        const completedTasks = this.getTodayEntries();

        if (plannedTasks.length === 0) return 0;

        // Compter les tâches uniques planifiées
        const plannedTaskIds = new Set(plannedTasks.map(t => t.tacheId));

        // Compter les tâches uniques complétées
        const completedTaskIds = new Set(completedTasks.map(t => t.tacheId));

        // Calculer le pourcentage
        const completedCount = [...plannedTaskIds].filter(id => completedTaskIds.has(id)).length;

        return Math.round((completedCount / plannedTaskIds.size) * 100);
    }

    /**
     * Exporte le planning réel
     */
    exportRealPlanning() {
        return this.loadRealPlanning();
    }

    /**
     * Réinitialise le planning réel
     */
    resetRealPlanning() {
        const planning = {
            entrees: [],
            createdAt: new Date().toISOString()
        };
        this.saveRealPlanning(planning);
        this.currentExecutions = {};
    }

    /**
     * Formate une durée en minutes en HH:MM
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${String(mins).padStart(2, '0')}`;
    }

    /**
     * Formate une date ISO en format lisible
     */
    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formate une heure ISO en HH:MM
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Instance globale
const taskExecution = new TaskExecution();
