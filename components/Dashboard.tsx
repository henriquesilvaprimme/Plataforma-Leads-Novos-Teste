
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Lead, LeadStatus } from '../types';
import { Users, LayoutDashboard, BrainCircuit, ChevronLeft, ChevronRight, Shield, DollarSign, Percent, CheckCircle, XCircle } from './Icons';

interface DashboardProps {
  newLeadsData: Lead[]; 
  renewalLeadsData: Lead[]; 
  manualRenewalTotal: number;
  onUpdateRenewalTotal: (val: number) => void;
}

type Section = 'NEW' | 'RENEWAL';

interface Metrics {
  total: number;
  conversionRate: number;
  sales: number;
  lost: number;
  inContact: number;
  noContact: number;
  portoCount: number;
  azulCount: number;
  itauCount: number;
  othersCount: number;
  totalPremium: number;
  avgCommission: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ newLeadsData, renewalLeadsData, manualRenewalTotal, onUpdateRenewalTotal }) => {
  const [section, setSection] = useState<Section>('NEW');
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [editTotalValue, setEditTotalValue] = useState('');

  const calculateMetrics = (subset: Lead[], isRenewalSection: boolean): Metrics => {
    // Se for seção de renovações, USAMOS ESTRITAMENTE O VALOR MANUAL DO BANCO
    let total = subset.length;
    
    if (isRenewalSection) {
        // Se estivermos em Renovações, o total é o valor manual, não importa se é 0 ou mil.
        // É a "Carteira Total" definida pelo usuário.
        total = manualRenewalTotal;
    }

    const closedDeals = subset.filter(l => l.status === LeadStatus.CLOSED);
    const sales = closedDeals.length;
    const lost = subset.filter(l => l.status === LeadStatus.LOST).length;
    const inContact = subset.filter(l => l.status === LeadStatus.IN_CONTACT).length;
    const noContact = subset.filter(l => l.status === LeadStatus.NO_CONTACT).length;
    
    const conversionRate = total > 0 ? (sales / total) * 100 : 0;

    let totalPremium = 0;
    let totalCommission = 0;
    let portoCount = 0;
    let azulCount = 0;
    let itauCount = 0;
    let othersCount = 0;

    closedDeals.forEach(lead => {
        if (lead.dealInfo) {
            totalPremium += lead.dealInfo.netPremium;
            totalCommission += lead.dealInfo.commission;

            const insurer = (lead.dealInfo.insurer || '').toLowerCase();
            
            if (insurer.includes('porto')) portoCount++;
            else if (insurer.includes('azul')) azulCount++;
            else if (insurer.includes('itau') || insurer.includes('itaú')) itauCount++;
            else othersCount++;
        }
    });

    const avgCommission = sales > 0 ? totalCommission / sales : 0;

    return {
        total,
        conversionRate,
        sales,
        lost,
        inContact,
        noContact,
        portoCount,
        azulCount,
        itauCount,
        othersCount,
        totalPremium,
        avgCommission
    };
  };

  const metrics = section === 'NEW' ? calculateMetrics(newLeadsData, false) : calculateMetrics(renewalLeadsData, true);

  // Data for Renewal Pie Chart
  const pieData = [
    { name: 'Renovados', value: metrics.sales, color: '#16a34a' }, 
    { name: 'Perdidos', value: metrics.lost, color: '#dc2626' }, 
    // Pendentes agora respeita o total calculado (manual ou lista)
    { name: 'Pendentes', value: Math.max(0, metrics.total - metrics.sales - metrics.lost), color: '#e5e7eb' }, 
  ];

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      
      {/* Header with Toggle */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Dashboard
         </h1>
         
         <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-1 border border-gray-200">
             <button 
                onClick={() => setSection(section === 'NEW' ? 'RENEWAL' : 'NEW')}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <span className="font-bold text-sm text-gray-700 w-32 text-center uppercase tracking-wide">
                {section === 'NEW' ? 'Seguro Novo' : 'Renovações'}
             </span>
             <button 
                onClick={() => setSection(section === 'NEW' ? 'RENEWAL' : 'NEW')}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* CARD 1: TOTAL & RATE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start z-10 relative">
                    <div className="w-full">
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                            {section === 'NEW' ? 'Total de Leads' : 'Total Renovações'}
                        </p>
                        
                        {/* Lógica de Edição Manual para Renovações */}
                        {section === 'RENEWAL' ? (
                            <div className="flex items-center gap-2">
                                {isEditingTotal ? (
                                    <div className="flex items-center gap-2 mt-1 w-full">
                                        <input 
                                            type="number" 
                                            className="w-full border border-indigo-300 rounded px-2 py-1 text-2xl font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={editTotalValue}
                                            onChange={(e) => setEditTotalValue(e.target.value)}
                                            autoFocus
                                            placeholder={metrics.total.toString()}
                                        />
                                        <button 
                                            onClick={() => {
                                                if(editTotalValue) onUpdateRenewalTotal(parseInt(editTotalValue));
                                                setIsEditingTotal(false);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-extrabold text-gray-900">{metrics.total}</p>
                                        <button 
                                            onClick={() => {
                                                setEditTotalValue(metrics.total.toString());
                                                setIsEditingTotal(true);
                                            }}
                                            className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-3xl font-extrabold text-gray-900">{metrics.total}</p>
                        )}
                    </div>
                    
                    {!isEditingTotal && (
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 ml-2">
                            <Users className="w-6 h-6" />
                        </div>
                    )}
                </div>
                
                {section === 'RENEWAL' ? (
                     <div className="mt-4 h-32 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={2}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-gray-600">{metrics.conversionRate.toFixed(0)}%</span>
                        </div>
                        <p className="absolute bottom-0 text-[10px] text-gray-400 font-medium">Taxa de Renovação</p>
                     </div>
                ) : (
                    <div className="mt-4">
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${metrics.conversionRate}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                            Taxa de Conversão: <span className="text-indigo-600 font-bold">{metrics.conversionRate.toFixed(1)}%</span>
                        </p>
                    </div>
                )}
            </div>

            {/* CARD 2: SALES & LOST */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-green-50 text-green-600 rounded-lg border border-green-100">
                                <CheckCircle className="w-5 h-5" />
                             </div>
                             <div>
                                 <p className="text-xs text-gray-500 font-bold uppercase">
                                    {section === 'NEW' ? 'Total Vendas' : 'Renovados'}
                                 </p>
                                 <p className="text-2xl font-bold text-green-700">{metrics.sales}</p>
                             </div>
                         </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                <XCircle className="w-5 h-5" />
                             </div>
                             <div>
                                 <p className="text-xs text-gray-500 font-bold uppercase">
                                     {section === 'NEW' ? 'Leads Perdidos' : 'Perdidos'}
                                 </p>
                                 <p className="text-2xl font-bold text-red-700">{metrics.lost}</p>
                             </div>
                         </div>
                    </div>
                 </div>
            </div>

            {/* CARD 3: CONTACT METRICS (Only for New) */}
            {section === 'NEW' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <div>
                                 <p className="text-xs text-gray-500 font-bold uppercase mb-1">Em Contato</p>
                                 <p className="text-2xl font-bold text-yellow-600">{metrics.inContact}</p>
                             </div>
                             <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                 <BrainCircuit className="w-5 h-5" />
                             </div>
                        </div>
                        <div className="border-t border-gray-50 pt-4">
                             <p className="text-xs text-gray-500 font-bold uppercase mb-1">Sem Contato</p>
                             <p className="text-2xl font-bold text-gray-400">{metrics.noContact}</p>
                        </div>
                     </div>
                </div>
            )}
        </div>

        {/* INSURERS GRID */}
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Performance por Seguradora
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Porto Seguro</span>
                <span className="text-2xl font-bold text-blue-700">{metrics.portoCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Azul Seguros</span>
                <span className="text-2xl font-bold text-cyan-700">{metrics.azulCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Itaú Seguros</span>
                <span className="text-2xl font-bold text-orange-700">{metrics.itauCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Demais</span>
                <span className="text-2xl font-bold text-gray-700">{metrics.othersCount}</span>
            </div>
        </div>

        {/* FINANCIALS GRID */}
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <DollarSign className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total de Prêmio Líquido</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalPremium)}
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                    <Percent className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Média de Comissão</p>
                    <p className="text-2xl font-extrabold text-gray-900">{metrics.avgCommission.toFixed(1)}%</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
