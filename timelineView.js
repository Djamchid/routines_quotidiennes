/**
 * TimelineView - Affichage du planning (timeline et liste)
 */

class TimelineView {
    constructor(taskExecution) {
        this.taskExecution = taskExecution;
        this.currentView = 'timeline'; // 'timeline' ou 'list'
    }

    /**
     * Rend le planning en mode timeline
     */
    renderTimeline(planning, containerId = 'planning-timeline') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!planning || !planning.creneaux || planning.creneaux.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const timeline = document.createElement('div');
        timeline.className = 'timeline';

        for (const creneau of planning.creneaux) {
            const item = this.createTimelineItem(creneau);
            timeline.appendChild(item);
        }

        container.appendChild(timeline);
    }

    /**
     * Crée un élément de timeline
     */
    createTimelineItem(creneau) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.dataset.slotId = creneau.id;

        // Heure
        const time = document.createElement('div');
        time.className = 'timeline-time';
        time.textContent = `${creneau.debut} - ${creneau.fin}`;

        // Contenu
        const content = document.createElement('div');
        content.className = `timeline-content ${creneau.type}`;

        // Titre
        const title = document.createElement('div');
        title.className = 'timeline-title';

        if (creneau.type === 'rdv') {
            title.textContent = `📅 ${creneau.rdvTitle || 'Rendez-vous'}`;
        } else if (creneau.type === 'tache') {
            title.textContent = `✓ ${creneau.tacheLibelle}`;
        }

        // Métadonnées
        const meta = document.createElement('div');
        meta.className = 'timeline-meta';

        if (creneau.type === 'tache') {
            meta.textContent = `Durée: ${creneau.dureeAllouee} min`;
        }

        content.appendChild(title);
        content.appendChild(meta);

        // Actions (pour les tâches)
        if (creneau.type === 'tache') {
            const actions = this.createTaskActions(creneau);
            content.appendChild(actions);
        }

        item.appendChild(time);
        item.appendChild(content);

        return item;
    }

    /**
     * Crée les boutons d'action pour une tâche
     */
    createTaskActions(creneau) {
        const actions = document.createElement('div');
        actions.className = 'timeline-actions';

        const isRunning = this.taskExecution.isTaskRunning(creneau.tacheId);

        // Bouton Commencer
        const btnStart = document.createElement('button');
        btnStart.className = 'btn-start';
        btnStart.textContent = isRunning ? '⏸️ En cours...' : '▶️ Commencer';
        btnStart.disabled = isRunning;
        btnStart.dataset.tacheId = creneau.tacheId;
        btnStart.dataset.tacheLibelle = creneau.tacheLibelle;

        // Bouton Terminer
        const btnFinish = document.createElement('button');
        btnFinish.className = 'btn-finish';
        btnFinish.textContent = '⏹️ Terminer';
        btnFinish.disabled = !isRunning;
        btnFinish.dataset.tacheId = creneau.tacheId;

        actions.appendChild(btnStart);
        actions.appendChild(btnFinish);

        return actions;
    }

    /**
     * Rend le planning en mode liste
     */
    renderList(planning, containerId = 'planning-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!planning || !planning.creneaux || planning.creneaux.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        for (const creneau of planning.creneaux) {
            const item = this.createListItem(creneau);
            container.appendChild(item);
        }
    }

    /**
     * Crée un élément de liste
     */
    createListItem(creneau) {
        const item = document.createElement('div');
        item.className = `list-item ${creneau.type}`;
        item.dataset.slotId = creneau.id;

        const content = document.createElement('div');

        // En-tête
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '8px';

        const title = document.createElement('strong');
        if (creneau.type === 'rdv') {
            title.textContent = `📅 ${creneau.rdvTitle || 'Rendez-vous'}`;
        } else {
            title.textContent = `✓ ${creneau.tacheLibelle}`;
        }

        const time = document.createElement('span');
        time.className = 'text-muted';
        time.textContent = `${creneau.debut} - ${creneau.fin}`;

        header.appendChild(title);
        header.appendChild(time);

        content.appendChild(header);

        // Durée
        if (creneau.type === 'tache') {
            const duration = document.createElement('div');
            duration.className = 'text-muted';
            duration.style.fontSize = '0.9rem';
            duration.textContent = `Durée allouée: ${creneau.dureeAllouee} minutes`;
            content.appendChild(duration);

            // Actions
            const actions = this.createTaskActions(creneau);
            actions.style.marginTop = '10px';
            content.appendChild(actions);
        }

        item.appendChild(content);
        return item;
    }

    /**
     * Rend le planning réel
     */
    renderRealPlanning(entries, containerId = 'planning-reel-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!entries || entries.length === 0) {
            container.innerHTML = this.renderEmptyState('Aucune tâche réalisée pour le moment');
            return;
        }

        // Trier par date de début (plus récent en premier)
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.debutReel) - new Date(a.debutReel)
        );

        for (const entry of sortedEntries) {
            const item = this.createRealPlanningItem(entry);
            container.appendChild(item);
        }
    }

    /**
     * Crée un élément de planning réel
     */
    createRealPlanningItem(entry) {
        const item = document.createElement('div');
        item.className = 'real-entry';

        // En-tête
        const header = document.createElement('div');
        header.className = 'real-entry-header';

        const title = document.createElement('div');
        title.className = 'real-entry-title';
        title.textContent = entry.tacheLibelle;

        const duration = document.createElement('div');
        duration.className = 'real-entry-duration';
        duration.textContent = this.taskExecution.formatDuration(entry.dureeEffectiveMinutes);

        header.appendChild(title);
        header.appendChild(duration);

        // Horaires
        const times = document.createElement('div');
        times.className = 'real-entry-times';
        times.textContent = `${this.taskExecution.formatTime(entry.debutReel)} - ${this.taskExecution.formatTime(entry.finReel)}`;

        item.appendChild(header);
        item.appendChild(times);

        return item;
    }

    /**
     * Rend un état vide
     */
    renderEmptyState(message = 'Aucun planning généré') {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
    }

    /**
     * Met à jour la vue courante
     */
    updateView(planning) {
        if (this.currentView === 'timeline') {
            this.renderTimeline(planning);
        } else {
            this.renderList(planning);
        }
    }

    /**
     * Change de vue
     */
    switchView(viewType) {
        this.currentView = viewType;

        // Gérer la visibilité des conteneurs
        const timelineContainer = document.getElementById('planning-timeline');
        const listContainer = document.getElementById('planning-list');

        if (viewType === 'timeline') {
            if (timelineContainer) timelineContainer.style.display = 'block';
            if (listContainer) listContainer.style.display = 'none';
        } else {
            if (timelineContainer) timelineContainer.style.display = 'none';
            if (listContainer) listContainer.style.display = 'block';
        }

        // Mettre à jour les boutons
        const btnTimeline = document.getElementById('btn-view-timeline');
        const btnList = document.getElementById('btn-view-list');

        if (btnTimeline && btnList) {
            if (viewType === 'timeline') {
                btnTimeline.classList.add('active');
                btnList.classList.remove('active');
            } else {
                btnTimeline.classList.remove('active');
                btnList.classList.add('active');
            }
        }
    }

    /**
     * Met à jour l'affichage d'une date
     */
    updateDateDisplay(date = null, elementId = 'planning-date') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const dateObj = date ? new Date(date) : new Date();
        const formatted = dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        element.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    /**
     * Met à jour l'état des boutons d'action
     */
    updateActionButtons() {
        const btnStarts = document.querySelectorAll('.btn-start');
        const btnFinishes = document.querySelectorAll('.btn-finish');

        btnStarts.forEach(btn => {
            const tacheId = btn.dataset.tacheId;
            const isRunning = this.taskExecution.isTaskRunning(tacheId);

            if (isRunning) {
                btn.textContent = '⏸️ En cours...';
                btn.disabled = true;
            } else {
                btn.textContent = '▶️ Commencer';
                btn.disabled = false;
            }
        });

        btnFinishes.forEach(btn => {
            const tacheId = btn.dataset.tacheId;
            const isRunning = this.taskExecution.isTaskRunning(tacheId);
            btn.disabled = !isRunning;
        });
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#4a90e2'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Retirer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Affiche le résumé du planning
     */
    renderPlanningSummary(planning, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!planning || !planning.creneaux) {
            container.innerHTML = '';
            return;
        }

        const tasks = planning.creneaux.filter(c => c.type === 'tache');
        const rdvs = planning.creneaux.filter(c => c.type === 'rdv');

        const totalTaskTime = tasks.reduce((sum, t) => sum + t.dureeAllouee, 0);
        const totalRdvTime = rdvs.reduce((sum, r) => {
            const [hd, md] = r.debut.split(':').map(Number);
            const [hf, mf] = r.fin.split(':').map(Number);
            return sum + ((hf * 60 + mf) - (hd * 60 + md));
        }, 0);

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f0fff4; padding: 15px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #28a745;">${tasks.length}</div>
                    <div style="font-size: 0.9rem; color: #6c757d;">Tâches</div>
                </div>
                <div style="background: #fff5f5; padding: 15px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #dc3545;">${rdvs.length}</div>
                    <div style="font-size: 0.9rem; color: #6c757d;">RDV</div>
                </div>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #4a90e2;">${this.taskExecution.formatDuration(totalTaskTime)}</div>
                    <div style="font-size: 0.9rem; color: #6c757d;">Temps tâches</div>
                </div>
                <div style="background: #fff8f0; padding: 15px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #ffc107;">${this.taskExecution.formatDuration(totalRdvTime)}</div>
                    <div style="font-size: 0.9rem; color: #6c757d;">Temps RDV</div>
                </div>
            </div>
        `;
    }
}

// Instance globale
const timelineView = new TimelineView(taskExecution);
