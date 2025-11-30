
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User, DealInfo } from '../types';
import { Search, Plus, Car, Calendar, MapPin, Shield, Phone, BrainCircuit, Users, Bell, ChevronRight } from './Icons';

interface LeadListProps {
  leads: Lead[];
  users: User[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onAddLead: (lead: Lead) => void;
  currentUser: User | null;
}

const INSURERS_LIST = [
  "Porto Seguro", "Azul Seguros", "Itau Seguro", "Tokio Marine", "Yelum Seguros", "Allianz Seguros", 
  "Bradesco Seguros", "Suhai Seguros", "Zurich Seguros", "Aliro Seguros", "Mitsui Seguros", 
  "Hdi Seguros", "Alfa Seguros", "Mapfre Seguros", "Demais Seguradoras"
];

const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    if (dateString.includes('-')) {
        try {
            const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
            return date.toLocaleDateString('pt-BR');
        } catch (e) { return dateString; }
    }
    return dateString;
};

const isToday = (dateString?: string) => {
    if (!dateString) return false;
    if (dateString.includes('-')) {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }
    return false;
};

const formatCreationDate = (dateString?: string) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try {
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) { return dateString; }
};

const LeadCard: React.FC<{ lead: Lead; users: User[]; onUpdate: (l: Lead) => void; onAdd: (l: Lead) => void; currentUser: User | null }> = ({ lead, users, onUpdate, onAdd, currentUser }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(lead.status === LeadStatus.NEW);
  const [isEditingUser, setIsEditingUser] = useState(!lead.assignedTo);

  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">(lead.status === LeadStatus.NEW ? "" : lead.status); 
  const [selectedUser, setSelectedUser] = useState<string>(lead.assignedTo || '');
  const [observation, setObservation] = useState<string>(lead.notes || '');
  const [scheduleDate, setScheduleDate] = useState<string>(lead.scheduledDate || '');

  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState<DealInfo & { leadName: string }>({
      leadName: lead.name,
      insurer: '',
      paymentMethod: '',
      netPremium: 0,
      commission: 0,
      installments: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
  });

  const isAdmin = currentUser?.isAdmin;
  const isLocked = (lead.status === LeadStatus.CLOSED || lead.status === LeadStatus.LOST) && !isAdmin;

  useEffect(() => {
      if (dealForm.startDate) {
          let dateStr = dealForm.startDate;
          if (dateStr.includes('/')) {
              const [d, m, y] = dateStr.split('/');
              dateStr = `${y}-${m}-${d}`;
          }

          const start = new Date(dateStr);
          if (!isNaN(start.getTime())) {
              const end = new Date(start);
              end.setFullYear(end.getFullYear() + 1);
              try {
                  setDealForm(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
              } catch(e) {}
          }
      }
  }, [dealForm.startDate]);

  const effectiveStatus = isEditingStatus ? (selectedStatus as LeadStatus) : lead.status;
  const needsObservation = [LeadStatus.IN_CONTACT, LeadStatus.NO_CONTACT, LeadStatus.SCHEDULED].includes(effectiveStatus);
  const needsDate = effectiveStatus === LeadStatus.SCHEDULED;
  const hasDealInfo = lead.status === LeadStatus.CLOSED && !!lead.dealInfo;
  const isSplitView = needsObservation || needsDate || hasDealInfo;
  const isScheduledToday = lead.status === LeadStatus.SCHEDULED && isToday(lead.scheduledDate);

  useEffect(() => {
    setObservation(lead.notes || '');
    setScheduleDate(lead.scheduledDate || '');
    if (!lead.assignedTo) setIsEditingUser(true);
    setDealForm(prev => ({ ...prev, leadName: lead.name }));
  }, [lead]);

  const isValidToSave = () => {
    if (!selectedStatus) return false; 
    if (selectedStatus === LeadStatus.SCHEDULED) {
      return observation.trim().length > 0 && scheduleDate.length > 0;
    }
    if (selectedStatus === LeadStatus.IN_CONTACT || selectedStatus === LeadStatus.NO_CONTACT) {
      return observation.trim().length > 0;
    }
    return true; 
  };

  const handleConfirmStatus = () => {
    if (!isValidToSave()) return;
    if (selectedStatus === LeadStatus.CLOSED) {
        setShowDealModal(true);
        return;
    }
    const newStatus = selectedStatus as LeadStatus;
    const updatedLead = {
      ...lead,
      status: newStatus,
      notes: observation,
      scheduledDate: needsDate ? scheduleDate : lead.scheduledDate
    };
    onUpdate(updatedLead);
    setIsEditingStatus(false);
  };

  const handleSaveDeal = () => {
      const updatedLead: Lead = {
          ...lead,
          name: dealForm.leadName,
          status: LeadStatus.CLOSED,
          dealInfo: {
              insurer: dealForm.insurer,
              paymentMethod: dealForm.paymentMethod,
              netPremium: dealForm.netPremium,
              commission: dealForm.commission,
              installments: dealForm.installments,
              startDate: dealForm.startDate,
              endDate: dealForm.endDate
          }
      };
      onUpdate(updatedLead);
      const renewalCopy: Lead = {
          ...updatedLead,
          id: `${lead.id}_renewal_copy_${Date.now()}`,
          createdAt: new Date().toISOString(),
          insuranceType: 'Renovação',
          status: LeadStatus.NEW,
          assignedTo: '',
      };
      onAdd(renewalCopy);
      setShowDealModal(false);
      setIsEditingStatus(false);
  };

  const handleConfirmUser = () => {
      if (!selectedUser) return;
      const updatedLead = { ...lead, assignedTo: selectedUser };
      onUpdate(updatedLead);
      setIsEditingUser(false);
  };

  const getStatusColor = (status: LeadStatus) => {
    switch(status) {
      case LeadStatus.NEW: return 'bg-blue-100 text-blue-800 border-blue-200';
      case LeadStatus.CLOSED: return 'bg-green-100 text-green-800 border-green-200';
      case LeadStatus.SCHEDULED: return 'bg-purple-100 text-purple-800 border-purple-200';
      case LeadStatus.LOST: return 'bg-red-100 text-red-800 border-red-200';
      case LeadStatus.IN_CONTACT: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const cardStyle = lead.status === LeadStatus.CLOSED 
    ? 'bg-green-50 border-green-200' 
    : lead.status === LeadStatus.LOST 
      ? 'bg-red-50 border-red-200' 
      : 'bg-white border-gray-200';
  
  const borderColor = lead.status === LeadStatus.CLOSED ? 'border-green-200' : 'border-gray-200';

  return (
    <>
    <div className={`
        ${cardStyle} rounded-xl shadow-sm border transition-all duration-300 w-full text-base relative
        ${isSplitView ? 'md:grid md:grid-cols-2' : 'flex flex-col'}
    `}>
      <div className={`p-2 flex flex-col justify-between gap-0.5 ${isSplitView ? `border-r ${borderColor}` : ''}`}>
        
        <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-gray-900 leading-tight">{lead.name}</h3>
                        {lead.aiScore !== undefined && (
                            <div className="flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-700 border border-indigo-100">
                            <BrainCircuit className="w-3 h-3" />
                            {lead.aiScore}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                         {!isEditingStatus && (
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(lead.status)}`}>
                                {lead.status}
                            </span>
                         )}
                        {lead.status === LeadStatus.SCHEDULED && lead.scheduledDate && !isEditingStatus && (
                            <span className="text-[10px] font-medium text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                <Calendar className="w-3 h-3" />
                                {new Date(lead.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                {isScheduledToday && (
                    <div className="text-orange-600 bg-orange-50 p-1 rounded-md border border-orange-200 shadow-sm animate-pulse" title="Agendamento Hoje">
                        <Bell className="w-3 h-3" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-0.5 text-gray-800 text-xs">
                <div className="flex items-center gap-2">
                    <Car className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">{lead.vehicleModel}</span>
                    <span className="text-[10px] text-gray-500">({lead.vehicleYear})</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-gray-700">{lead.city}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-gray-700">{lead.phone}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="font-medium text-indigo-700">{lead.insuranceType}</span>
                </div>

                <div className="mt-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 block">
                        Status do Lead
                    </label>
                    
                    {isEditingStatus ? (
                        <div className="flex gap-1">
                            <select 
                                className="w-36 bg-white border border-gray-300 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm font-medium text-gray-700"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                            >
                                <option value="">-- Selecione --</option>
                                {Object.values(LeadStatus).filter(s => s !== LeadStatus.NEW).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleConfirmStatus}
                                disabled={!isValidToSave()}
                                className={`
                                    px-3 py-1 rounded text-xs font-bold transition-all shadow-sm border
                                    ${isValidToSave() 
                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' 
                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}
                                `}
                            >
                                Confirmar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                             {/* Esconde botão alterar se estiver bloqueado (fechado/perdido) e não for admin */}
                             {!isLocked && (
                                <button 
                                    onClick={() => setIsEditingStatus(true)}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-3 py-1 rounded text-[10px] font-bold transition-colors shadow-sm uppercase tracking-wide w-auto"
                                >
                                    Alterar
                                </button>
                             )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-0.5 pt-1 border-t border-gray-100 mt-0.5">
                 <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3" /> Responsável
                    </label>
                    
                    {/* Se não for admin, só mostra o texto. Se for admin, mostra controles */}
                    {!isAdmin ? (
                        <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-200">
                             <span className="text-xs font-bold text-gray-700 truncate mr-2">
                                Atribuído para: <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                             </span>
                        </div>
                    ) : (
                        isEditingUser ? (
                            <div className="flex gap-1">
                                <select 
                                    className="w-36 bg-white border border-gray-300 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm text-gray-700 font-medium"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">-- Selecione --</option>
                                    {users.filter(u => u.isActive).map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => { 
                                        const me = "Henrique Silva"; 
                                        setSelectedUser(me);
                                        if(selectedUser === me) {
                                            const updated = { ...lead, assignedTo: me };
                                            onUpdate(updated);
                                            setIsEditingUser(false);
                                        } else {
                                            handleConfirmUser();
                                        }
                                    }}
                                    className="bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm uppercase tracking-wide"
                                >
                                    Atribuir
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-200">
                                <span className="text-xs font-bold text-gray-700 truncate mr-2">
                                    Atribuído para: <span className="text-indigo-700">{lead.assignedTo}</span>
                                </span>
                                <button 
                                    onClick={() => setIsEditingUser(true)}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold transition-colors shadow-sm uppercase tracking-wide"
                                >
                                    Alterar
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>

        <div className="mt-1 pt-1 flex items-center justify-end border-t border-gray-200">
            <div className="text-[10px] text-gray-400 font-medium">
                Criado em: {formatCreationDate(lead.createdAt)}
            </div>
        </div>
      </div>

      {isSplitView && (
        <div className={`
            p-2 flex flex-col gap-2 animate-fade-in border-l
            ${lead.status === LeadStatus.CLOSED ? borderColor : `bg-gray-50 ${borderColor}`}
        `}>
            
            {hasDealInfo ? (
                <div className="flex flex-col gap-1 h-full">
                     <h4 className="text-xs font-bold text-green-700 uppercase tracking-wide border-b border-green-200 pb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3"/> Venda Confirmada
                     </h4>
                     <div className="flex-1 text-xs space-y-1 overflow-y-auto text-gray-700">
                        <div className="grid grid-cols-2 gap-1">
                            <div>
                                <span className="block text-gray-400 text-[10px] uppercase">Seguradora</span>
                                <span className="font-semibold">{lead.dealInfo?.insurer}</span>
                            </div>
                             <div>
                                <span className="block text-gray-400 text-[10px] uppercase">Pagamento</span>
                                <span className="font-semibold">{lead.dealInfo?.installments}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                             <div>
                                <span className="block text-gray-400 text-[10px] uppercase">Prêmio</span>
                                <span className="font-semibold text-green-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.dealInfo?.netPremium || 0)}
                                </span>
                            </div>
                             <div>
                                <span className="block text-gray-400 text-[10px] uppercase">Comissão</span>
                                <span className="font-semibold">{lead.dealInfo?.commission}%</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1">
                             <span className="block text-gray-400 text-[10px] uppercase">Vigência</span>
                             <span className="font-medium block mt-0.5">
                                {formatDisplayDate(lead.dealInfo?.startDate)}
                                <span className="mx-1 text-gray-400">até</span> 
                                {formatDisplayDate(lead.dealInfo?.endDate)}
                             </span>
                        </div>
                     </div>
                </div>
            ) : (
                <>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1">
                        Complemento
                    </h4>
                    
                    {needsDate && (
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-0.5 block">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Data e Hora</span>
                            </label>
                            <input 
                                type="datetime-local" 
                                disabled={!isEditingStatus}
                                className={`
                                    w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm
                                    ${!isEditingStatus ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
                                `}
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                    )}

                    {needsObservation && (
                            <div className="flex-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-0.5 block">Observações</label>
                            <textarea 
                                disabled={!isEditingStatus}
                                placeholder="Insira os detalhes aqui..."
                                className={`
                                    w-full border rounded px-2 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none flex-1 shadow-inner
                                    ${!isEditingStatus ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
                                `}
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                            />
                        </div>
                    )}
                    
                    {isEditingStatus && (
                        <div className="text-[10px] text-gray-400 italic text-center">
                            Preencha e clique em Confirmar.
                        </div>
                    )}
                </>
            )}
        </div>
      )}
    </div>

    {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Registrar Fechamento
                    </h2>
                    <button onClick={() => setShowDealModal(false)} className="text-white/80 hover:text-white">✕</button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Cliente</label>
                        <input 
                            type="text"
                            value={dealForm.leadName}
                            onChange={(e) => setDealForm({...dealForm, leadName: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seguradora</label>
                            <select 
                                value={dealForm.insurer}
                                onChange={(e) => setDealForm({...dealForm, insurer: e.target.value})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                            >
                                <option value="">Selecione</option>
                                {INSURERS_LIST.map(ins => (
                                    <option key={ins} value={ins}>{ins}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Meio de Pagamento</label>
                             <select 
                                value={dealForm.paymentMethod}
                                onChange={(e) => setDealForm({...dealForm, paymentMethod: e.target.value})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                             >
                                <option value="">Selecione</option>
                                <option value="Cartão Porto Seguro">Cartão Porto Seguro</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                <option value="Débito">Débito</option>
                                <option value="Boleto">Boleto</option>
                             </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prêmio Líquido (R$)</label>
                            <input 
                                type="number"
                                placeholder="0,00"
                                value={dealForm.netPremium || ''}
                                onChange={(e) => setDealForm({...dealForm, netPremium: parseFloat(e.target.value)})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Comissão (%)</label>
                            <input 
                                type="number"
                                placeholder="%"
                                value={dealForm.commission || ''}
                                onChange={(e) => setDealForm({...dealForm, commission: parseFloat(e.target.value)})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Parcelamento</label>
                        <select
                            value={dealForm.installments}
                            onChange={(e) => setDealForm({...dealForm, installments: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                        >
                            <option value="">Selecione</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={`${num}x`}>{num}x</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Início Vigência</label>
                            <input 
                                type="date"
                                value={dealForm.startDate}
                                onChange={(e) => setDealForm({...dealForm, startDate: e.target.value})}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Final Vigência</label>
                            <input 
                                type="date"
                                value={dealForm.endDate}
                                disabled
                                className="w-full border border-gray-200 bg-gray-100 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={() => setShowDealModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm">Cancelar</button>
                    <button onClick={handleSaveDeal} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm shadow-md">Confirmar Venda</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export const LeadList: React.FC<LeadListProps> = ({ leads, users, onSelectLead, onUpdateLead, onAddLead, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(''); 
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
      name: '', vehicleModel: '', vehicleYear: '', city: '', phone: '', insuranceType: 'Novo', assignedTo: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterDate]);

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const name = lead.name || '';
    const phone = lead.phone || '';
    const matchesSearch = name.toLowerCase().includes(term) || phone.includes(term); 
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    let matchesDate = true;
    if (filterDate && lead.createdAt) {
        if(lead.createdAt.includes('-') && !lead.createdAt.includes('/')) {
            matchesDate = lead.createdAt.startsWith(filterDate);
        } else { matchesDate = true; }
    }

    // Filtro de Permissão: Se Admin vê tudo, caso contrário só vê os atribuídos a si mesmo
    const isAssignedToUser = !currentUser || currentUser.isAdmin || lead.assignedTo === currentUser.name;

    return matchesSearch && matchesStatus && matchesDate && isAssignedToUser;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleCreateLead = () => {
      const newLead: Lead = {
          id: Date.now().toString(),
          name: newLeadForm.name,
          vehicleModel: newLeadForm.vehicleModel,
          vehicleYear: newLeadForm.vehicleYear,
          city: newLeadForm.city,
          phone: newLeadForm.phone,
          insuranceType: newLeadForm.insuranceType,
          assignedTo: newLeadForm.assignedTo,
          status: LeadStatus.NEW,
          createdAt: new Date().toISOString(),
          email: '', notes: ''
      };
      onAddLead(newLead);
      setShowNewLeadModal(false);
      setNewLeadForm({ name: '', vehicleModel: '', vehicleYear: '', city: '', phone: '', insuranceType: 'Novo', assignedTo: '' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div><h2 className="text-xl font-bold text-gray-800">Meus Leads</h2></div>
        
        <div className="flex flex-col md:flex-row gap-2 flex-wrap">
          <div className="relative flex-grow md:flex-grow-0 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Nome ou Telefone..." 
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <input 
            type="month"
            className="border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-700"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <select 
            className="border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer text-gray-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos Status</option>
            {Object.values(LeadStatus).map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setShowNewLeadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-all shadow-sm flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-4 overflow-y-auto w-full px-1 flex-1">
        {paginatedLeads.map((lead) => (
            <LeadCard 
                key={lead.id} 
                lead={lead}
                users={users} 
                onUpdate={onUpdateLead}
                onAdd={onAddLead}
                currentUser={currentUser}
            />
        ))}

        {paginatedLeads.length === 0 && (
            <div className="py-10 text-center text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <Car className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum lead encontrado.</p>
            </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4 bg-white border-t border-gray-200 mt-auto">
            <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
            >
                Anterior
            </button>
            <span className="text-sm text-gray-600 font-medium">Página {currentPage} de {totalPages}</span>
            <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
            >
                Próximo
            </button>
        </div>
      )}

      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5" />Novo Lead</h2>
                    <button onClick={() => setShowNewLeadModal(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                        <input type="text" value={newLeadForm.name} onChange={(e) => setNewLeadForm({...newLeadForm, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Modelo do Veículo</label>
                            <input type="text" value={newLeadForm.vehicleModel} onChange={(e) => setNewLeadForm({...newLeadForm, vehicleModel: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ano/Modelo</label>
                            <input type="text" value={newLeadForm.vehicleYear} onChange={(e) => setNewLeadForm({...newLeadForm, vehicleYear: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cidade</label>
                            <input type="text" value={newLeadForm.city} onChange={(e) => setNewLeadForm({...newLeadForm, city: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
                            <input type="text" value={newLeadForm.phone} onChange={(e) => setNewLeadForm({...newLeadForm, phone: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Seguro</label>
                             <select value={newLeadForm.insuranceType} onChange={(e) => setNewLeadForm({...newLeadForm, insuranceType: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                <option value="Novo">Novo</option>
                                <option value="Renovação">Renovação</option>
                                <option value="Indicação">Indicação</option>
                             </select>
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável</label>
                             <select value={newLeadForm.assignedTo} onChange={(e) => setNewLeadForm({...newLeadForm, assignedTo: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                <option value="">-- Selecione --</option>
                                {users.filter(u => u.isActive).map(u => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                             </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0 flex gap-3 mt-auto bg-gray-50 border-t border-gray-100 py-4">
                    <button onClick={() => setShowNewLeadModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-white hover:shadow-sm font-bold text-sm transition-all">Cancelar</button>
                    <button onClick={handleCreateLead} disabled={!newLeadForm.name} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">Criar Lead</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
