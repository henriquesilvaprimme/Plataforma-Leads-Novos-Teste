
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User, DealInfo } from '../types';
import { Car, Phone, Calendar, DollarSign, Percent, CreditCard, Users, RefreshCw, Bell, Search, Shield, AlertTriangle, Edit, Check, Plus } from './Icons';

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
    const [isEditingUser, setIsEditingUser] = useState(!lead.assignedTo);
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">(""); 
    const [selectedUser, setSelectedUser] = useState<string>(lead.assignedTo || '');
    const [observation, setObservation] = useState<string>(lead.notes || '');
    const [scheduleDate, setScheduleDate] = useState<string>(lead.scheduledDate || '');

    const [showDealModal, setShowDealModal] = useState(false);
    const [dealForm, setDealForm] = useState<DealInfo & { leadName: string, cartaoPortoNovo: boolean }>({
        leadName: lead.name,
        insurer: lead.dealInfo?.insurer || '',
        paymentMethod: lead.dealInfo?.paymentMethod || '',
        netPremium: lead.dealInfo?.netPremium || 0,
        commission: lead.dealInfo?.commission || 0,
        installments: lead.dealInfo?.installments || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        cartaoPortoNovo: false
    });

    // Endorsement State
    const [showEndorseInfo, setShowEndorseInfo] = useState<string | null>(null);

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
        const updatedLead = {
            ...lead,
            status: selectedStatus as LeadStatus,
            notes: observation,
            scheduledDate: needsDate ? scheduleDate : lead.scheduledDate
        };
        onUpdate(updatedLead);
        setIsEditingStatus(false);
    };

    const handleSaveNotes = () => {
        const updatedLead = { ...lead, notes: observation };
        onUpdate(updatedLead);
        setIsEditingNotes(false);
    };

    const handleSaveDeal = () => {
        const closedLeadCopy: Lead = {
            ...lead,
            id: `${lead.id}_renewed_${Date.now()}`, 
            name: dealForm.leadName,
            status: LeadStatus.CLOSED,
            assignedTo: lead.assignedTo || "Henrique Silva",
            cartaoPortoNovo: dealForm.cartaoPortoNovo,
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
            <div className={`p-2 flex flex-col justify-between gap-0.5 ${isSplitView ? `border-r ${borderColor}` : ''}`}>
                <div className="flex flex-col gap-0.5">
                    
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 w-full pr-6 relative">
                            <div className="flex items-center flex-wrap gap-2">
                                <h3 className="font-bold text-base text-gray-900 leading-tight">{lead.name}</h3>
                                
                                {!isEditingStatus && lead.status !== LeadStatus.NEW && (
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(lead.status)}`}>
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

                        <div className="flex flex-col items-end gap-1">
                            {isScheduledToday && (
                                <div className="text-orange-600 bg-orange-50 p-1 rounded-md border border-orange-200 shadow-sm animate-pulse" title="Agendamento Hoje">
                                    <Bell className="w-3 h-3" />
                                </div>
                            )}

                             {/* Endorsement Alert Badges */}
                             {lead.endorsements && lead.endorsements.length > 0 && (
                                <div className="flex flex-col gap-0.5 items-end">
                                   {lead.endorsements.map(endorsement => (
                                      <button 
                                        key={endorsement.id}
                                        onClick={() => setShowEndorseInfo(endorsement.id === showEndorseInfo ? null : endorsement.id)}
                                        className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors"
                                      >
                                         <AlertTriangle className="w-3 h-3" />
                                         Endosso
                                      </button>
                                   ))}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Endorsement Info Popover (In-Card) */}
                    {showEndorseInfo && (
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-gray-700 animate-fade-in mb-1 mt-1">
                            {lead.endorsements?.filter(e => e.id === showEndorseInfo).map(e => (
                               <div key={e.id} className="space-y-0.5">
                                  <p className="font-bold text-yellow-800 border-b border-yellow-200 pb-0.5 mb-0.5">Endosso</p>
                                  <p>Veículo: <b>{e.vehicleModel}</b></p>
                                  <p>Prêmio: <b>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.netPremium)}</b></p>
                                  <p>Vigência: <b>{formatDisplayDate(e.startDate)}</b></p>
                               </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-0.5 text-gray-800 text-xs">
                        <div className="flex items-center gap-2">
                            <Car className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-900">{lead.vehicleModel}</span>
                            <span className="text-[10px] text-gray-500">({lead.vehicleYear})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{lead.phone}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Seguradora: 
                                <span className="text-gray-900 ml-1">{lead.dealInfo?.insurer || '-'}</span>
                            </span>
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
                            <span className="text-gray-700 text-[10px] uppercase font-bold">Vigência Final:</span>
                            <span className="text-indigo-700 font-bold text-[10px] bg-indigo-50 px-1.5 rounded border border-indigo-100">
                                {formatDisplayDate(lead.dealInfo?.endDate)}
                            </span>
                        </div>

                        <div className="mt-1">
                            {isEditingStatus && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 block">
                                        Status do Lead
                                    </label>
                                    <div className="flex gap-1">
                                        <select 
                                            className="w-36 bg-white border border-gray-300 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm font-medium text-gray-700"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                                        >
                                            <option value="">-- Selecione --</option>
                                            {Object.values(LeadStatus).map(s => (
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
                                </div>
                            )}

                            {!isEditingStatus && (
                                <div className="flex items-center justify-between">
                                    {!isLocked && (
                                        <button 
                                            onClick={() => setIsEditingStatus(true)}
                                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-3 py-1 rounded text-[10px] font-bold transition-colors shadow-sm uppercase tracking-wide w-auto"
                                        >
                                            Alterar Status
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
                            
                            {!isAdmin ? (
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200 w-fit max-w-full">
                                    <span className="text-xs font-bold text-gray-700 truncate">
                                        Atribuído para: <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                                    </span>
                                </div>
                            ) : (
                                isEditingUser ? (
                                    <div className="flex gap-1 w-fit max-w-full">
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
                                            onClick={handleConfirmUser}
                                            className="bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm uppercase tracking-wide"
                                        >
                                            Atribuir
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200 w-fit max-w-full">
                                        <span className="text-xs font-bold text-gray-700 truncate">
                                            Atribuído para: <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
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
                            <div className="flex justify-between items-end mb-0.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block">Observações</label>
                                {!isEditingStatus && (
                                    isEditingNotes ? (
                                        <button 
                                            onClick={handleSaveNotes}
                                            className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 hover:bg-green-100"
                                        >
                                            <Check className="w-3 h-3" /> Confirmar
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditingNotes(true)}
                                            className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                                        >
                                            <Edit className="w-3 h-3" /> Alterar
                                        </button>
                                    )
                                )}
                            </div>
                            <textarea 
                                disabled={!isEditingStatus && !isEditingNotes}
                                placeholder="Insira os detalhes aqui..."
                                className={`
                                    w-full border rounded px-2 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none flex-1 shadow-inner
                                    ${(!isEditingStatus && !isEditingNotes) ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
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
                                    <option value="CP">Cartão Porto Seguro</option>
                                    <option value="CC">Cartão de Crédito</option>
                                    <option value="Debito">Débito</option>
                                    <option value="Boleto">Boleto</option>
                                 </select>
                                 {dealForm.paymentMethod === 'CP' && (
                                    <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                                        <input 
                                            type="checkbox" 
                                            id="cpNovo"
                                            checked={dealForm.cartaoPortoNovo}
                                            onChange={(e) => setDealForm({...dealForm, cartaoPortoNovo: e.target.checked})}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="cpNovo" className="text-xs font-bold text-blue-800 uppercase select-none cursor-pointer">
                                            Cartão Porto Novo?
                                        </label>
                                    </div>
                                 )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prêmio Líquido (R$)</label>
                                <input 
                                    type="text"
                                    placeholder="0,00"
                                    value={dealForm.netPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        const val = raw ? parseInt(raw, 10) / 100 : 0;
                                        setDealForm(prev => ({ ...prev, netPremium: val }));
                                    }}
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

export const RenewalList: React.FC<RenewalListProps> = ({ leads, users, onUpdateLead, onAddLead, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState<string>(() => new Date().toISOString().slice(0, 7));
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // State for creating a new renewal manually
    const [newRenewalForm, setNewRenewalForm] = useState({
        name: '', phone: '', vehicleModel: '', vehicleYear: '', city: '',
        insurer: '', paymentMethod: '', netPremium: 0, commission: 0, installments: '',
        startDate: '', endDate: '', assignedTo: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDate, filterStatus]);

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase();
        const name = lead.name || '';
        const phone = lead.phone || '';
        const matchesSearch = name.toLowerCase().includes(term) || phone.includes(term);

        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;

        let matchesDate = true;
        if (filterDate) {
            const endDate = lead.dealInfo?.endDate || '';
            matchesDate = endDate.startsWith(filterDate);
        }

        // Somente Admin vê tudo. Outros (incluindo Renovações e Comum) veem apenas o que lhes foi atribuído
        const isAssignedToUser = !currentUser || currentUser.isAdmin || lead.assignedTo === currentUser.name; 

        return matchesSearch && matchesStatus && matchesDate && isAssignedToUser;
    }).sort((a, b) => {
         const dateA = a.dealInfo?.endDate ? new Date(a.dealInfo.endDate).getTime() : 0;
         const dateB = b.dealInfo?.endDate ? new Date(b.dealInfo.endDate).getTime() : 0;
         return dateA - dateB || 0;
    });

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

    const handleCreateRenewal = () => {
         const newLead: Lead = {
           id: Date.now().toString(),
           name: newRenewalForm.name,
           phone: newRenewalForm.phone,
           vehicleModel: newRenewalForm.vehicleModel,
           vehicleYear: newRenewalForm.vehicleYear,
           city: newRenewalForm.city,
           insuranceType: 'Renovação', 
           status: LeadStatus.NEW,
           createdAt: new Date().toISOString(),
           assignedTo: newRenewalForm.assignedTo,
           email: '', notes: '',
           dealInfo: {
               insurer: newRenewalForm.insurer,
               paymentMethod: newRenewalForm.paymentMethod,
               netPremium: newRenewalForm.netPremium,
               commission: newRenewalForm.commission,
               installments: newRenewalForm.installments,
               startDate: newRenewalForm.startDate,
               endDate: newRenewalForm.endDate,
           }
         };
         onAddLead(newLead);
         setShowCreateModal(false);
         setNewRenewalForm({
            name: '', phone: '', vehicleModel: '', vehicleYear: '', city: '',
            insurer: '', paymentMethod: '', netPremium: 0, commission: 0, installments: '',
            startDate: '', endDate: '', assignedTo: ''
         });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Renovações</h2>
                    </div>
                </div>
                
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
                        {Object.values(LeadStatus).filter(s => s !== LeadStatus.CLOSED).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    
                    {(currentUser?.isAdmin || currentUser?.isRenovations) && (
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-all shadow-sm flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            Nova
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 pb-4 overflow-y-auto w-full px-1 flex-1">
                {paginatedLeads.map((lead) => (
                    <RenewalCard 
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
                        <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium">Nenhuma renovação encontrada.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4 bg-white border-t border-gray-200 mt-auto">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 text-gray-700">Anterior</button>
                    <span className="text-sm text-gray-600 font-medium">Página {currentPage} de {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 text-gray-700">Próximo</button>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2"><RefreshCw className="w-5 h-5" />Nova Renovação</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                                    <input type="text" value={newRenewalForm.name} onChange={(e) => setNewRenewalForm({...newRenewalForm, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
                                    <input type="text" value={newRenewalForm.phone} onChange={(e) => setNewRenewalForm({...newRenewalForm, phone: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Modelo do Veículo</label>
                                    <input type="text" value={newRenewalForm.vehicleModel} onChange={(e) => setNewRenewalForm({...newRenewalForm, vehicleModel: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ano/Modelo</label>
                                    <input type="text" value={newRenewalForm.vehicleYear} onChange={(e) => setNewRenewalForm({...newRenewalForm, vehicleYear: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cidade</label>
                                    <input type="text" value={newRenewalForm.city} onChange={(e) => setNewRenewalForm({...newRenewalForm, city: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100 my-2 pt-2">
                                <p className="text-xs font-bold text-indigo-600 mb-3 uppercase">Dados da Apólice Anterior</p>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seguradora</label>
                                        <select 
                                            value={newRenewalForm.insurer}
                                            onChange={(e) => setNewRenewalForm({...newRenewalForm, insurer: e.target.value})}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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
                                            value={newRenewalForm.paymentMethod}
                                            onChange={(e) => setNewRenewalForm({...newRenewalForm, paymentMethod: e.target.value})}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">Selecione</option>
                                            <option value="CP">Cartão Porto Seguro</option>
                                            <option value="CC">Cartão de Crédito</option>
                                            <option value="Debito">Débito</option>
                                            <option value="Boleto">Boleto</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prêmio Líquido</label>
                                        <input 
                                            type="text" 
                                            placeholder="0,00"
                                            value={newRenewalForm.netPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                const val = raw ? parseInt(raw, 10) / 100 : 0;
                                                setNewRenewalForm({...newRenewalForm, netPremium: val});
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Comissão (%)</label>
                                        <input type="number" value={newRenewalForm.commission || ''} onChange={(e) => setNewRenewalForm({...newRenewalForm, commission: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Parcelamento</label>
                                        <select value={newRenewalForm.installments} onChange={(e) => setNewRenewalForm({...newRenewalForm, installments: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                            <option value="">Selecione</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={`${num}x`}>{num}x</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Início Vigência</label>
                                        <input type="date" value={newRenewalForm.startDate} onChange={(e) => setNewRenewalForm({...newRenewalForm, startDate: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Final Vigência</label>
                                        <input type="date" value={newRenewalForm.endDate} onChange={(e) => setNewRenewalForm({...newRenewalForm, endDate: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável</label>
                                     <select value={newRenewalForm.assignedTo} onChange={(e) => setNewRenewalForm({...newRenewalForm, assignedTo: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                        <option value="">-- Selecione --</option>
                                        {users.filter(u => u.isActive).map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                     </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3 mt-auto bg-gray-50 border-t border-gray-100 py-4">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-white hover:shadow-sm font-bold text-sm transition-all">Cancelar</button>
                            <button onClick={handleCreateRenewal} disabled={!newRenewalForm.name} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">Criar Renovação</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
