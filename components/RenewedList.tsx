
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, USERS_LIST, DealInfo } from '../types';
import { Car, Phone, Calendar, DollarSign, Percent, CreditCard, Users, CheckCircle, Bell, Search, Shield } from './Icons';

interface RenewedListProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
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
    } catch (e) {
        return dateString;
    }
};

const RenewedCard: React.FC<{ lead: Lead, onUpdate: (l: Lead) => void }> = ({ lead, onUpdate }) => {
    // States for optional inputs (notes/schedule) if needed, though controls are removed
    const [observation, setObservation] = useState<string>(lead.notes || '');
    const [scheduleDate, setScheduleDate] = useState<string>(lead.scheduledDate || '');

    const isScheduledToday = lead.status === LeadStatus.SCHEDULED && isToday(lead.scheduledDate);

    // Determines layout view. Since status control is removed, we rely on lead.status.
    const needsObservation = [LeadStatus.IN_CONTACT, LeadStatus.NO_CONTACT, LeadStatus.SCHEDULED].includes(lead.status);
    const needsDate = lead.status === LeadStatus.SCHEDULED;
    const isSplitView = needsObservation || needsDate;

    useEffect(() => {
        setObservation(lead.notes || '');
        setScheduleDate(lead.scheduledDate || '');
    }, [lead]);

    // Force Green Style as requested
    const cardStyle = 'bg-green-50 border-green-200';
    const borderColor = 'border-green-200';

    return (
        <div className={`
            ${cardStyle} rounded-lg shadow-sm border transition-all duration-300 w-full text-sm relative
            ${isSplitView ? 'md:grid md:grid-cols-2' : 'flex flex-col'}
        `}>
            
            <div className={`p-3 flex flex-col justify-between ${isSplitView ? `border-r ${borderColor}` : ''}`}>
                <div className="flex flex-col gap-3">
                    
                    {/* Header: Name Only (Removed Status Badge and Insurance Type) */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-gray-900 leading-tight">{lead.name}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-h-[20px]">
                                {lead.status === LeadStatus.SCHEDULED && lead.scheduledDate && (
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

                    <div className="flex flex-col gap-1 text-gray-800">
                        <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-900">{lead.vehicleModel}</span>
                            <span className="text-xs text-gray-500">({lead.vehicleYear})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{lead.phone}</span>
                        </div>
                        
                        {/* Adding Insurer as requested implicitly by 'count correctly' - helpful context */}
                        {lead.dealInfo?.insurer && (
                             <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-gray-700 font-medium">Seguradora: 
                                    <span className="text-gray-900 ml-1">{lead.dealInfo.insurer}</span>
                                </span>
                            </div>
                        )}

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
                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-gray-700 text-xs uppercase font-bold">Vigência Inicial:</span>
                            <span className="text-blue-700 font-bold text-xs bg-blue-50 px-1.5 rounded border border-blue-100">
                                {formatDisplayDate(lead.dealInfo?.startDate)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="text-gray-700 text-xs uppercase font-bold">Vigência Final:</span>
                            <span className="text-indigo-700 font-bold text-xs bg-indigo-50 px-1.5 rounded border border-indigo-100">
                                {formatDisplayDate(lead.dealInfo?.endDate)}
                            </span>
                        </div>

                        {/* STATUS CONTROL REMOVED */}
                    </div>

                    {/* RESPONSIBLE DISPLAY ONLY (No Edit) */}
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-green-200 mt-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3" /> Responsável
                            </label>
                            
                            <div className="flex items-center justify-between bg-white/50 p-1.5 rounded border border-green-200">
                                <span className="text-xs font-bold text-gray-700 truncate mr-2">
                                    Atribuído para: <span className="text-indigo-700">{lead.assignedTo || 'Ninguém'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                 {/* Footer: Created At */}
                <div className="mt-3 pt-2 flex items-center justify-end border-t border-green-200">
                    <div className="text-[10px] text-gray-500 font-medium">
                        Criado em: {formatCreationDate(lead.createdAt)}
                    </div>
                </div>
            </div>

            {/* Split view kept only for reading notes if they exist, but disabled */}
            {isSplitView && (
                <div className={`
                    p-3 flex flex-col gap-3 animate-fade-in border-l ${borderColor}
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
                                disabled
                                className="w-full border rounded px-2 py-1.5 text-xs bg-white text-gray-600 border-gray-200 cursor-not-allowed"
                                value={scheduleDate}
                            />
                        </div>
                    )}

                    {needsObservation && (
                        <div className="flex-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Observações</label>
                            <textarea 
                                disabled
                                className="w-full border rounded px-2 py-2 text-xs bg-white text-gray-600 border-gray-200 cursor-not-allowed resize-none flex-1 shadow-inner"
                                value={observation}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const RenewedList: React.FC<RenewedListProps> = ({ leads, onUpdateLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Set default filter date to current Month/Year
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  const [filterDate, setFilterDate] = useState<string>(getCurrentMonth()); 

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
    // Filter by Start Date of the Renewal
    if (filterDate && lead.dealInfo?.startDate) {
        matchesDate = lead.dealInfo.startDate.startsWith(filterDate);
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
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Leads Renovados</h2>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 flex-wrap">
          <div className="relative flex-grow md:flex-grow-0 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Nome ou Telefone..." 
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <input 
            type="month"
            className="border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* List Layout - Stacked Cards */}
      <div className="flex flex-col gap-3 pb-4 overflow-y-auto w-full max-w-4xl mx-auto px-1 flex-1">
        {paginatedLeads.map((lead) => (
            <RenewedCard 
                key={lead.id} 
                lead={lead} 
                onUpdate={onUpdateLead}
            />
        ))}

        {paginatedLeads.length === 0 && (
            <div className="py-10 text-center text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum renovado encontrado para este período.</p>
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
