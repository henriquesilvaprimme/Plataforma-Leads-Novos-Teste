
import React, { useState } from 'react';
import { Lead, LeadStatus, Endorsement } from '../types';
import { Search, FileText, Car, Edit, XCircle, AlertTriangle } from './Icons';

interface InsuredListProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
}

interface EndorsementForm {
  vehicleModel: string;
  vehicleYear: string;
  netPremium: number;
  commission: number;
  installments: string;
  startDate: string;
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

const VehicleCard: React.FC<{ lead: Lead; onUpdate: (l: Lead) => void }> = ({ lead, onUpdate }) => {
  const [showEndorseModal, setShowEndorseModal] = useState(false);
  const [showEndorseInfo, setShowEndorseInfo] = useState<string | null>(null); // Stores ID of endorsement to show info for
  
  const [endorseForm, setEndorseForm] = useState<EndorsementForm>({
    vehicleModel: lead.vehicleModel,
    vehicleYear: lead.vehicleYear,
    netPremium: lead.dealInfo?.netPremium || 0,
    commission: lead.dealInfo?.commission || 0,
    installments: lead.dealInfo?.installments || '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const isCancelled = lead.status === LeadStatus.LOST;

  const handleCancelLead = () => {
    if (confirm("Tem certeza que deseja cancelar este seguro?")) {
      onUpdate({ ...lead, status: LeadStatus.LOST });
    }
  };

  const handleSaveEndorsement = () => {
    const newEndorsement: Endorsement = {
      id: Date.now().toString(),
      vehicleModel: endorseForm.vehicleModel,
      vehicleYear: endorseForm.vehicleYear,
      netPremium: endorseForm.netPremium,
      commission: endorseForm.commission,
      installments: endorseForm.installments,
      startDate: endorseForm.startDate,
      createdAt: new Date().toISOString()
    };

    // Atualiza o lead com o novo veículo e adiciona o endosso na lista
    const updatedLead = {
      ...lead,
      vehicleModel: endorseForm.vehicleModel, // Atualiza modelo no card
      vehicleYear: endorseForm.vehicleYear,   // Atualiza ano no card
      endorsements: [...(lead.endorsements || []), newEndorsement]
    };

    onUpdate(updatedLead);
    setShowEndorseModal(false);
  };

  return (
    <div className={`border rounded-xl p-2 shadow-sm relative transition-colors ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
       {/* Card Content Compact */}
       <div className="flex flex-col gap-0.5">
          
          <div className="flex justify-between items-start">
             <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                   <Car className="w-3 h-3 text-gray-400" />
                   <span className="font-bold text-gray-800 text-sm">{lead.vehicleModel}</span>
                   <span className="text-[10px] text-gray-500">({lead.vehicleYear})</span>
                </div>
                
                {isCancelled && (
                    <div className="mt-0.5">
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border border-red-200">
                            Cancelado
                        </span>
                    </div>
                )}
             </div>
             
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

          {/* Endorsement Info Popover (In-Card) */}
          {showEndorseInfo && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-gray-700 animate-fade-in mb-1">
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

          {/* Dates & Financial Info Compact */}
          <div className="flex flex-col gap-0.5">
             {/* Datas de Vigência */}
             <div className="flex items-center gap-2 text-[10px]">
                <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <span className="font-bold">Início:</span>
                    <span>{formatDisplayDate(lead.dealInfo?.startDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    <span className="font-bold">Fim:</span>
                    <span>{formatDisplayDate(lead.dealInfo?.endDate)}</span>
                </div>
             </div>

             {/* Financial Info Grid Compact */}
             <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                <div>Prêmio: <b className="text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.dealInfo?.netPremium || 0)}</b></div>
                <div>Comissão: <b className="text-green-600">{lead.dealInfo?.commission}%</b></div>
                <div>Parc.: <b>{lead.dealInfo?.installments}</b></div>
             </div>
          </div>

          {/* Footer: Closed By + Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-0.5">
             <span className="text-[10px] text-gray-500">
                Resp: <b className="text-indigo-600">{lead.assignedTo || 'Sistema'}</b>
             </span>
             
             {!isCancelled && (
                 <div className="flex gap-1">
                    <button 
                    onClick={() => setShowEndorseModal(true)}
                    className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                    <Edit className="w-3 h-3" /> Endossar
                    </button>
                    <button 
                    onClick={handleCancelLead}
                    className="flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded hover:bg-red-100 border border-red-200 transition-colors"
                    >
                    <XCircle className="w-3 h-3" /> Cancelar
                    </button>
                 </div>
             )}
          </div>
       </div>

       {/* MODAL DE ENDOSSO */}
       {showEndorseModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
               <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
                  <h2 className="text-white font-bold text-sm flex items-center gap-2">
                     <Edit className="w-4 h-4" /> Registrar Endosso
                  </h2>
                  <button onClick={() => setShowEndorseModal(false)} className="text-white/80 hover:text-white">✕</button>
               </div>
               
               <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Veículo (Novo)</label>
                        <input type="text" value={endorseForm.vehicleModel} onChange={e => setEndorseForm({...endorseForm, vehicleModel: e.target.value})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Ano (Novo)</label>
                        <input type="text" value={endorseForm.vehicleYear} onChange={e => setEndorseForm({...endorseForm, vehicleYear: e.target.value})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Prêmio Líq.</label>
                        <input type="number" value={endorseForm.netPremium} onChange={e => setEndorseForm({...endorseForm, netPremium: Number(e.target.value)})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Comissão (%)</label>
                        <input type="number" value={endorseForm.commission} onChange={e => setEndorseForm({...endorseForm, commission: Number(e.target.value)})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Parcelamento</label>
                     <select value={endorseForm.installments} onChange={e => setEndorseForm({...endorseForm, installments: e.target.value})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500 bg-white">
                        <option value="">Selecione</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                             <option key={num} value={`${num}x`}>{num}x</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Vigência Inicial (Endosso)</label>
                     <input type="date" value={endorseForm.startDate} onChange={e => setEndorseForm({...endorseForm, startDate: e.target.value})} className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                  </div>
               </div>

               <div className="p-4 pt-0 flex gap-2">
                  <button onClick={() => setShowEndorseModal(false)} className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-600">Cancelar</button>
                  <button onClick={handleSaveEndorsement} className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold shadow-sm hover:bg-blue-700">Confirmar</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export const InsuredList: React.FC<InsuredListProps> = ({ leads, onUpdateLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // 1. Usando todos os leads passados na prop (coleção renovacoes)
  const insuredLeads = leads; 

  // 2. Filter by Search and Date
  const filtered = insuredLeads.filter(l => {
     const term = searchTerm.toLowerCase();
     const name = l.name || '';
     const phone = l.phone || '';
     const matchesSearch = name.toLowerCase().includes(term) || phone.includes(term);
     const matchesDate = !filterDate || (l.dealInfo?.startDate && l.dealInfo.startDate.startsWith(filterDate));
     return matchesSearch && matchesDate;
  });

  // 3. Group by Phone (Client Identity)
  const groupedLeads: { [key: string]: { clientName: string, phone: string, leads: Lead[] } } = {};
  
  filtered.forEach(lead => {
     const key = lead.phone || `no-phone-${lead.id}`;
     
     if (!groupedLeads[key]) {
        groupedLeads[key] = {
           clientName: lead.name || 'Cliente Sem Nome',
           phone: lead.phone || 'Sem Telefone',
           leads: []
        };
     }
     groupedLeads[key].leads.push(lead);
  });

  return (
    <div className="h-full flex flex-col">
       {/* Filters */}
       <div className="mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-800">Segurados</h2>
             </div>
          </div>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Nome ou Telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-1.5 border rounded text-sm w-full md:w-64 focus:ring-1 focus:ring-blue-500 outline-none" />
             </div>
             <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
       </div>

       {/* List */}
       <div className="flex flex-col gap-4 pb-4 overflow-y-auto flex-1 max-w-4xl mx-auto w-full px-1">
          {Object.keys(groupedLeads).length > 0 ? (
             Object.values(groupedLeads).map((group) => (
                <div key={group.phone} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                   {/* Client Header */}
                   <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                      <div>
                         <h3 className="font-bold text-gray-900 text-lg">{group.clientName}</h3>
                         <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="bg-gray-200 px-1.5 rounded text-xs font-mono">{group.phone}</span>
                         </p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
                         {group.leads.length} Veículo(s)
                      </span>
                   </div>

                   {/* Vehicles Grid - Compacted */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.leads.map(lead => (
                         <VehicleCard key={lead.id} lead={lead} onUpdate={onUpdateLead} />
                      ))}
                   </div>
                </div>
             ))
          ) : (
             <div className="py-10 text-center text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum segurado encontrado.</p>
             </div>
          )}
       </div>
    </div>
  );
};
