
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { RenewalList } from './components/RenewalList';
import { RenewedList } from './components/RenewedList';
import { InsuredList } from './components/InsuredList';
import { UserList } from './components/UserList';
import { Ranking } from './components/Ranking';
import { Lead, LeadStatus, User } from './types';
import { LayoutDashboard, Users, RefreshCw, CheckCircle, FileText, UserCog, Trophy, AlertTriangle, Power } from './components/Icons';
import { 
  subscribeToCollection, 
  subscribeToRenovationsTotal, 
  addDataToCollection, 
  updateDataInCollection, 
  updateTotalRenovacoes, 
  isFirebaseConfigured 
} from './services/firebase';

type View = 'dashboard' | 'leads' | 'renewals' | 'renewed' | 'insured' | 'users' | 'ranking';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('leads');
  
  // COLEÇÕES DO FIREBASE
  const [leadsCollection, setLeadsCollection] = useState<Lead[]>([]); 
  const [renewalsCollection, setRenewalsCollection] = useState<Lead[]>([]); 
  const [renewedCollection, setRenewedCollection] = useState<Lead[]>([]); 
  const [usersCollection, setUsersCollection] = useState<User[]>([]); 
  
  // STATS
  const [manualRenewalTotal, setManualRenewalTotal] = useState<number>(0);

  // USUÁRIO ATUAL (Simulação de Login)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Inicializa o usuário atual assim que a coleção de usuários carregar (pega o primeiro admin ou o primeiro que vier)
  useEffect(() => {
    if (usersCollection.length > 0 && !currentUser) {
        const admin = usersCollection.find(u => u.isAdmin && u.isActive);
        if (admin) setCurrentUser(admin);
        else setCurrentUser(usersCollection[0]);
    }
  }, [usersCollection]);

  // === FIREBASE SUBSCRIPTIONS ===
  useEffect(() => {
    const unsubscribeLeads = subscribeToCollection('leads', (data) => setLeadsCollection(data as Lead[]));
    const unsubscribeRenewals = subscribeToCollection('renovacoes', (data) => setRenewalsCollection(data as Lead[]));
    const unsubscribeRenewed = subscribeToCollection('renovados', (data) => {
        const fixedData = data.map(d => ({ ...d, status: LeadStatus.CLOSED }));
        setRenewedCollection(fixedData as Lead[]);
    });
    const unsubscribeUsers = subscribeToCollection('usuarios', (data) => setUsersCollection(data as User[]));
    const unsubscribeTotal = subscribeToRenovationsTotal((total) => setManualRenewalTotal(total));

    return () => {
        unsubscribeLeads();
        unsubscribeRenewals();
        unsubscribeRenewed();
        unsubscribeUsers();
        unsubscribeTotal();
    };
  }, []);

  // === HANDLERS ===
  const handleAddLead = (newLead: Lead) => {
    if (newLead.id.includes('renewed')) {
        addDataToCollection('renovados', newLead);
    } else if (newLead.id.includes('renewal_copy')) {
        addDataToCollection('renovacoes', newLead);
    } else if (newLead.insuranceType === 'Renovação' && currentView === 'renewals') {
        addDataToCollection('renovacoes', newLead);
    } else {
        addDataToCollection('leads', newLead);
    }
  };

  const handleUpdateLead = (updatedLead: Lead) => {
      if (currentView === 'leads') {
          updateDataInCollection('leads', updatedLead.id, updatedLead);
      } else if (currentView === 'renewals' || currentView === 'insured') {
          updateDataInCollection('renovacoes', updatedLead.id, updatedLead);
      } else if (currentView === 'renewed') {
          updateDataInCollection('renovados', updatedLead.id, updatedLead);
      } else {
          if (leadsCollection.find(l => l.id === updatedLead.id)) updateDataInCollection('leads', updatedLead.id, updatedLead);
          else if (renewalsCollection.find(l => l.id === updatedLead.id)) updateDataInCollection('renovacoes', updatedLead.id, updatedLead);
          else if (renewedCollection.find(l => l.id === updatedLead.id)) updateDataInCollection('renovados', updatedLead.id, updatedLead);
      }
  };

  const handleUpdateUser = (updatedUser: User) => updateDataInCollection('usuarios', updatedUser.id, updatedUser);
  const handleAddUser = (newUser: User) => addDataToCollection('usuarios', newUser);
  const handleUpdateRenovationsTotal = (val: number) => updateTotalRenovacoes(val);

  const allLeadsForRanking = [...leadsCollection, ...renewalsCollection, ...renewedCollection];

  // === PERMISSIONS LOGIC ===
  const isAdmin = currentUser?.isAdmin;
  const isRenovations = !isAdmin && currentUser?.isRenovations;
  const isComum = !isAdmin && !isRenovations;

  // Redirecionamento de segurança se a view atual não for permitida
  useEffect(() => {
    if (isComum && !['dashboard', 'leads', 'ranking'].includes(currentView)) {
        setCurrentView('dashboard');
    }
    if (isRenovations && !['dashboard', 'renewals'].includes(currentView)) {
        setCurrentView('dashboard');
    }
  }, [currentView, isComum, isRenovations]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {!isFirebaseConfigured && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white text-xs font-bold px-4 py-2 text-center shadow-md">
            ⚠️ ATENÇÃO: Firebase não configurado. Edite o arquivo <code>services/firebase.ts</code> com suas chaves para salvar os dados. (Modo Visualização)
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex pt-8">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center">L</span>
            Leads AI
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* DASHBOARD: Todos veem */}
          <button 
            onClick={() => { setCurrentView('dashboard'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          {/* MEUS LEADS: Admin ou Comum */}
          {(isAdmin || isComum) && (
            <button 
                onClick={() => { setCurrentView('leads'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'leads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Users className="w-5 h-5" />
                <span>Meus Leads</span>
            </button>
          )}

          {/* RENOVAÇÕES: Admin ou Renovações */}
          {(isAdmin || isRenovations) && (
            <button 
                onClick={() => { setCurrentView('renewals'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'renewals' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <RefreshCw className="w-5 h-5" />
                <span>Renovações</span>
            </button>
          )}

          {/* RENOVADOS: Admin Apenas (User de renovação não vê conforme pedido) */}
          {isAdmin && (
            <button 
                onClick={() => { setCurrentView('renewed'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'renewed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <CheckCircle className="w-5 h-5" />
                <span>Renovados</span>
            </button>
          )}

          {/* SEGURADOS: Admin Apenas */}
          {isAdmin && (
            <button 
                onClick={() => { setCurrentView('insured'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'insured' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <FileText className="w-5 h-5" />
                <span>Segurados</span>
            </button>
          )}

          {/* RANKING: Admin ou Comum */}
          {(isAdmin || isComum) && (
            <button 
                onClick={() => { setCurrentView('ranking'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'ranking' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Trophy className="w-5 h-5" />
                <span>Ranking</span>
            </button>
          )}

          {/* USUÁRIOS: Admin Apenas */}
          {isAdmin && (
            <button 
                onClick={() => { setCurrentView('users'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <UserCog className="w-5 h-5" />
                <span>Usuários</span>
            </button>
          )}
        </nav>

        {/* User Selector for Testing Roles */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Simular Acesso Como:</label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none"
            value={currentUser?.id || ''}
            onChange={(e) => {
                const user = usersCollection.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
            }}
          >
            {usersCollection.map(u => (
                <option key={u.id} value={u.id}>
                    {u.name} ({u.isAdmin ? 'Admin' : u.isRenovations ? 'Renov.' : 'Comum'})
                </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
              {(currentUser?.name || 'A').charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">
                  {currentUser?.isAdmin ? 'Administrador' : currentUser?.isRenovations ? 'Renovações' : 'Comum'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-6">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden">
            <h1 className="font-bold text-gray-800">Leads AI</h1>
            <button className="p-2 text-gray-600">☰</button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 relative bg-gray-100">
            {currentView === 'dashboard' && (
                <Dashboard 
                    newLeadsData={leadsCollection}
                    renewalLeadsData={[...renewalsCollection, ...renewedCollection]} 
                    manualRenewalTotal={manualRenewalTotal}
                    onUpdateRenewalTotal={handleUpdateRenovationsTotal}
                    currentUser={currentUser}
                />
            )}
            
            {currentView === 'leads' && (
                <div className="h-full">
                    <LeadList 
                        leads={leadsCollection} 
                        users={usersCollection}
                        onSelectLead={() => {}}
                        onUpdateLead={handleUpdateLead}
                        onAddLead={handleAddLead}
                        currentUser={currentUser}
                    />
                </div>
            )}

            {currentView === 'renewals' && (
                <div className="h-full">
                    <RenewalList 
                        leads={renewalsCollection} 
                        users={usersCollection}
                        onUpdateLead={handleUpdateLead} 
                        onAddLead={handleAddLead} 
                        currentUser={currentUser}
                    />
                </div>
            )}

            {currentView === 'renewed' && (
                <div className="h-full">
                    <RenewedList 
                        leads={renewedCollection} 
                        onUpdateLead={handleUpdateLead} 
                    />
                </div>
            )}

            {currentView === 'insured' && (
                <div className="h-full">
                    <InsuredList 
                        leads={renewalsCollection} 
                        onUpdateLead={handleUpdateLead} 
                    />
                </div>
            )}

            {currentView === 'ranking' && (
                <div className="h-full">
                    <Ranking leads={allLeadsForRanking} users={usersCollection} />
                </div>
            )}

            {currentView === 'users' && (
                <div className="h-full">
                    <UserList 
                        users={usersCollection} 
                        onUpdateUser={handleUpdateUser} 
                        onAddUser={handleAddUser} 
                    />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
