/**
 * CalendarAPI - Intégration Google Calendar
 */

class CalendarAPI {
    constructor() {
        this.clientId = ''; // À configurer par l'utilisateur
        this.apiKey = ''; // À configurer par l'utilisateur
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
        this.scopes = 'https://www.googleapis.com/auth/calendar.readonly';
        this.isSignedIn = false;
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
    }

    /**
     * Initialise l'API Google
     */
    async init() {
        try {
            // Vérifier si les scripts Google sont chargés
            if (typeof gapi === 'undefined') {
                console.warn('Google API non chargée. Chargement en cours...');
                await this.loadGoogleAPIs();
            }

            await this.initializeGapiClient();
            await this.initializeGisClient();

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de Google Calendar:', error);
            return false;
        }
    }

    /**
     * Charge les scripts Google API
     */
    loadGoogleAPIs() {
        return new Promise((resolve, reject) => {
            // Charger GAPI
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            gapiScript.onload = () => {
                // Charger GIS
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.async = true;
                gisScript.defer = true;
                gisScript.onload = () => resolve();
                gisScript.onerror = () => reject(new Error('Erreur de chargement GIS'));
                document.head.appendChild(gisScript);
            };
            gapiScript.onerror = () => reject(new Error('Erreur de chargement GAPI'));
            document.head.appendChild(gapiScript);
        });
    }

    /**
     * Initialise le client GAPI
     */
    async initializeGapiClient() {
        if (!this.apiKey) {
            console.warn('API Key Google Calendar non configurée');
            return;
        }

        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.apiKey,
                        discoveryDocs: this.discoveryDocs,
                    });
                    this.gapiInited = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Initialise le client GIS
     */
    initializeGisClient() {
        if (!this.clientId) {
            console.warn('Client ID Google Calendar non configuré');
            return;
        }

        return new Promise((resolve) => {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scopes,
                callback: '', // Défini lors de la connexion
            });
            this.gisInited = true;
            resolve();
        });
    }

    /**
     * Configure les identifiants Google
     */
    setCredentials(clientId, apiKey) {
        this.clientId = clientId;
        this.apiKey = apiKey;

        // Sauvegarder dans localStorage
        localStorage.setItem('google_client_id', clientId);
        localStorage.setItem('google_api_key', apiKey);
    }

    /**
     * Charge les identifiants depuis localStorage
     */
    loadCredentials() {
        const clientId = localStorage.getItem('google_client_id');
        const apiKey = localStorage.getItem('google_api_key');

        if (clientId && apiKey) {
            this.clientId = clientId;
            this.apiKey = apiKey;
            return true;
        }
        return false;
    }

    /**
     * Connexion à Google Calendar
     */
    async signIn() {
        if (!this.clientId || !this.apiKey) {
            throw new Error('Client ID et API Key non configurés');
        }

        return new Promise((resolve, reject) => {
            this.tokenClient.callback = async (response) => {
                if (response.error !== undefined) {
                    reject(response);
                    return;
                }
                this.isSignedIn = true;
                resolve(response);
            };

            if (gapi.client.getToken() === null) {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    /**
     * Déconnexion de Google Calendar
     */
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.isSignedIn = false;
        }
    }

    /**
     * Récupère les événements du jour
     */
    async getTodayEvents() {
        if (!this.isSignedIn) {
            throw new Error('Non connecté à Google Calendar');
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        return this.getEvents(startOfDay, endOfDay);
    }

    /**
     * Récupère les événements entre deux dates
     */
    async getEvents(startDate, endDate) {
        try {
            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                showDeleted: false,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.result.items;
            return this.formatEvents(events);
        } catch (error) {
            console.error('Erreur lors de la récupération des événements:', error);
            throw error;
        }
    }

    /**
     * Formate les événements Google Calendar pour l'application
     */
    formatEvents(events) {
        return events.map(event => {
            // Gérer les événements toute la journée
            let debut, fin;

            if (event.start.dateTime) {
                debut = new Date(event.start.dateTime);
                fin = new Date(event.end.dateTime);
            } else {
                // Événement toute la journée
                debut = new Date(event.start.date);
                fin = new Date(event.end.date);
            }

            return {
                id: event.id,
                titre: event.summary || 'Sans titre',
                debut: this.formatTime(debut),
                fin: this.formatTime(fin),
                description: event.description || '',
                lieu: event.location || '',
                isAllDay: !event.start.dateTime
            };
        });
    }

    /**
     * Formate une date en HH:MM
     */
    formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * Vérifie si l'utilisateur est connecté
     */
    checkSignInStatus() {
        return this.isSignedIn;
    }

    /**
     * Mode simulation (pour tester sans Google Calendar)
     */
    enableSimulationMode() {
        this.simulationMode = true;
    }

    /**
     * Génère des événements de test
     */
    getSimulatedEvents() {
        return [
            {
                id: 'sim_1',
                titre: 'Réunion équipe',
                debut: '09:00',
                fin: '10:00',
                description: 'Réunion hebdomadaire',
                lieu: 'Salle de conférence',
                isAllDay: false
            },
            {
                id: 'sim_2',
                titre: 'Déjeuner client',
                debut: '12:30',
                fin: '14:00',
                description: 'Déjeuner avec client important',
                lieu: 'Restaurant',
                isAllDay: false
            },
            {
                id: 'sim_3',
                titre: 'Présentation projet',
                debut: '15:00',
                fin: '16:30',
                description: 'Présentation du nouveau projet',
                lieu: 'Bureau',
                isAllDay: false
            }
        ];
    }

    /**
     * Récupère les événements (mode simulation ou réel)
     */
    async getEventsForToday() {
        if (this.simulationMode) {
            return Promise.resolve(this.getSimulatedEvents());
        }

        if (!this.isSignedIn) {
            return [];
        }

        return this.getTodayEvents();
    }

    /**
     * Teste la connexion à Google Calendar
     */
    async testConnection() {
        try {
            if (!this.isSignedIn) {
                throw new Error('Non connecté');
            }

            const response = await gapi.client.calendar.calendarList.list();
            return {
                success: true,
                calendars: response.result.items.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sauvegarde l'état de connexion
     */
    saveConnectionState() {
        localStorage.setItem('google_calendar_connected', this.isSignedIn.toString());
    }

    /**
     * Charge l'état de connexion
     */
    loadConnectionState() {
        const state = localStorage.getItem('google_calendar_connected');
        return state === 'true';
    }
}

// Instance globale
const calendarAPI = new CalendarAPI();

// Charger les identifiants au démarrage
calendarAPI.loadCredentials();
