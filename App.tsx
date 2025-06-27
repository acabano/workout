
import React, { useState, createContext, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User, WorkoutTemplate, LoggedWorkout } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { WorkoutTemplateForm } from './components/WorkoutTemplateForm';
import { LogWorkoutForm } from './components/LogWorkoutForm';
import { StatsView } from './components/StatsView';
import { WorkoutService, ExportedData } from './services/workoutService';
import { ViewTemplateDetail } from './components/ViewTemplateDetail';
import { AIWorkoutGenerator } from './components/AIWorkoutGenerator';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  templates: WorkoutTemplate[];
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  loggedWorkouts: LoggedWorkout[];
  addLoggedWorkout: (log: LoggedWorkout) => void;
  updateLoggedWorkout: (log: LoggedWorkout) => void;
  deleteLoggedWorkout: (logId: string) => void;
  getLoggedWorkoutById: (id: string) => LoggedWorkout | undefined;
  exportUserData: () => void;
  importUserData: (file: File) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Gestisce il caricamento iniziale o il cambio utente
  
  const navigate = useNavigate();
  const location = useLocation();

  // Simula il caricamento iniziale, ora non carica da localStorage
  useEffect(() => {
    // Tenta di recuperare l'utente da una sessione precedente (es. se si ricarica la pagina)
    // Questo è l'unico pezzo di localStorage che potremmo conservare per UX, ma per ora lo rimuoviamo per coerenza
    // con il "salva in file"
    const storedUserJson = sessionStorage.getItem('gymAppUser'); // Usiamo sessionStorage per non perdere l'utente al refresh
    if (storedUserJson) {
        try {
            const storedUser = JSON.parse(storedUserJson);
            if (storedUser && storedUser.username) {
                 // Non carichiamo dati qui, l'utente dovrà importarli.
                 // Ma impostiamo l'utente se era già loggato.
                setCurrentUserInternal({ username: storedUser.username });
            }
        } catch (e) {
            sessionStorage.removeItem('gymAppUser');
        }
    }
    setIsLoading(false);
  }, []);


  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserInternal(user);
    if (user) {
      // Salva l'utente in sessionStorage per persistere attraverso i refresh di pagina
      // ma non i suoi dati (templates/logs) che saranno gestiti da import/export
      sessionStorage.setItem('gymAppUser', JSON.stringify(user));
      // Quando un nuovo utente viene impostato (o si fa login),
      // i dati (templates/logs) non vengono caricati automaticamente da nessuna parte.
      // Devono essere importati o creati da zero.
      // Se si esegue il logout, svuotiamo i dati.
      setTemplates([]);
      setLoggedWorkouts([]);
    } else {
      sessionStorage.removeItem('gymAppUser');
      setTemplates([]);
      setLoggedWorkouts([]);
    }
  }, []);
  
  // Gestione reindirizzamenti
   useEffect(() => {
    if (!isLoading && !currentUser && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    } else if (!isLoading && currentUser && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  }, [currentUser, isLoading, location.pathname, navigate]);


  const addTemplate = (template: WorkoutTemplate) => {
    setTemplates(prev => [...prev, template]);
  };

  const updateTemplate = (updatedTemplate: WorkoutTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };
  
  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const addLoggedWorkout = (log: LoggedWorkout) => {
    setLoggedWorkouts(prev => [...prev, log].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateLoggedWorkout = (updatedLog: LoggedWorkout) => {
     setLoggedWorkouts(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteLoggedWorkout = (logId: string) => {
    setLoggedWorkouts(prev => prev.filter(l => l.id !== logId));
  };
  
  const getTemplateById = (id: string): WorkoutTemplate | undefined => {
    return templates.find(t => t.id === id);
  };

  const getLoggedWorkoutById = (id: string): LoggedWorkout | undefined => {
    return loggedWorkouts.find(l => l.id === id);
  };

  const exportUserData = () => {
    if (!currentUser) {
      alert("Nessun utente attualmente attivo per esportare i dati.");
      return;
    }
    WorkoutService.exportData(currentUser.username, templates, loggedWorkouts);
    alert(`Dati per l'utente ${currentUser.username} esportati con successo!`);
  };

  const importUserData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonString = event.target?.result as string;
      if (jsonString) {
        const imported = WorkoutService.parseImportedData(jsonString);
        if (imported) {
          // Imposta l'utente e i dati dal file importato
          setCurrentUserInternal({ username: imported.username }); // Non chiama setCurrentUser per evitare reset dati
          sessionStorage.setItem('gymAppUser', JSON.stringify({ username: imported.username }));

          setTemplates(imported.templates || []);
          setLoggedWorkouts((imported.loggedWorkouts || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          alert(`Dati per l'utente ${imported.username} importati con successo!`);
          navigate('/', { replace: true }); // Naviga alla dashboard dopo l'importazione
        } else {
          alert("Errore nell'importazione dei dati: formato file non valido o corrotto.");
        }
      }
    };
    reader.onerror = () => {
        alert("Impossibile leggere il file selezionato.");
    };
    reader.readAsText(file);
  };


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Caricamento...</p></div>;
  }

  return (
    <AppContext.Provider value={{ 
        currentUser, setCurrentUser, 
        templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById,
        loggedWorkouts, addLoggedWorkout, updateLoggedWorkout, deleteLoggedWorkout, getLoggedWorkoutById,
        exportUserData, importUserData
      }}>
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
        {currentUser && <Navbar />}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/auth" element={<AuthModal />} />
            {currentUser ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ai-generator" element={<AIWorkoutGenerator />} />
                <Route path="/create-template" element={<WorkoutTemplateForm />} />
                <Route path="/edit-template/:templateId" element={<WorkoutTemplateForm />} />
                <Route path="/template/:templateId" element={<ViewTemplateDetail />} />
                <Route path="/log-workout" element={<LogWorkoutForm />} />
                <Route path="/log-workout/:date" element={<LogWorkoutForm />} />
                <Route path="/edit-log/:logId" element={<LogWorkoutForm />} />
                <Route path="/stats" element={<StatsView />} />
              </>
            ) : (
              <Route path="*" element={<AuthModal />} /> 
            )}
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;
