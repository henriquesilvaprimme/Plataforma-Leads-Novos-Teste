
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, USERS_LIST, DealInfo } from '../types';
import { Car, Phone, Calendar, DollarSign, Percent, CreditCard, Users, RefreshCw, Bell, Search, Shield } from './Icons';

interface RenewalListProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onAddLead: (lead: Lead) => void;
}

const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    if (dateString.includes('-')) {
        try {
            const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return dateString;
        }
    }
    return dateString;
};

// Helper to check if a date string is today
const isToday = (dateString?: string) => {
    if (!dateString) return false;
    // Checagem robusta de data
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
    } catch (e) {
        return dateString;
    }
};

const RenewalCard: React.FC<{ lead: Lead, onUpdate: (l: Lead) => void, onAdd: (l: Lead) => void }> = ({ lead, onUpdate, onAdd }) => {
    // States for Edit Modes
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);

    // Form States
    const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">(""); 
    const [selectedUser, setSelectedUser] = useState<string>(lead.assignedTo || '');
    const [observation, setObservation] = useState<string>(lead.notes || '');
    const [scheduleDate, setScheduleDate] = useState<string>(lead.scheduledDate || '');

    // Deal Modal State
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

    // Calculate End Date whenever Start Date changes
    useEffect(() => {
        if (dealForm.startDate) {
            const start = new Date(dealForm.startDate);
            const end = new Date(start);
            end.setFullYear(end.getFullYear() + 1);
            setDealForm(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
        }
    }, [dealForm.startDate]);

    // Determines which status to use for layout logic (Editing ? selected : saved)
    const effectiveStatus = isEditingStatus ? (selectedStatus as LeadStatus) : (selectedStatus || lead.status);

    // Layout Logic
    const needsObservation = [LeadStatus.IN_CONTACT, LeadStatus.NO_CONTACT, LeadStatus.SCHEDULED].includes(effectiveStatus);
    const needsDate = effectiveStatus === LeadStatus.SCHEDULED;
    const isSplitView = needsObservation || needsDate;
    const isScheduledToday = lead.status === LeadStatus.SCHEDULED && isToday(lead.scheduledDate);

    // Sync state with props ONLY if they change significantly or on mount
    useEffect(() => {
        setObservation(lead.notes || '');
        setScheduleDate(lead.scheduledDate || '');
        if (lead.status !== LeadStatus.NEW) {
             setSelectedStatus(lead.status);
        } else {
             setSelectedStatus(""); // Ensure NEW maps to empty
        }
        setSelectedUser(lead.assignedTo || '');
        // Update deal form name if lead name changes
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

        // Se o status for FECHADO, abre o modal e interrompe o salvamento direto
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
        // 1. Criar uma CÓPIA do lead com status Fechado para a aba "Renovados"
        const closedLeadCopy: Lead = {
            ...lead,
            id: `${lead.id}_renewed_${Date.now()}`, // Gerar ID único para a cópia
            name: dealForm.leadName,
            status: LeadStatus.CLOSED,
            assignedTo: lead.assignedTo || "Henrique Silva", // Atribui ao usuário atual se vazio
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
        onAdd(closedLeadCopy); // Adiciona a cópia na lista global

        // 2. Atualizar o lead ORIGINAL na aba "Renovações" para resetar
        const updatedLead: Lead = {
            ...lead,
            name: dealForm.leadName, // Atualiza nome se mudou
            status: LeadStatus.NEW, // Reset Status to NEW (Empty)
            assignedTo: '',         // Reset Responsible to Empty
            dealInfo: {             // Atualiza os dados para o próximo ciclo/histórico do card
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
        // Reset local states visually
        setSelectedStatus(""); 
        setSelectedUser("");
    };

    const handleConfirmUser = () => {
        // If nothing selected, default to active user "Henrique Silva"
        const userToAssign = selectedUser || "Henrique Silva";
        
        const updatedLead = {
            ...lead,
            assignedTo: userToAssign
        };
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
          default: return 'bg-gray-100 text-gray-800 hidden'; // Hidden if empty
        }
    };

    // Define dynamic card style based on status
    const cardStyle = (selectedStatus === LeadStatus.CLOSED || lead.status === LeadStatus.CLOSED)
      ? 'bg-green-50 border-green-200' 
      : (selectedStatus === LeadStatus.LOST || lead.status === LeadStatus.LOST)
        ? 'bg-red-50 border-red-200' 
        : 'bg-white border-gray-200';
    
    const borderColor = (selectedStatus === LeadStatus.CLOSED || lead.status === LeadStatus.CLOSED) ? 'border-green-200' : 'border-gray-200';

    return (
        <>
        <div className={`
            ${cardStyle} rounded-lg shadow-sm border transition-all duration-300 w-full text-sm relative
            ${isSplitView ? 'md:grid md:grid-cols-2' : 'flex flex-col'}
        `}>
            
            {/* LEFT COLUMN: All Data + Controls */}
            <div className={`p-3 flex flex-col justify-between ${isSplitView ? `border-r ${borderColor}` : ''}`}>
                <div className="flex flex-col gap-3">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-gray-900 leading-tight">{lead.name}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-h-[20px]">
                                {!isEditingStatus && selectedStatus && (
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(selectedStatus)}`}>
                                        {selectedStatus}
                                    </span>
                                )}
                                {lead.status === LeadStatus.SCHEDULED && lead.scheduledDate && !isEditingStatus && (
                                    <span className="text-xs font-medium text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(lead.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isScheduledToday && (
                            <div className="text-orange-600 bg-orange-50 p-1.5 rounded-md border border-orange-200 shadow-sm animate-pulse" title="Agendamento Hoje">
                                <Bell className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {/* Data Fields Stacked */}
                    <div className="flex flex-col gap-1 text-gray-800">
                        {/* Vehicle */}
                        <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-900">{lead.vehicleModel}</span>
                            <span className="text-xs text-gray-500">({lead.vehicleYear})</span>
                        </div>
                        
                        {/* Phone */}
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{lead.phone}</span>
                        </div>

                        {/* Financial Data (Integrated) */}
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Prêmio: 
                                <span className="text-gray-900 ml-1">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.dealInfo?.netPremium || 0)}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Comissão: 
                                <span className="text-green-700 font-bold ml-1">{lead.dealInfo?.commission}%</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 font-medium">Pagamento/Parc: 
                                <span className="text-gray-900 ml-1">{lead.dealInfo?.installments}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="text-gray-700 text-xs uppercase font-bold">Vigência Final:</span>
                            <span className="text-indigo-700 font-bold text-xs bg-indigo-50 px-1.5 rounded border border-indigo-100">
                                {formatDisplayDate(lead.dealInfo?.endDate)}
                            </span>
                        </div>

                        {/* STATUS CONTROL */}
                        <div className="mt-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                                Status do Lead
                            </label>
                            
                            {isEditingStatus || !selectedStatus ? (
                                <div className="flex gap-1">
                                    <select 
                                        className="flex-1 bg-white border border-gray-300 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm font-medium text-gray-700"
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
                                            px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm border
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
                                    <button 
                                        onClick={() => setIsEditingStatus(true)}
                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm uppercase tracking-wide w-full md:w-auto"
                                    >
                                        Alterar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RESPONSIBLE CONTROL */}
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100 mt-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3" /> Responsável
                            </label>
                            
                            {isEditingUser || !selectedUser ? (
                                <div className="flex gap-1">
                                    <select 
                                        className="flex-1 bg-white border border-gray-300 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm text-gray-700 font-medium"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="">-- Selecione --</option>
                                        {USERS_LIST.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={handleConfirmUser}
                                        className="bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm uppercase tracking-wide"
                                    >
                                        Atribuir
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-200">
                                    <span className="text-xs font-bold text-gray-700 truncate mr-2">
                                        Atribuído para: <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                                    </span>
                                    <button 
                                        onClick={() => setIsEditingUser(true)}
                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm uppercase tracking-wide"
                                    >
                                        Alterar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: Created At */}
                <div className="mt-3 pt-2 flex items-center justify-end border-t border-gray-200">
                    <div className="text-[10px] text-gray-400 font-medium">
                        Criado em: {formatCreationDate(lead.createdAt)}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Conditional Inputs */}
            {isSplitView && (
                <div className={`
                    p-3 flex flex-col gap-3 animate-fade-in border-l
                    ${selectedStatus === LeadStatus.CLOSED ? borderColor : `bg-gray-50 ${borderColor}`}
                `}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1">
                        Complemento
                    </h4>
                    
                    {needsDate && (
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Data e Hora</span>
                            </label>
                            <input 
                                type="datetime-local" 
                                disabled={!isEditingStatus}
                                className={`
                                    w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm
                                    ${!isEditingStatus ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'}
                                `}
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                    )}

                    {needsObservation && (
                            <div className="flex-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Observações</label>
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
                                <input 
                                    type="text"
                                    placeholder="Ex: Porto, Allianz"
                                    value={dealForm.insurer}
                                    onChange={(e) => setDealForm({...dealForm, insurer: e.target.value})}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Meio de Pagamento</label>
                                 <select 
                                    value={dealForm.paymentMethod}
                                    onChange={(e) => setDealForm({...dealForm, paymentMethod: e.target.value})}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                 >
                                    <option value="">Selecione</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Boleto">Boleto</option>
                                    <option value="Débito em Conta">Débito em Conta</option>
                                    <option value="Pix">Pix</option>
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
                                <option value="À Vista">À Vista</option>
                                <option value="4x Sem Juros">4x Sem Juros</option>
                                <option value="6x Sem Juros">6x Sem Juros</option>
                                <option value="10x Sem Juros">10x Sem Juros</option>
                                <option value="12x Com Juros">12x Com Juros</option>
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
                        <button 
                            onClick={() => setShowDealModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveDeal}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm shadow-md"
                        >
                            Confirmar Venda
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export const RenewalList: React.FC<RenewalListProps> = ({ leads, onUpdateLead, onAddLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const name = lead.name || '';
    const phone = lead.phone || '';
    
    const matchesSearch = name.toLowerCase().includes(term) || phone.includes(term);
    
    let matchesDate = true;
    if (filterDate && lead.dealInfo?.endDate) {
        // Filter by expiration date (dealInfo.endDate) often relevant for renewals
        matchesDate = lead.dealInfo.endDate.startsWith(filterDate);
    }

    return matchesSearch && matchesDate;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
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
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <input 
            type="month"
            className="border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-700"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* List Layout - Stacked Cards */}
      <div className="flex flex-col gap-3 pb-4 overflow-y-auto w-full max-w-4xl mx-auto px-1 flex-1">
        {paginatedLeads.map((lead) => (
            <RenewalCard 
                key={lead.id} 
                lead={lead} 
                onUpdate={onUpdateLead}
                onAdd={onAddLead}
            />
        ))}

        {paginatedLeads.length === 0 && (
            <div className="py-10 text-center text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhuma renovação encontrada.</p>
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4 bg-white border-t border-gray-200 mt-auto">
            <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
            >
                Anterior
            </button>
            <span className="text-sm text-gray-600 font-medium">
                Página {currentPage} de {totalPages}
            </span>
            <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
            >
                Próximo
            </button>
        </div>
      )}
    </div>
  );
};
