
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User, DealInfo } from '../types';
import { Car, Phone, Calendar, DollarSign, Percent, CreditCard, Users, RefreshCw, Bell, Search, Shield } from './Icons';

interface RenewalListProps {
  leads: Lead[];
  users: User[];
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

const RenewalCard: React.FC<{ lead: Lead, users: User[], onUpdate: (l: Lead) => void, onAdd: (l: Lead) => void, currentUser: User | null }> = ({ lead, users, onUpdate, onAdd, currentUser }) => {
    const [isEditingStatus, setIsEditingStatus] = useState(lead.status === LeadStatus.NEW);
    const [isEditingUser, setIsEditingUser] = useState(false);

    const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">(""); 
    const [selectedUser, setSelectedUser] = useState<string>(lead.assignedTo || '');
    const [observation, setObservation] = useState<string>(lead.notes || '');
    const [scheduleDate, setScheduleDate] = useState<string>(lead.scheduledDate || '');

    const [showDealModal, setShowDealModal] = useState(false);
    const [dealForm, setDealForm] = useState<DealInfo & { leadName: string }>({
        leadName: lead.name,
        insurer: lead.dealInfo?.insurer || '',
        paymentMethod: lead.dealInfo?.paymentMethod || '',
        netPremium: lead.dealInfo?.netPremium || 0,
        commission: lead.dealInfo?.commission || 0,
        installments: lead.dealInfo?.installments || '',
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
                } catch(e) { console.error(e) }
            }
        }
    }, [dealForm.startDate]);

    const effectiveStatus = isEditingStatus ? (selectedStatus as LeadStatus) : (lead.status);
    const needsObservation = [LeadStatus.IN_CONTACT, LeadStatus.NO_CONTACT, LeadStatus.SCHEDULED].includes(effectiveStatus);
    const needsDate = effectiveStatus === LeadStatus.SCHEDULED;
    const isSplitView = needsObservation || needsDate;
    const isScheduledToday = lead.status === LeadStatus.SCHEDULED && isToday(lead.scheduledDate);

    useEffect(() => {
        setObservation(lead.notes || '');
        setScheduleDate(lead.scheduledDate || '');
        if (lead.status !== LeadStatus.NEW) {
             setSelectedStatus(lead.status);
        } else {
             setSelectedStatus("");
        }
        setSelectedUser(lead.assignedTo || '');
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
        const updatedLead = {
            ...lead,
            status: selectedStatus as LeadStatus,
            notes: observation,
            scheduledDate: needsDate ? scheduleDate : lead.scheduledDate
        };
        onUpdate(updatedLead);
        setIsEditingStatus(false);
    };

    const handleSaveDeal = () => {
        const closedLeadCopy: Lead = {
            ...lead,
            id: `${lead.id}_renewed_${Date.now()}`, 
            name: dealForm.leadName,
            status: LeadStatus.CLOSED,
            assignedTo: lead.assignedTo || "Henrique Silva",
            dealInfo: {
                insurer: dealForm.insurer,
                paymentMethod: dealForm.paymentMethod,
                netPremium: dealForm.netPremium,
                commission: dealForm.commission,
                installments: dealForm.installments,
                startDate: dealForm.startDate,
                endDate: dealForm.endDate
            },
            createdAt: new Date().toISOString()
        };
        onAdd(closedLeadCopy);

        const updatedLead: Lead = {
            ...lead,
            name: dealForm.leadName,
            status: LeadStatus.NEW,
            assignedTo: '',
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
        
        setShowDealModal(false);
        setIsEditingStatus(false);
        setSelectedStatus(""); 
        setSelectedUser("");
    };

    const handleConfirmUser = () => {
        const userToAssign = selectedUser || "Henrique Silva";
        const updatedLead = { ...lead, assignedTo: userToAssign };
        setSelectedUser(userToAssign);
        onUpdate(updatedLead);
        setIsEditingUser(false);
    };

    const getStatusColor = (status: LeadStatus | "") => {
        switch(status) {
          case LeadStatus.NEW: return 'bg-blue-100 text-blue-800 border-blue-200';
          case LeadStatus.CLOSED: return 'bg-green-100 text-green-800 border-green-200';
          case LeadStatus.SCHEDULED: return 'bg-purple-100 text-purple-800 border-purple-200';
          case LeadStatus.LOST: return 'bg-red-100 text-red-800 border-red-200';
          case LeadStatus.IN_CONTACT: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          default: return 'bg-gray-100 text-gray-800 hidden'; 
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
            ${cardStyle} rounded-xl shadow-sm border transition-all duration-300 w-full text-sm relative
            ${isSplitView ? 'md:grid md:grid-cols-2' : 'flex flex-col'}
        `}>
            <div className={`p-1.5 flex flex-col justify-between gap-0 ${isSplitView ? `border-r ${borderColor}` : ''}`}>
                <div className="flex flex-col gap-0">
                    
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base text-gray-900 leading-tight">{lead.name}</h3>
                                {/* Status moved next to name */}
                                {!isEditingStatus && lead.status !== LeadStatus.NEW && (
                                    <span className={`inline-block px-1.5 py-0 rounded-md text-[9px] font-bold uppercase tracking-wide border ${getStatusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-h-[16px]">
                                {lead.status === LeadStatus.SCHEDULED && lead.scheduledDate && !isEditingStatus && (
                                    <span className="text-[9px] font-medium text-purple-700 flex items-center gap-1 bg-purple-50 px-1.5 py-0 rounded-md border border-purple-200 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(lead.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isScheduledToday && (
                            <div className="text-orange-600 bg-orange-50 p-0.5 rounded-md border border-orange-200 shadow-sm animate-pulse" title="Agendamento Hoje">
                                <Bell className="w-3 h-3" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-0 text-gray-800 text-xs mt-0.5">
                        <div className="flex items-center gap-2">
                            <Car className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-900">{lead.vehicleModel}</span>
                            <span className="text-[9px] text-gray-500">({lead.vehicleYear})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{lead.phone}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Prêmio: 
                                <span className="text-gray-900 ml-1">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.dealInfo?.netPremium || 0)}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Percent className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Comissão: 
                                <span className="text-green-700 font-bold ml-1">{lead.dealInfo?.commission}%</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Pagamento/Parc: 
                                <span className="text-gray-900 ml-1">{lead.dealInfo?.installments}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="text-gray-700 text-[9px] uppercase font-bold">Vigência Final:</span>
                            <span className="text-indigo-700 font-bold text-[9px] bg-indigo-50 px-1.5 rounded border border-indigo-100">
                                {formatDisplayDate(lead.dealInfo?.endDate)}
                            </span>
                        </div>

                        <div className="mt-0.5">
                            {isEditingStatus ? (
                                <div className="flex gap-1 mt-1">
                                    <select 
                                        className="w-36 bg-white border border-gray-300 text-[10px] rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm font-medium text-gray-700"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                                    >
                                        <option value="">-- Selecione Status --</option>
                                        {Object.values(LeadStatus).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleConfirmStatus}
                                        disabled={!isValidToSave()}
                                        className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold transition-all shadow-sm border
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
                                    {!isLocked && (
                                        <button 
                                            onClick={() => setIsEditingStatus(true)}
                                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded text-[9px] font-bold transition-colors shadow-sm uppercase tracking-wide w-auto mt-0.5"
                                        >
                                            Alterar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-0 pt-0.5 border-t border-gray-100 mt-0.5">
                        <div className="flex flex-col gap-0">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3" /> Responsável
                            </label>
                            
                            {!isAdmin ? (
                                <div className="flex items-center justify-between bg-gray-50 p-1 rounded border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-700 truncate mr-2">
                                        <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                                    </span>
                                </div>
                            ) : (
                                isEditingUser || !selectedUser ? (
                                    <div className="flex gap-1">
                                        <select 
                                            className="w-36 bg-white border border-gray-300 text-[10px] rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm text-gray-700 font-medium"
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
                                            onClick={handleConfirmUser}
                                            className="bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold transition-colors shadow-sm uppercase tracking-wide"
                                        >
                                            Atribuir
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-gray-50 p-1 rounded border border-gray-200">
                                        <span className="text-[10px] font-bold text-gray-700 truncate mr-2">
                                            <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                                        </span>
                                        <button 
                                            onClick={() => setIsEditingUser(true)}
                                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-1.5 py-0 rounded text-[9px] font-bold transition-colors shadow-sm uppercase tracking-wide"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-0.5 pt-0.5 flex items-center justify-end border-t border-gray-200">
                    <div className="text-[9px] text-gray-400 font-medium">
                        Criado em: {formatCreationDate(lead.createdAt)}
                    </div>
                </div>
            </div>

            {isSplitView && (
                <div className={`
                    p-1.5 flex flex-col gap-1 animate-fade-in border-l
                    ${lead.status === LeadStatus.CLOSED ? borderColor : `bg-gray-50 ${borderColor}`}
                `}>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-0.5">
                        Complemento
                    </h4>
                    
                    {needsDate && (
                        <div>
                            <label className="text-[9px] font-bold text-gray-500 uppercase mb-0 block">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Data e Hora</span>
                            </label>
                            <input 
                                type="datetime-local" 
                                disabled={!isEditingStatus}
                                className={`
                                    w-full border rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm
                                    ${!isEditingStatus ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
                                `}
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                    )}

                    {needsObservation && (
                            <div className="flex-1 flex flex-col">
                            <label className="text-[9px] font-bold text-gray-500 uppercase mb-0 block">Observações</label>
                            <textarea 
                                disabled={!isEditingStatus}
                                placeholder="Insira os detalhes aqui..."
                                className={`
                                    w-full border rounded px-1 py-1 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none flex-1 shadow-inner
                                    ${!isEditingStatus ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
                                `}
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                            />
                        </div>
                    )}
                    
                    {isEditingStatus && (
                        <div className="text-[9px] text-gray-400 italic text-center">
                            Preencha e clique em Confirmar.
                        </div>
                    )}
                </div>
            )}
        </div>

        {showDealModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Registrar Fechamento
                        </h2>
                        <button onClick={() => setShowDealModal(false)} className="text-white/80 hover:text-white">✕</button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto">
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
                    <div className="p-6 pt-0 flex gap-3 mt-auto">
                        <button onClick={() => setShowDealModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm">Cancelar</button>
                        <button onClick={handleSaveDeal} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm shadow-md">Confirmar Venda</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
