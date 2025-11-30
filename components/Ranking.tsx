import React, { useState } from 'react';
import { Lead, LeadStatus, User } from '../types';
import { Trophy, Medal, DollarSign, Percent, CreditCard, ShieldCheck, Calendar } from './Icons';

interface RankingProps {
  leads: Lead[];
  users: User[];
}

interface UserMetrics {
  userName: string;
  avatarColor: string;
  salesCount: number;
  portoCount: number;
  azulCount: number;
  itauCount: number;
  othersCount: number;
  totalPremium: number;
  totalCommission: number;
  totalInstallments: number; // Sum of numeric values of installments
  countForAvg: number; // To calculate average
}

export const Ranking: React.FC<RankingProps> = ({ leads, users }) => {
  // Filtro de Data: Padrão Mês Atual
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 7));

  // 1. Filtrar apenas vendas fechadas E que estejam dentro do mês selecionado
  const sales = leads.filter(l => {
      const isClosed = l.status === LeadStatus.CLOSED && !!l.dealInfo;
      if (!isClosed) return false;

      // Lógica de Filtro de Data para Ranking
      // Prioridade: Início Vigência (dealInfo.startDate) -> Data Fechamento (closedAt)
      const dateToCheck = l.dealInfo?.startDate || l.closedAt || '';
      if (!dateToCheck) return false;
      
      return dateToCheck.startsWith(filterDate);
  });

  // 2. Mapear APENAS Usuários Ativos, que NÃO sejam Renovações e NÃO sejam Admin
  const activeUsers = users.filter(u => u.isActive && !u.isRenovations && !u.isAdmin);
  const metricsMap = new Map<string, UserMetrics>();

  // Inicializar o mapa com os usuários ativos (excluindo os de renovações e admins)
  activeUsers.forEach(user => {
      metricsMap.set(user.name, {
          userName: user.name,
          avatarColor: user.avatarColor || 'bg-gray-500',
          salesCount: 0,
          portoCount: 0,
          azulCount: 0,
          itauCount: 0,
          othersCount: 0,
          totalPremium: 0,
          totalCommission: 0,
          totalInstallments: 0,
          countForAvg: 0
      });
  });

  // 3. Processar Vendas
  sales.forEach(sale => {
      const assignedTo = sale.assignedTo || "";
      
      // Só processa a venda se o usuário estiver na lista de ativos e permitidos
      if (metricsMap.has(assignedTo)) {
          const metrics = metricsMap.get(assignedTo)!;
          
          metrics.salesCount += 1;
          metrics.countForAvg += 1;
          metrics.totalPremium += sale.dealInfo!.netPremium || 0;
          metrics.totalCommission += sale.dealInfo!.commission || 0;

          // Contagem por Seguradora
          const insurer = (sale.dealInfo?.insurer || '').toLowerCase();
          
          if (insurer.includes('porto')) metrics.portoCount++;
          else if (insurer.includes('azul')) metrics.azulCount++;
          else if (insurer.includes('itau') || insurer.includes('itaú')) metrics.itauCount++;
          else metrics.othersCount++;

          // Média de Parcelas
          const installmentStr = sale.dealInfo!.installments || "";
          const match = installmentStr.match(/(\d+)/);
          const installmentNum = match ? parseInt(match[0]) : 1;
          metrics.totalInstallments += installmentNum;
      }
  });

  // 4. Converter para Array e Ordenar
  const rankingList = Array.from(metricsMap.values()).sort((a, b) => b.salesCount - a.salesCount);

  return (
    <div className="h-full flex flex-col">
       {/* Header */}
       <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Trophy className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Ranking de Vendas</h2>
                <p className="text-xs text-gray-500">Desempenho da equipe comercial (Vendedores)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5">
             <Calendar className="w-4 h-4 text-gray-500" />
             <input 
                type="month" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-sm font-medium text-gray-700 outline-none bg-transparent cursor-pointer"
             />
          </div>
       </div>

       {/* Ranking Grid */}
       <div className="grid grid-cols-1 gap-6 pb-4 overflow-y-auto px-1 flex-1">
          {rankingList.map((user, index) => {
              const isFirst = index === 0;
              const avgCommission = user.countForAvg > 0 ? (user.totalCommission / user.countForAvg).toFixed(1) : 0;
              const avgInstallments = user.countForAvg > 0 ? Math.round(user.totalInstallments / user.countForAvg) : 0;

              return (
                  <div key={user.userName} className={`relative rounded-xl shadow-sm border p-6 transition-all ${isFirst ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-300 shadow-md transform scale-[1.01]' : 'bg-white border-gray-200'}`}>
                      
                      {/* Rank Badge */}
                      <div className={`absolute top-0 left-0 w-12 h-12 rounded-tl-xl rounded-br-2xl flex items-center justify-center font-bold text-xl shadow-sm border-b border-r z-10 ${isFirst ? 'bg-yellow-400 text-yellow-900 border-yellow-200' : index === 1 ? 'bg-gray-300 text-gray-800 border-gray-200' : index === 2 ? 'bg-orange-300 text-orange-900 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {index + 1}º
                      </div>

                      {/* Top Section */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-4 pl-12">
                          <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm ${user.avatarColor}`}>
                                  {user.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <h3 className="font-bold text-xl text-gray-900">{user.userName}</h3>
                                  {isFirst && <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-1"><Trophy className="w-3 h-3"/> Líder de Vendas</span>}
                              </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 text-center bg-gray-50 px-6 py-2 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total de Vendas</p>
                              <p className="text-3xl font-extrabold text-indigo-600">{user.salesCount}</p>
                          </div>
                      </div>

                      {/* Middle Section: Insurer Counters */}
                      <div className="mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Vendas por Seguradora</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
                                  <span className="block text-[10px] text-blue-600 uppercase font-bold">Porto Seguro</span>
                                  <span className="text-lg font-bold text-blue-800">{user.portoCount}</span>
                              </div>
                              <div className="bg-cyan-50 p-2 rounded border border-cyan-100 text-center">
                                  <span className="block text-[10px] text-cyan-600 uppercase font-bold">Azul Seguros</span>
                                  <span className="text-lg font-bold text-cyan-800">{user.azulCount}</span>
                              </div>
                              <div className="bg-orange-50 p-2 rounded border border-orange-100 text-center">
                                  <span className="block text-[10px] text-orange-600 uppercase font-bold">Itaú Seguros</span>
                                  <span className="text-lg font-bold text-orange-800">{user.itauCount}</span>
                              </div>
                              <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                                  <span className="block text-[10px] text-gray-500 uppercase font-bold">Demais</span>
                                  <span className="text-lg font-bold text-gray-700">{user.othersCount}</span>
                              </div>
                          </div>
                      </div>

                      {/* Bottom Section: Averages */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm">
                              <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                  <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Prêmio Líquido Total</p>
                                  <p className="font-bold text-gray-800">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user.totalPremium)}
                                  </p>
                              </div>
                          </div>

                          <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm">
                              <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                                  <Percent className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Média Comissão</p>
                                  <p className="font-bold text-gray-800">{avgCommission}%</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm">
                              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                                  <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Média Parcelas</p>
                                  <p className="font-bold text-gray-800">{avgInstallments}x</p>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}
          
          {rankingList.length === 0 && (
             <div className="py-12 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma venda registrada neste período.</p>
             </div>
          )}
       </div>
    </div>
  );
};
