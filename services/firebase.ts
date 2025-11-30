
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, setDoc, query, where } from "firebase/firestore";
import { Lead, User } from "../types";

// COLOQUE SUAS CHAVES DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "AIzaSyAMLDTyqFCQhfll1yPMxUtttgjIxCisIP4",
  authDomain: "painel-de-leads-novos.firebaseapp.com",
  projectId: "painel-de-leads-novos",
  storageBucket: "painel-de-leads-novos.firebasestorage.app",
  messagingSenderId: "630294246900",
  appId: "1:630294246900:web:764b52308c2ffa805175a1"
};

// Exportação explícita da constante de verificação
export const isFirebaseConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

let app: any;
let db: any;

// Inicialização segura
if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase inicializado com sucesso.");
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        db = null;
    }
} else {
    console.warn("Firebase não configurado. O app rodará em modo de visualização (Mock).");
}

// === FUNÇÕES AUXILIARES DE MAPEAMENTO (BANCO -> APP) ===

export const mapDocumentToLead = (doc: any): Lead => {
    const data = doc.data();
    
    // Mapeamento dos campos em Português (Banco) para Inglês (App)
    return {
        id: doc.id,
        // Dados Básicos
        name: data.Nome || '',
        vehicleModel: data.Modelo || '',
        vehicleYear: data.AnoModelo || '',
        city: data.Cidade || '',
        phone: data.Telefone || '',
        insuranceType: data.TipoSeguro || '',
        status: data.status || 'Novo',
        email: data.Email || data.email || '', // Mapeando email
        assignedTo: data.Responsavel || '',
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || data.Observacoes || '', // Mantendo compatibilidade
        
        // Agendamento
        scheduledDate: data.agendamento || '',

        // Campos Extras mencionados
        cartaoPortoNovo: data.CartaoPortoNovo,
        insurerConfirmed: data.insurerConfirmed,
        closedAt: data.closedAt,
        usuarioId: data.usuarioId,
        registeredAt: data.registeredAt, // Para renovações

        // Dados do Fechamento (Achatados no banco -> Objeto no App)
        dealInfo: (data.Seguradora || data.PremioLiquido) ? {
            insurer: data.Seguradora || '',
            netPremium: Number(data.PremioLiquido) || 0,
            commission: Number(data.Comissao) || 0,
            installments: data.Parcelamento || '',
            startDate: data.VigenciaInicial || '',
            endDate: data.VigenciaFinal || '',
            paymentMethod: '' // Não especificado na lista do banco, mantém vazio ou mapeia se existir
        } : undefined,

        // Manter endossos se existirem (estrutura complexa)
        endorsements: data.endorsements || []
    } as unknown as Lead;
};

export const mapDocumentToUser = (doc: any): User => {
    const data = doc.data();
    return {
        id: doc.id, // ID vem do ID do documento ou campo 'id'
        name: data.nome || '',
        login: data.usuario || '',
        password: data.senha || '',
        email: data.email || '',
        // Conversão de Status e Tipo (String PT -> Boolean)
        isActive: data.status === 'Ativo', 
        isAdmin: data.tipo === 'Admin',
        avatarColor: 'bg-indigo-600' // Padrão visual
    } as User;
};

// === FUNÇÃO AUXILIAR DE MAPEAMENTO REVERSO (APP -> BANCO) ===

const mapAppToDb = (collectionName: string, data: any) => {
    // Mapeamento Usuários
    if (collectionName === 'usuarios') {
        return {
            nome: data.name,
            usuario: data.login,
            senha: data.password,
            email: data.email,
            id: data.id,
            status: data.isActive ? 'Ativo' : 'Inativo',
            tipo: data.isAdmin ? 'Admin' : 'Comum',
            updatedAt: new Date().toISOString()
        };
    }

    // Mapeamento Leads / Renovações / Renovados
    const dbLead: any = {
        Nome: data.name,
        Modelo: data.vehicleModel,
        AnoModelo: data.vehicleYear,
        Cidade: data.city,
        Telefone: data.phone,
        Email: data.email, // Salvando email
        TipoSeguro: data.insuranceType,
        createdAt: data.createdAt,
        Responsavel: data.assignedTo,
        status: data.status,
        agendamento: data.scheduledDate,
        notes: data.notes, // Salvando notas também
        
        // Campos Extras
        usuarioId: data.usuarioId || '',
        closedAt: data.closedAt || '',
        insurerConfirmed: data.insurerConfirmed || false,
        CartaoPortoNovo: data.cartaoPortoNovo || false
    };

    // Dados de Venda (Achatando o objeto dealInfo para colunas soltas)
    if (data.dealInfo) {
        dbLead.Seguradora = data.dealInfo.insurer;
        dbLead.PremioLiquido = data.dealInfo.netPremium;
        dbLead.Parcelamento = data.dealInfo.installments;
        dbLead.Comissao = data.dealInfo.commission;
        dbLead.VigenciaInicial = data.dealInfo.startDate;
        dbLead.VigenciaFinal = data.dealInfo.endDate;
    }

    // Se for renovação, adiciona registeredAt
    if (collectionName === 'renovacoes' && data.registeredAt) {
        dbLead.registeredAt = data.registeredAt;
    }
    // Se não tiver registeredAt mas for salvar em renovacoes, cria data atual
    if (collectionName === 'renovacoes' && !dbLead.registeredAt) {
        dbLead.registeredAt = new Date().toISOString();
    }

    // Endossos (mantendo estrutura de array se houver)
    if (data.endorsements) {
        dbLead.endorsements = data.endorsements;
    }

    return dbLead;
};

// === FUNÇÕES DE LEITURA (REAL-TIME) ===

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) {
        callback([]); 
        return () => {};
    }

    try {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot: any) => {
            const items = snapshot.docs.map((doc: any) => {
                 if(collectionName === 'usuarios') return mapDocumentToUser(doc);
                 return mapDocumentToLead(doc);
            });
            callback(items);
        }, (error: any) => {
            console.error(`Erro na coleção ${collectionName}:`, error);
            callback([]);
        });
    } catch (error) {
        console.error(`Erro ao assinar ${collectionName}:`, error);
        callback([]);
        return () => {};
    }
};

export const subscribeToRenovationsTotal = (callback: (total: number) => void) => {
    if (!isFirebaseConfigured || !db) {
        callback(0);
        return () => {};
    }

    try {
        const docRef = doc(db, 'totalrenovacoes', 'stats');
        return onSnapshot(docRef, (docSnap: any) => {
            if (docSnap.exists()) {
                callback(docSnap.data().count || 0);
            } else {
                callback(0);
            }
        }, (error: any) => {
             console.error("Erro em totalrenovacoes:", error);
             callback(0);
        });
    } catch (error) {
        console.error("Erro ao assinar totalrenovacoes:", error);
        callback(0);
        return () => {};
    }
};

// === FUNÇÕES DE ESCRITA ===

export const addDataToCollection = async (collectionName: string, data: any) => {
    if (!isFirebaseConfigured || !db) {
        alert("Firebase não configurado. Dados não serão salvos (Modo Mock).");
        return;
    }
    
    try {
        // Converte os dados do App para o formato do Banco (Português)
        const dbData = mapAppToDb(collectionName, data);
        
        await addDoc(collection(db, collectionName), dbData);
    } catch (error) {
        console.error(`Erro ao salvar em ${collectionName}:`, error);
        alert("Erro ao salvar dados.");
    }
};

export const updateDataInCollection = async (collectionName: string, id: string, data: any) => {
    if (!isFirebaseConfigured || !db) return;

    try {
        // Converte os dados do App para o formato do Banco (Português)
        const dbData = mapAppToDb(collectionName, data);

        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, dbData);
    } catch (error) {
        console.error(`Erro ao atualizar ${collectionName}:`, error);
    }
};

export const updateTotalRenovacoes = async (newTotal: number) => {
    if (!isFirebaseConfigured || !db) return;

    try {
        const docRef = doc(db, 'totalrenovacoes', 'stats');
        await setDoc(docRef, { count: newTotal }, { merge: true });
    } catch (error) {
        console.error("Erro ao atualizar total:", error);
    }
};
