
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
// Se a chave for a default do código, considera não configurado.
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

// === FUNÇÕES AUXILIARES DE PARSE ===

const parseCurrency = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    try {
        // Converte para string
        let cleanStr = val.toString();
        
        // Se for formato brasileiro (tem vírgula como decimal ou pontos como milhar)
        if (cleanStr.includes(',') || (cleanStr.includes('.') && cleanStr.split('.').length > 2)) {
            // Remove R$, espaços e pontos de milhar
            cleanStr = cleanStr.replace(/[R$\s]/g, '').replace(/\./g, '');
            // Substitui vírgula por ponto
            cleanStr = cleanStr.replace(',', '.');
        } else {
            // Remove apenas caracteres não numéricos exceto ponto
            cleanStr = cleanStr.replace(/[^\d.]/g, '');
        }

        const number = parseFloat(cleanStr);
        return isNaN(number) ? 0 : number;
    } catch (e) {
        return 0;
    }
};

const parsePercentage = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    try {
        let cleanStr = val.toString().replace(/[%\s]/g, '');
        if (cleanStr.includes(',')) {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        }
        const number = parseFloat(cleanStr);
        return isNaN(number) ? 0 : number;
    } catch (e) {
        return 0;
    }
};

const parseDateToISO = (val: any): string => {
    if (!val) return '';
    const str = val.toString().trim();
    
    // Detecta formato DD/MM/YYYY
    const brDateMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (brDateMatch) {
        const day = brDateMatch[1].padStart(2, '0');
        const month = brDateMatch[2].padStart(2, '0');
        const year = brDateMatch[3];
        return `${year}-${month}-${day}`;
    }

    // Se já for ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
    }
    
    return str;
};

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
        email: data.Email || data.email || '', 
        assignedTo: data.Responsavel || '',
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || data.Observacoes || '',
        
        // Agendamento
        scheduledDate: data.agendamento || '',

        // Campos Extras
        cartaoPortoNovo: data.CartaoPortoNovo,
        insurerConfirmed: data.insurerConfirmed,
        closedAt: data.closedAt,
        usuarioId: data.usuarioId,
        registeredAt: data.registeredAt,

        // Dados do Fechamento
        // Usamos parseDateToISO para garantir YYYY-MM-DD para os inputs type="date"
        dealInfo: (data.Seguradora || data.PremioLiquido || data.VigenciaInicial) ? {
            insurer: data.Seguradora || '',
            netPremium: parseCurrency(data.PremioLiquido),
            commission: parsePercentage(data.Comissao),
            installments: data.Parcelamento || '',
            startDate: parseDateToISO(data.VigenciaInicial),
            endDate: parseDateToISO(data.VigenciaFinal),
            paymentMethod: '' 
        } : undefined,

        endorsements: data.endorsements || []
    } as unknown as Lead;
};

export const mapDocumentToUser = (doc: any): User => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.nome || '',
        login: data.usuario || '',
        password: data.senha || '',
        email: data.email || '',
        isActive: data.status === 'Ativo', 
        isAdmin: data.tipo === 'Admin',
        avatarColor: 'bg-indigo-600'
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
        Email: data.email, 
        TipoSeguro: data.insuranceType,
        createdAt: data.createdAt,
        Responsavel: data.assignedTo,
        status: data.status,
        agendamento: data.scheduledDate,
        notes: data.notes, 
        
        usuarioId: data.usuarioId || '',
        closedAt: data.closedAt || '',
        insurerConfirmed: data.insurerConfirmed || false,
        CartaoPortoNovo: data.cartaoPortoNovo || false
    };

    if (data.dealInfo) {
        dbLead.Seguradora = data.dealInfo.insurer;
        dbLead.PremioLiquido = data.dealInfo.netPremium;
        dbLead.Parcelamento = data.dealInfo.installments;
        dbLead.Comissao = data.dealInfo.commission;
        dbLead.VigenciaInicial = data.dealInfo.startDate;
        dbLead.VigenciaFinal = data.dealInfo.endDate;
    }

    if (collectionName === 'renovacoes') {
        if (data.registeredAt) dbLead.registeredAt = data.registeredAt;
        else dbLead.registeredAt = new Date().toISOString();
    }

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
