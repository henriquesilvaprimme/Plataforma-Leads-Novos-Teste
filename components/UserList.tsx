
import React, { useState } from 'react';
import { User } from '../types';
import { UserCog, Eye, EyeOff, Power, ShieldCheck, Users, Search, Plus } from './Icons';

interface UserListProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
}

const UserCard: React.FC<{ user: User; onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleActive = () => {
    onUpdate({ ...user, isActive: !user.isActive });
  };

  const toggleAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...user, isAdmin: e.target.checked });
  };

  return (
    <div className={`border rounded-xl p-5 shadow-sm transition-all duration-300 relative flex flex-col h-full justify-between min-h-[320px] ${user.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-90'}`}>
       
       {/* Background Indicator for Inactive */}
       {!user.isActive && (
           <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
               <Power className="w-24 h-24 text-gray-500" />
           </div>
       )}

       <div className="flex flex-col gap-5 relative z-10 flex-1">
          
          {/* Header: Avatar, Name, Role Badge */}
          <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 ${user.avatarColor || 'bg-indigo-500'}`}>
                      {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{user.name}</h3>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  {/* Badge de Renovações */}
                  {user.isRenovations && (
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                        Renovações
                     </span>
                  )}
              </div>
          </div>

          {/* Grid of Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              
              {/* Login */}
              <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Login</label>
                  <p className="text-sm font-semibold text-gray-700 truncate">{user.login}</p>
              </div>

              {/* Email */}
              <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">E-mail</label>
                  <p className="text-sm font-medium text-gray-700 truncate" title={user.email}>{user.email}</p>
              </div>

              {/* Password */}
              <div className="col-span-2 md:col-span-1 min-w-0">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Senha</label>
                  <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 min-w-[80px] truncate">
                          {showPassword ? user.password || '******' : '••••••••'}
                      </code>
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1 shrink-0"
                        title="Ver Senha"
                      >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                  </div>
              </div>

              {/* Type (Admin/Common) */}
              <div className="col-span-2 md:col-span-1 flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                  <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${user.isAdmin ? 'text-indigo-600' : 'text-gray-300'}`} />
                      <span className="text-xs font-bold text-gray-600">Admin?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={user.isAdmin} onChange={toggleAdmin} disabled={!user.isActive} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
              </div>
          </div>
       </div>

       {/* Action Footer */}
       <div className="border-t border-gray-100 pt-5 mt-5 flex items-center justify-end relative z-10">
             <button 
                onClick={toggleActive}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm border whitespace-nowrap ${
                    user.isActive 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                    : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                }`}
             >
                <Power className="w-3 h-3" />
                {user.isActive ? 'Inativar Usuário' : 'Ativar Usuário'}
             </button>
       </div>
    </div>
  );
};

export const UserList: React.FC<UserListProps> = ({ users, onUpdateUser, onAddUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    login: '',
    email: '',
    password: '',
    isAdmin: false,
    isActive: true,
    isRenovations: false
  });

  const filteredUsers = users.filter(user => {
     const name = user.name || '';
     const login = user.login || '';
     const email = user.email || '';
     
     return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            login.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateUser = () => {
      if (!newUser.name || !newUser.login || !newUser.password) return;

      const user: User = {
          id: Date.now().toString(),
          name: newUser.name,
          login: newUser.login,
          email: newUser.email || '',
          password: newUser.password,
          isAdmin: !!newUser.isAdmin,
          isRenovations: !!newUser.isRenovations, // Salva o novo campo
          isActive: true,
          avatarColor: 'bg-indigo-600' // Default color
      };

      onAddUser(user);
      setShowCreateModal(false);
      setNewUser({ name: '', login: '', email: '', password: '', isAdmin: false, isRenovations: false, isActive: true });
  };

  return (
    <div className="h-full flex flex-col">
       {/* Header Filters */}
       <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <UserCog className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Gestão de Usuários</h2>
                <p className="text-xs text-gray-500">Controle de acesso e permissões</p>
             </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-grow md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar usuário..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
             >
                <Plus className="w-4 h-4" />
                Novo Usuário
             </button>
          </div>
       </div>

       {/* Users Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-4 overflow-y-auto p-1 flex-1">
          {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} onUpdate={onUpdateUser} />
          ))}
          
          {filteredUsers.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum usuário encontrado.</p>
             </div>
          )}
       </div>

       {/* CREATE USER MODAL */}
       {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <UserCog className="w-5 h-5" />
                        Criar Novo Usuário
                    </h2>
                    <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white">✕</button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                        <input 
                            type="text"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Ana Silva"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Login</label>
                            <input 
                                type="text"
                                value={newUser.login}
                                onChange={(e) => setNewUser({...newUser, login: e.target.value})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="ana.silva"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
                            <input 
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="******"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
                        <input 
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="ana@empresa.com"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
                            <input 
                                type="checkbox"
                                id="newAdmin"
                                checked={newUser.isAdmin}
                                onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="newAdmin" className="text-sm font-medium text-gray-700 select-none cursor-pointer flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-gray-500" />
                                Usuário Administrador?
                            </label>
                        </div>

                        {/* Novo campo de Renovações */}
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
                            <input 
                                type="checkbox"
                                id="newRenovations"
                                checked={newUser.isRenovations}
                                onChange={(e) => setNewUser({...newUser, isRenovations: e.target.checked})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="newRenovations" className="text-sm font-medium text-gray-700 select-none cursor-pointer flex items-center gap-1">
                                <Users className="w-4 h-4 text-gray-500" />
                                Acesso Renovações?
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button 
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateUser}
                        disabled={!newUser.name || !newUser.login || !newUser.password}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Criar Usuário
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};
