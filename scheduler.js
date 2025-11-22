/**
 * Scheduler - Génération du planning prévisionnel
 */

class Scheduler {
    constructor(routinesManager) {
        this.routinesManager = routinesManager;
        this.storageKey = 'planning_previsionnel';
    }

    /**
     * Convertit une heure HH:MM en minutes depuis minuit
     */
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convertit des minutes depuis minuit en HH:MM
     */
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    /**
     * Crée un créneau
     */
    createSlot(debut, fin, type, tacheId = null, tacheLibelle = null, dureeAllouee = null, rdvTitle = null) {
        return {
            debut,
            fin,
            type, // 'rdv' ou 'tache'
            tacheId,
            tacheLibelle,
            dureeAllouee,
            rdvTitle,
            id: this.generateSlotId()
        };
    }

    /**
     * Génère un ID unique pour un créneau
     */
    generateSlotId() {
        return 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Construit les créneaux libres à partir des événements du calendrier
     */
    buildFreeSlots(calendarEvents, startTime = '08:00', endTime = '22:00') {
        const slots = [];
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);

        // Trier les événements par heure de début
        const sortedEvents = [...calendarEvents].sort((a, b) =>
            this.timeToMinutes(a.debut) - this.timeToMinutes(b.debut)
        );

        let currentTime = startMinutes;

        for (const event of sortedEvents) {
            const eventStart = this.timeToMinutes(event.debut);
            const eventEnd = this.timeToMinutes(event.fin);

            // Ajouter un créneau libre si nécessaire
            if (currentTime < eventStart) {
                slots.push(this.createSlot(
                    this.minutesToTime(currentTime),
                    this.minutesToTime(eventStart),
                    'libre',
                    null,
                    null,
                    eventStart - currentTime
                ));
            }

            // Ajouter le créneau RDV
            slots.push(this.createSlot(
                event.debut,
                event.fin,
                'rdv',
                null,
                null,
                null,
                event.titre || 'Rendez-vous'
            ));

            currentTime = Math.max(currentTime, eventEnd);
        }

        // Ajouter le dernier créneau libre si nécessaire
        if (currentTime < endMinutes) {
            slots.push(this.createSlot(
                this.minutesToTime(currentTime),
                this.minutesToTime(endMinutes),
                'libre',
                null,
                null,
                endMinutes - currentTime
            ));
        }

        return slots;
    }

    /**
     * Remplit les créneaux libres avec les tâches
     */
    fillSlotsWithTasks(freeSlots) {
        const planning = [];
        const tasks = [...this.routinesManager.getAllTasksInOrder()];
        let taskIndex = 0;
        const taskQueue = []; // Pour gérer les tâches partiellement placées

        for (const slot of freeSlots) {
            if (slot.type === 'rdv') {
                planning.push(slot);
                continue;
            }

            let slotRemainingTime = slot.dureeAllouee;
            let slotStart = this.timeToMinutes(slot.debut);

            while (slotRemainingTime > 0) {
                // Récupérer la prochaine tâche (ou fragment)
                let currentTask;
                let taskDuration;

                if (taskQueue.length > 0) {
                    // Il y a une tâche partiellement placée
                    const fragment = taskQueue.shift();
                    currentTask = fragment.task;
                    taskDuration = fragment.dureeRestante;
                } else if (taskIndex < tasks.length) {
                    // Prendre la prochaine tâche dans la liste
                    currentTask = tasks[taskIndex];
                    taskDuration = currentTask.dureeEstimee;
                    taskIndex++;
                } else {
                    // Plus de tâches disponibles, répéter depuis le début
                    taskIndex = 0;
                    if (tasks.length === 0) break;
                    currentTask = tasks[taskIndex];
                    taskDuration = currentTask.dureeEstimee;
                    taskIndex++;
                }

                // Vérifier si la tâche tient dans le créneau
                if (taskDuration <= slotRemainingTime) {
                    // La tâche tient complètement
                    planning.push(this.createSlot(
                        this.minutesToTime(slotStart),
                        this.minutesToTime(slotStart + taskDuration),
                        'tache',
                        currentTask.id,
                        currentTask.libelle,
                        taskDuration
                    ));

                    slotStart += taskDuration;
                    slotRemainingTime -= taskDuration;
                } else if (currentTask.secable) {
                    // La tâche est sécable, on place ce qui rentre
                    planning.push(this.createSlot(
                        this.minutesToTime(slotStart),
                        this.minutesToTime(slotStart + slotRemainingTime),
                        'tache',
                        currentTask.id,
                        currentTask.libelle + ' (partie)',
                        slotRemainingTime
                    ));

                    // Mettre le reste dans la queue
                    taskQueue.push({
                        task: currentTask,
                        dureeRestante: taskDuration - slotRemainingTime
                    });

                    slotStart += slotRemainingTime;
                    slotRemainingTime = 0;
                } else {
                    // Tâche non sécable qui ne rentre pas, on remet dans la queue
                    taskQueue.push({
                        task: currentTask,
                        dureeRestante: taskDuration
                    });
                    break; // Passer au prochain créneau
                }
            }
        }

        return planning;
    }

    /**
     * Génère le planning complet pour la journée
     */
    generateDailyPlanning(calendarEvents = [], startTime = '08:00', endTime = '22:00') {
        // Réinitialiser le cycle des tâches
        this.routinesManager.resetTaskCycle();

        // Construire les créneaux libres
        const freeSlots = this.buildFreeSlots(calendarEvents, startTime, endTime);

        // Remplir avec les tâches
        const planning = this.fillSlotsWithTasks(freeSlots);

        // Sauvegarder le planning
        const dailyPlanning = {
            date: new Date().toISOString().split('T')[0],
            creneaux: planning,
            generatedAt: new Date().toISOString()
        };

        this.savePlanning(dailyPlanning);
        return dailyPlanning;
    }

    /**
     * Génère un planning pour une journée vide (sans RDV)
     */
    generateEmptyDayPlanning(startTime = '08:00', endTime = '22:00') {
        return this.generateDailyPlanning([], startTime, endTime);
    }

    /**
     * Sauvegarde le planning dans localStorage
     */
    savePlanning(planning) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(planning));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du planning:', error);
        }
    }

    /**
     * Charge le planning depuis localStorage
     */
    loadPlanning() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur lors du chargement du planning:', error);
            return null;
        }
    }

    /**
     * Récupère le planning du jour
     */
    getTodayPlanning() {
        const planning = this.loadPlanning();
        if (planning) {
            const today = new Date().toISOString().split('T')[0];
            if (planning.date === today) {
                return planning;
            }
        }
        return null;
    }

    /**
     * Calcule la durée totale des tâches planifiées
     */
    calculateTotalTaskDuration(planning) {
        if (!planning || !planning.creneaux) return 0;

        return planning.creneaux
            .filter(c => c.type === 'tache')
            .reduce((total, c) => total + c.dureeAllouee, 0);
    }

    /**
     * Récupère les statistiques du planning
     */
    getPlanningStats(planning) {
        if (!planning || !planning.creneaux) {
            return {
                totalTasks: 0,
                totalRdv: 0,
                totalTaskTime: 0,
                totalRdvTime: 0,
                totalFreeTime: 0
            };
        }

        const tasks = planning.creneaux.filter(c => c.type === 'tache');
        const rdvs = planning.creneaux.filter(c => c.type === 'rdv');

        return {
            totalTasks: tasks.length,
            totalRdv: rdvs.length,
            totalTaskTime: tasks.reduce((sum, t) => sum + t.dureeAllouee, 0),
            totalRdvTime: rdvs.reduce((sum, r) => sum + (this.timeToMinutes(r.fin) - this.timeToMinutes(r.debut)), 0),
            uniqueTasks: new Set(tasks.map(t => t.tacheId)).size
        };
    }

    /**
     * Exporte le planning
     */
    exportPlanning() {
        return this.loadPlanning();
    }

    /**
     * Réinitialise le planning
     */
    resetPlanning() {
        localStorage.removeItem(this.storageKey);
    }
}

// Instance globale
const scheduler = new Scheduler(routinesManager);
