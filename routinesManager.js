/**
 * RoutinesManager - Gestion des routines et tâches avec persistance localStorage
 */

class RoutinesManager {
    constructor() {
        this.routines = [];
        this.currentRoutineIndex = 0; // Pour la rotation cyclique
        this.storageKey = 'routines_data';
        this.loadFromStorage();
    }

    /**
     * Génère un ID unique
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Crée une nouvelle tâche
     */
    createTask(libelle, dureeEstimee, secable = true) {
        return {
            id: this.generateId(),
            libelle: libelle,
            dureeEstimee: parseInt(dureeEstimee),
            secable: secable
        };
    }

    /**
     * Crée une nouvelle routine
     */
    createRoutine(nom, taches = []) {
        const ordre = this.routines.length;
        return {
            id: this.generateId(),
            nom: nom,
            ordre: ordre,
            taches: taches
        };
    }

    /**
     * Ajoute une routine
     */
    addRoutine(nom, taches = []) {
        const routine = this.createRoutine(nom, taches);
        this.routines.push(routine);
        this.saveToStorage();
        return routine;
    }

    /**
     * Supprime une routine
     */
    deleteRoutine(routineId) {
        const index = this.routines.findIndex(r => r.id === routineId);
        if (index !== -1) {
            this.routines.splice(index, 1);
            // Réorganiser les ordres
            this.routines.forEach((r, idx) => {
                r.ordre = idx;
            });
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Met à jour une routine
     */
    updateRoutine(routineId, updates) {
        const routine = this.routines.find(r => r.id === routineId);
        if (routine) {
            Object.assign(routine, updates);
            this.saveToStorage();
            return routine;
        }
        return null;
    }

    /**
     * Récupère une routine par ID
     */
    getRoutine(routineId) {
        return this.routines.find(r => r.id === routineId);
    }

    /**
     * Récupère toutes les routines
     */
    getAllRoutines() {
        return [...this.routines].sort((a, b) => a.ordre - b.ordre);
    }

    /**
     * Déplace une routine vers le haut
     */
    moveRoutineUp(routineId) {
        const index = this.routines.findIndex(r => r.id === routineId);
        if (index > 0) {
            // Échanger les ordres
            const temp = this.routines[index - 1].ordre;
            this.routines[index - 1].ordre = this.routines[index].ordre;
            this.routines[index].ordre = temp;

            // Réorganiser le tableau
            this.routines.sort((a, b) => a.ordre - b.ordre);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Déplace une routine vers le bas
     */
    moveRoutineDown(routineId) {
        const index = this.routines.findIndex(r => r.id === routineId);
        if (index < this.routines.length - 1 && index !== -1) {
            // Échanger les ordres
            const temp = this.routines[index + 1].ordre;
            this.routines[index + 1].ordre = this.routines[index].ordre;
            this.routines[index].ordre = temp;

            // Réorganiser le tableau
            this.routines.sort((a, b) => a.ordre - b.ordre);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Ajoute une tâche à une routine
     */
    addTaskToRoutine(routineId, libelle, dureeEstimee, secable = true) {
        const routine = this.getRoutine(routineId);
        if (routine) {
            const task = this.createTask(libelle, dureeEstimee, secable);
            routine.taches.push(task);
            this.saveToStorage();
            return task;
        }
        return null;
    }

    /**
     * Supprime une tâche d'une routine
     */
    deleteTaskFromRoutine(routineId, taskId) {
        const routine = this.getRoutine(routineId);
        if (routine) {
            const index = routine.taches.findIndex(t => t.id === taskId);
            if (index !== -1) {
                routine.taches.splice(index, 1);
                this.saveToStorage();
                return true;
            }
        }
        return false;
    }

    /**
     * Met à jour une tâche
     */
    updateTask(routineId, taskId, updates) {
        const routine = this.getRoutine(routineId);
        if (routine) {
            const task = routine.taches.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                this.saveToStorage();
                return task;
            }
        }
        return null;
    }

    /**
     * Récupère une tâche par ID
     */
    getTask(taskId) {
        for (const routine of this.routines) {
            const task = routine.taches.find(t => t.id === taskId);
            if (task) {
                return { task, routine };
            }
        }
        return null;
    }

    /**
     * Déplace une tâche dans une routine
     */
    moveTask(routineId, taskId, direction) {
        const routine = this.getRoutine(routineId);
        if (!routine) return false;

        const index = routine.taches.findIndex(t => t.id === taskId);
        if (index === -1) return false;

        if (direction === 'up' && index > 0) {
            [routine.taches[index], routine.taches[index - 1]] =
            [routine.taches[index - 1], routine.taches[index]];
            this.saveToStorage();
            return true;
        } else if (direction === 'down' && index < routine.taches.length - 1) {
            [routine.taches[index], routine.taches[index + 1]] =
            [routine.taches[index + 1], routine.taches[index]];
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Récupère toutes les tâches de toutes les routines dans l'ordre
     */
    getAllTasksInOrder() {
        const tasks = [];
        const sortedRoutines = this.getAllRoutines();

        for (const routine of sortedRoutines) {
            for (const task of routine.taches) {
                tasks.push({
                    ...task,
                    routineId: routine.id,
                    routineName: routine.nom
                });
            }
        }
        return tasks;
    }

    /**
     * Récupère la prochaine tâche dans le cycle
     */
    getNextTask() {
        const tasks = this.getAllTasksInOrder();
        if (tasks.length === 0) return null;

        const task = tasks[this.currentRoutineIndex % tasks.length];
        this.currentRoutineIndex++;
        this.saveToStorage();
        return task;
    }

    /**
     * Réinitialise le cycle des tâches
     */
    resetTaskCycle() {
        this.currentRoutineIndex = 0;
        this.saveToStorage();
    }

    /**
     * Sauvegarde dans localStorage
     */
    saveToStorage() {
        try {
            const data = {
                routines: this.routines,
                currentRoutineIndex: this.currentRoutineIndex
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }

    /**
     * Charge depuis localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.routines = parsed.routines || [];
                this.currentRoutineIndex = parsed.currentRoutineIndex || 0;
            } else {
                // Initialiser avec des données d'exemple si vide
                this.initializeDefaultData();
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.initializeDefaultData();
        }
    }

    /**
     * Initialise avec des données d'exemple
     */
    initializeDefaultData() {
        // Routine matinale
        this.addRoutine('Routine Matinale', [
            this.createTask('Méditation', 15, true),
            this.createTask('Exercice physique', 30, true),
            this.createTask('Douche', 15, false),
            this.createTask('Petit déjeuner', 20, true)
        ]);

        // Routine de travail
        this.addRoutine('Routine de Travail', [
            this.createTask('Consultation emails', 30, true),
            this.createTask('Tâche prioritaire', 60, true),
            this.createTask('Pause café', 15, false)
        ]);

        // Routine soirée
        this.addRoutine('Routine Soirée', [
            this.createTask('Dîner', 30, false),
            this.createTask('Lecture', 30, true),
            this.createTask('Préparation lendemain', 15, true)
        ]);
    }

    /**
     * Exporte les données
     */
    exportData() {
        return {
            routines: this.routines,
            currentRoutineIndex: this.currentRoutineIndex,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Importe des données
     */
    importData(data) {
        try {
            if (data.routines) {
                this.routines = data.routines;
                this.currentRoutineIndex = data.currentRoutineIndex || 0;
                this.saveToStorage();
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
        }
        return false;
    }

    /**
     * Réinitialise toutes les données
     */
    reset() {
        this.routines = [];
        this.currentRoutineIndex = 0;
        this.saveToStorage();
    }
}

// Instance globale
const routinesManager = new RoutinesManager();
