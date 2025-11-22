/**
 * App - Orchestration principale de l'application
 */

class App {
    constructor() {
        this.currentView = 'routines';
        this.currentRoutineEdit = null;
        this.currentTaskEdit = null;
        this.refreshInterval = null;
    }

    /**
     * Initialise l'application
     */
    async init() {
        console.log('🚀 Initialisation de l\'application...');

        // Initialiser Google Calendar API (mode simulation par défaut)
        calendarAPI.enableSimulationMode();

        // Configurer les gestionnaires d'événements
        this.setupEventListeners();

        // Afficher la vue initiale
        this.showView('routines');

        // Charger et afficher les routines
        this.renderRoutines();

        // Démarrer le rafraîchissement automatique
        this.startAutoRefresh();

        console.log('✅ Application initialisée');
    }

    /**
     * Configure tous les gestionnaires d'événements
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // Boutons de la vue Routines
        const btnAddRoutine = document.getElementById('btn-add-routine');
        if (btnAddRoutine) {
            btnAddRoutine.addEventListener('click', () => this.showRoutineModal());
        }

        const btnGoogleAuth = document.getElementById('btn-google-auth');
        if (btnGoogleAuth) {
            btnGoogleAuth.addEventListener('click', () => this.handleGoogleAuth());
        }

        // Boutons de la vue Planning Prévisionnel
        const btnGeneratePlanning = document.getElementById('btn-generate-planning');
        if (btnGeneratePlanning) {
            btnGeneratePlanning.addEventListener('click', () => this.generatePlanning());
        }

        const btnViewTimeline = document.getElementById('btn-view-timeline');
        const btnViewList = document.getElementById('btn-view-list');

        if (btnViewTimeline) {
            btnViewTimeline.addEventListener('click', () => {
                timelineView.switchView('timeline');
                this.refreshPlanningView();
            });
        }

        if (btnViewList) {
            btnViewList.addEventListener('click', () => {
                timelineView.switchView('list');
                this.refreshPlanningView();
            });
        }

        // Modales
        this.setupModalListeners();

        // Délégation d'événements pour les actions dynamiques
        document.addEventListener('click', (e) => {
            // Boutons de routines
            if (e.target.classList.contains('btn-edit-routine')) {
                const routineId = e.target.dataset.routineId;
                this.editRoutine(routineId);
            }

            if (e.target.classList.contains('btn-delete-routine')) {
                const routineId = e.target.dataset.routineId;
                this.deleteRoutine(routineId);
            }

            if (e.target.classList.contains('btn-move-up')) {
                const routineId = e.target.dataset.routineId;
                this.moveRoutineUp(routineId);
            }

            if (e.target.classList.contains('btn-move-down')) {
                const routineId = e.target.dataset.routineId;
                this.moveRoutineDown(routineId);
            }

            // Boutons de tâches
            if (e.target.classList.contains('btn-start')) {
                const tacheId = e.target.dataset.tacheId;
                const tacheLibelle = e.target.dataset.tacheLibelle;
                this.startTask(tacheId, tacheLibelle);
            }

            if (e.target.classList.contains('btn-finish')) {
                const tacheId = e.target.dataset.tacheId;
                this.finishTask(tacheId);
            }
        });

        // Changement de période des statistiques
        const statsPeriod = document.getElementById('stats-period');
        if (statsPeriod) {
            statsPeriod.addEventListener('change', (e) => {
                this.renderStatistics(e.target.value);
            });
        }
    }

    /**
     * Configure les écouteurs pour les modales
     */
    setupModalListeners() {
        // Modal Routine
        const modalRoutine = document.getElementById('modal-routine');
        const btnCancelRoutine = document.getElementById('btn-cancel-routine');
        const btnSaveRoutine = document.getElementById('btn-save-routine');
        const btnAddTask = document.getElementById('btn-add-task');

        if (btnCancelRoutine) {
            btnCancelRoutine.addEventListener('click', () => this.closeModal('modal-routine'));
        }

        if (btnSaveRoutine) {
            btnSaveRoutine.addEventListener('click', () => this.saveRoutine());
        }

        if (btnAddTask) {
            btnAddTask.addEventListener('click', () => this.addTaskToRoutineModal());
        }

        // Fermeture des modales en cliquant sur le X ou en dehors
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    /**
     * Affiche une vue
     */
    showView(viewName) {
        this.currentView = viewName;

        // Masquer toutes les vues
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Désactiver tous les boutons de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Afficher la vue sélectionnée
        const viewId = `view-${viewName}`;
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }

        // Activer le bouton de navigation correspondant
        const navBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Rafraîchir le contenu de la vue
        this.refreshView(viewName);
    }

    /**
     * Rafraîchit le contenu d'une vue
     */
    refreshView(viewName) {
        switch (viewName) {
            case 'routines':
                this.renderRoutines();
                break;
            case 'planning-previsionnel':
                this.refreshPlanningView();
                break;
            case 'planning-reel':
                this.renderRealPlanning();
                break;
            case 'statistiques':
                const period = document.getElementById('stats-period')?.value || 'today';
                this.renderStatistics(period);
                break;
        }
    }

    /**
     * Affiche les routines
     */
    renderRoutines() {
        const container = document.getElementById('routines-container');
        if (!container) return;

        const routines = routinesManager.getAllRoutines();

        if (routines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">Aucune routine créée</div>
                    <p style="color: #6c757d; margin-top: 10px;">Cliquez sur "Ajouter une routine" pour commencer</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        for (const routine of routines) {
            const card = this.createRoutineCard(routine);
            container.appendChild(card);
        }
    }

    /**
     * Crée une carte de routine
     */
    createRoutineCard(routine) {
        const card = document.createElement('div');
        card.className = 'routine-card';

        // En-tête
        const header = document.createElement('div');
        header.className = 'routine-header';

        const title = document.createElement('div');
        title.className = 'routine-title';
        title.textContent = routine.nom;

        const actions = document.createElement('div');
        actions.className = 'routine-actions';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit btn-edit-routine';
        btnEdit.textContent = '✏️ Éditer';
        btnEdit.dataset.routineId = routine.id;

        const btnUp = document.createElement('button');
        btnUp.className = 'btn-move-up';
        btnUp.textContent = '↑';
        btnUp.dataset.routineId = routine.id;
        if (routine.ordre === 0) btnUp.disabled = true;

        const btnDown = document.createElement('button');
        btnDown.className = 'btn-move-down';
        btnDown.textContent = '↓';
        btnDown.dataset.routineId = routine.id;
        const maxOrdre = routinesManager.getAllRoutines().length - 1;
        if (routine.ordre === maxOrdre) btnDown.disabled = true;

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-danger btn-delete-routine';
        btnDelete.textContent = '🗑️';
        btnDelete.dataset.routineId = routine.id;

        actions.appendChild(btnEdit);
        actions.appendChild(btnUp);
        actions.appendChild(btnDown);
        actions.appendChild(btnDelete);

        header.appendChild(title);
        header.appendChild(actions);

        // Liste des tâches
        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list-view';

        if (routine.taches.length === 0) {
            tasksList.innerHTML = '<p class="text-muted" style="margin: 10px 0;">Aucune tâche</p>';
        } else {
            for (const task of routine.taches) {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';

                const taskInfo = document.createElement('div');
                taskInfo.className = 'task-info';

                const taskLabel = document.createElement('div');
                taskLabel.className = 'task-label';
                taskLabel.textContent = task.libelle;

                const taskMeta = document.createElement('div');
                taskMeta.className = 'task-meta';
                taskMeta.textContent = `${task.dureeEstimee} min • ${task.secable ? 'Sécable' : 'Non sécable'}`;

                taskInfo.appendChild(taskLabel);
                taskInfo.appendChild(taskMeta);

                taskItem.appendChild(taskInfo);
                tasksList.appendChild(taskItem);
            }
        }

        card.appendChild(header);
        card.appendChild(tasksList);

        return card;
    }

    /**
     * Affiche la modale de routine
     */
    showRoutineModal(routineId = null) {
        const modal = document.getElementById('modal-routine');
        const title = document.getElementById('modal-routine-title');
        const nameInput = document.getElementById('routine-name');
        const tasksList = document.getElementById('tasks-list');

        if (routineId) {
            // Mode édition
            const routine = routinesManager.getRoutine(routineId);
            this.currentRoutineEdit = routine;
            title.textContent = 'Éditer la routine';
            nameInput.value = routine.nom;

            // Afficher les tâches
            tasksList.innerHTML = '';
            for (const task of routine.taches) {
                const taskItem = this.createTaskItemForModal(task);
                tasksList.appendChild(taskItem);
            }
        } else {
            // Mode création
            this.currentRoutineEdit = null;
            title.textContent = 'Nouvelle routine';
            nameInput.value = '';
            tasksList.innerHTML = '';
        }

        modal.classList.add('active');
    }

    /**
     * Crée un élément de tâche pour la modale
     */
    createTaskItemForModal(task) {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.style.marginBottom = '10px';

        const info = document.createElement('div');
        info.className = 'task-info';
        info.innerHTML = `
            <div class="task-label">${task.libelle}</div>
            <div class="task-meta">${task.dureeEstimee} min • ${task.secable ? 'Sécable' : 'Non sécable'}</div>
        `;

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-danger';
        btnDelete.textContent = '×';
        btnDelete.onclick = () => {
            item.remove();
        };

        actions.appendChild(btnDelete);
        item.appendChild(info);
        item.appendChild(actions);

        // Stocker les données de la tâche
        item.dataset.taskData = JSON.stringify(task);

        return item;
    }

    /**
     * Ajoute une tâche à la modale de routine
     */
    addTaskToRoutineModal() {
        const libelle = prompt('Nom de la tâche:');
        if (!libelle) return;

        const dureeStr = prompt('Durée estimée (minutes):', '30');
        if (!dureeStr) return;

        const duree = parseInt(dureeStr);
        if (isNaN(duree) || duree <= 0) {
            alert('Durée invalide');
            return;
        }

        const secable = confirm('Cette tâche est-elle sécable (peut être divisée) ?');

        const task = routinesManager.createTask(libelle, duree, secable);
        const taskItem = this.createTaskItemForModal(task);

        const tasksList = document.getElementById('tasks-list');
        tasksList.appendChild(taskItem);
    }

    /**
     * Sauvegarde la routine
     */
    saveRoutine() {
        const nameInput = document.getElementById('routine-name');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Veuillez entrer un nom pour la routine');
            return;
        }

        // Récupérer les tâches de la modale
        const tasksList = document.getElementById('tasks-list');
        const taskItems = tasksList.querySelectorAll('.task-item');
        const tasks = Array.from(taskItems).map(item => {
            return JSON.parse(item.dataset.taskData);
        });

        if (this.currentRoutineEdit) {
            // Mode édition
            routinesManager.updateRoutine(this.currentRoutineEdit.id, {
                nom: name,
                taches: tasks
            });
        } else {
            // Mode création
            routinesManager.addRoutine(name, tasks);
        }

        this.closeModal('modal-routine');
        this.renderRoutines();
        timelineView.showNotification('Routine enregistrée avec succès', 'success');
    }

    /**
     * Édite une routine
     */
    editRoutine(routineId) {
        this.showRoutineModal(routineId);
    }

    /**
     * Supprime une routine
     */
    deleteRoutine(routineId) {
        const routine = routinesManager.getRoutine(routineId);
        if (!routine) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer la routine "${routine.nom}" ?`)) {
            routinesManager.deleteRoutine(routineId);
            this.renderRoutines();
            timelineView.showNotification('Routine supprimée', 'success');
        }
    }

    /**
     * Déplace une routine vers le haut
     */
    moveRoutineUp(routineId) {
        routinesManager.moveRoutineUp(routineId);
        this.renderRoutines();
    }

    /**
     * Déplace une routine vers le bas
     */
    moveRoutineDown(routineId) {
        routinesManager.moveRoutineDown(routineId);
        this.renderRoutines();
    }

    /**
     * Ferme une modale
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Génère le planning
     */
    async generatePlanning() {
        try {
            timelineView.showNotification('Génération du planning...', 'info');

            // Récupérer les événements Google Calendar
            const events = await calendarAPI.getEventsForToday();

            // Générer le planning
            const planning = scheduler.generateDailyPlanning(events);

            // Afficher le planning
            this.refreshPlanningView();

            timelineView.showNotification('Planning généré avec succès!', 'success');
        } catch (error) {
            console.error('Erreur lors de la génération du planning:', error);
            timelineView.showNotification('Erreur lors de la génération du planning', 'error');
        }
    }

    /**
     * Rafraîchit la vue du planning
     */
    refreshPlanningView() {
        const planning = scheduler.getTodayPlanning();

        timelineView.updateDateDisplay(planning?.date);

        if (timelineView.currentView === 'timeline') {
            timelineView.renderTimeline(planning);
        } else {
            timelineView.renderList(planning);
        }
    }

    /**
     * Démarre une tâche
     */
    startTask(tacheId, tacheLibelle) {
        taskExecution.startTask(tacheId, tacheLibelle);
        timelineView.updateActionButtons();
        timelineView.showNotification(`Tâche "${tacheLibelle}" démarrée`, 'success');
    }

    /**
     * Termine une tâche
     */
    finishTask(tacheId) {
        const execution = taskExecution.finishTask(tacheId);

        if (execution) {
            timelineView.updateActionButtons();
            timelineView.showNotification(
                `Tâche terminée: ${execution.dureeEffectiveMinutes} min`,
                'success'
            );

            // Rafraîchir la vue du planning réel si on est dessus
            if (this.currentView === 'planning-reel') {
                this.renderRealPlanning();
            }
        }
    }

    /**
     * Affiche le planning réel
     */
    renderRealPlanning() {
        const entries = taskExecution.getTodayEntries();

        timelineView.updateDateDisplay(null, 'planning-reel-date');
        timelineView.renderRealPlanning(entries);
    }

    /**
     * Affiche les statistiques
     */
    renderStatistics(period = 'today') {
        // Statistiques par routine
        const byRoutine = stats.getStatsByRoutine(period);
        this.renderStatsByRoutine(byRoutine);

        // Statistiques par tâche
        const byTask = stats.getStatsByTask(period);
        this.renderStatsByTask(byTask);

        // Comparaison prévisionnel vs réel
        const comparison = stats.comparePrevisionnelVsReel(period);
        this.renderComparison(comparison);

        // Tâches les plus chronophages
        const timeConsuming = stats.getMostTimeConsumingTasks(period, 5);
        this.renderTimeConsuming(timeConsuming);
    }

    /**
     * Affiche les stats par routine
     */
    renderStatsByRoutine(data) {
        const container = document.getElementById('stats-by-routine');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune donnée disponible</p>';
            return;
        }

        container.innerHTML = data.map(stat => `
            <div class="stat-item">
                <div class="stat-label">${stat.routineName}</div>
                <div class="stat-value">${taskExecution.formatDuration(stat.totalDuration)}</div>
                <div class="stat-meta text-muted">${stat.count} tâche(s)</div>
            </div>
        `).join('');
    }

    /**
     * Affiche les stats par tâche
     */
    renderStatsByTask(data) {
        const container = document.getElementById('stats-by-task');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune donnée disponible</p>';
            return;
        }

        container.innerHTML = data.slice(0, 10).map(stat => `
            <div class="stat-item">
                <div class="stat-label">${stat.tacheLibelle}</div>
                <div class="stat-value">${taskExecution.formatDuration(stat.totalDuration)}</div>
                <div class="stat-meta text-muted">${stat.count} fois • Moy: ${stat.avgDuration}min</div>
            </div>
        `).join('');
    }

    /**
     * Affiche la comparaison prévisionnel vs réel
     */
    renderComparison(data) {
        const container = document.getElementById('stats-comparison');
        if (!container) return;

        if (!data.hasPrevisionnel || data.comparisons.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune comparaison disponible</p>';
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Prévu: ${taskExecution.formatDuration(data.totalPrevue)}</span>
                    <span>Réel: ${taskExecution.formatDuration(data.totalReelle)}</span>
                </div>
            </div>
            ${data.comparisons.slice(0, 5).map(comp => `
                <div class="stat-item">
                    <div class="stat-label">${comp.tacheLibelle}</div>
                    <div class="stat-comparison">
                        <span class="stat-prev">${comp.dureePrevue}min</span>
                        <span class="stat-real">${comp.dureeReelle}min</span>
                        <span class="stat-diff ${comp.difference > 0 ? 'negative' : 'positive'}">
                            ${comp.difference > 0 ? '+' : ''}${comp.difference}min
                        </span>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Affiche les tâches les plus chronophages
     */
    renderTimeConsuming(data) {
        const container = document.getElementById('stats-time-consuming');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune donnée disponible</p>';
            return;
        }

        container.innerHTML = data.map((stat, index) => `
            <div class="stat-item">
                <div class="stat-label">${index + 1}. ${stat.tacheLibelle}</div>
                <div class="stat-value">${taskExecution.formatDuration(stat.totalDuration)}</div>
                <div class="stat-meta text-muted">${stat.count} fois</div>
            </div>
        `).join('');
    }

    /**
     * Gère l'authentification Google
     */
    async handleGoogleAuth() {
        if (calendarAPI.simulationMode) {
            const useReal = confirm('Voulez-vous configurer Google Calendar ? (Mode simulation activé par défaut)');

            if (useReal) {
                const clientId = prompt('Entrez votre Client ID Google:');
                const apiKey = prompt('Entrez votre API Key Google:');

                if (clientId && apiKey) {
                    calendarAPI.setCredentials(clientId, apiKey);
                    calendarAPI.simulationMode = false;

                    try {
                        await calendarAPI.init();
                        await calendarAPI.signIn();
                        this.updateGoogleStatus(true);
                        timelineView.showNotification('Connecté à Google Calendar', 'success');
                    } catch (error) {
                        timelineView.showNotification('Erreur de connexion', 'error');
                    }
                }
            } else {
                timelineView.showNotification('Mode simulation activé', 'info');
            }
        }
    }

    /**
     * Met à jour le statut de connexion Google
     */
    updateGoogleStatus(connected) {
        const status = document.getElementById('google-status');
        if (status) {
            status.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
            status.textContent = connected ? 'Connecté' : 'Déconnecté';
        }
    }

    /**
     * Démarre le rafraîchissement automatique
     */
    startAutoRefresh() {
        // Rafraîchir toutes les 30 secondes
        this.refreshInterval = setInterval(() => {
            if (this.currentView === 'planning-previsionnel') {
                timelineView.updateActionButtons();
            }
        }, 30000);
    }

    /**
     * Arrête le rafraîchissement automatique
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Exposer l'instance globalement pour le débogage
    window.app = app;
});
