// Importação dos pacotes necessários
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { default: fetch } = require('node-fetch');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const validator = require('validator');

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;

// Configurações de segurança
// Helmet para definir cabeçalhos de segurança
app.use(helmet());

// Limitador de taxa para proteção contra ataques de força bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // limite de 1000 requisições por IP
    message: 'Muitas requisições vindas deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// Configurações do Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limita o tamanho do body

// Data sanitization contra NoSQL query injection
app.use(mongoSanitize());

// Data sanitization contra XSS
app.use((req, res, next) => {
    // Sanitize all text values in the request body
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        }
    }
    next();
});

// Previne parameter pollution
app.use(hpp());

// Logging de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// --- Conexão com MongoDB ---
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
let client;
let connectionPromise = null;

async function connectToDb() {
    if (!mongoUri) {
        console.log('URI do MongoDB não configurada. Ignorando conexão com o banco de dados.');
        return;
    }

    // Se já temos uma conexão ativa, retornamos ela
    if (client && client.topology) {
        // Verificamos se a topologia está conectada
        if (client.topology.isConnected && client.topology.isConnected()) {
            return client;
        }
        // Se não estiver conectado, limpamos o cliente para criar um novo
        client = null;
    }

    // Se já temos uma tentativa de conexão em andamento, retornamos a mesma promise
    if (connectionPromise) {
        return connectionPromise;
    }

    // Criamos uma nova promise de conexão
    connectionPromise = (async () => {
        try {
            // Criamos um novo cliente com opções de conexão mais robustas
            client = new MongoClient(mongoUri, {
                serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos para seleção do servidor
                connectTimeoutMS: 10000, // Timeout de 10 segundos para conexão
                maxIdleTimeMS: 30000, // Tempo máximo de inatividade de 30 segundos
                retryWrites: true,
                retryReads: true
            });

            await client.connect();
            console.log('Conectado com sucesso ao MongoDB!');
            connectionPromise = null; // Resetamos a promise após conectar
            return client;
        } catch (err) {
            console.error('Falha ao conectar com o MongoDB:', err.message);
            console.error('Detalhes do erro:', {
                name: err.name,
                code: err.code,
                codeName: err.codeName
            });

            // Limpa o cliente em caso de erro
            if (client) {
                await client.close().catch(() => { }); // Ignora erros ao fechar
                client = null;
            }

            connectionPromise = null; // Resetamos a promise após erro
            return null;
        }
    })();

    return connectionPromise;
}

// Função para fechar a conexão com o MongoDB
async function closeDbConnection() {
    if (client) {
        try {
            await client.close();
            console.log('Conexão com MongoDB fechada com sucesso.');
        } catch (err) {
            console.error('Erro ao fechar conexão com MongoDB:', err.message);
        } finally {
            client = null;
            connectionPromise = null;
        }
    }
}

// Fechar conexão quando o processo for encerrado
process.on('SIGINT', async () => {
    console.log('Recebido SIGINT. Fechando conexão com MongoDB...');
    await closeDbConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM. Fechando conexão com MongoDB...');
    await closeDbConnection();
    process.exit(0);
});

//     }
//   }
// }

// --- Helper para chamadas de API com Retry ---
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // Se a resposta não for 429, retorne-a (seja sucesso ou outro erro)
            if (response.status !== 429) {
                return response;
            }
            // Se for 429, loga e espera para a próxima tentativa
            console.warn(`Rate limit (429) atingido. Tentando novamente em ${delay / 1000}s... (Tentativa ${i + 1}/${retries})`);

        } catch (error) {
            // Em caso de erro de rede, espera e tenta novamente
            console.warn(`Erro de rede. Tentando novamente em ${delay / 1000}s... (Tentativa ${i + 1}/${retries})`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    // Se todas as tentativas falharem, lança um erro final
    throw new Error(`A requisição para ${url} falhou após ${retries} tentativas.`);
}


// Função para validar e sanitizar entradas
function sanitizeInput(input) {
    if (typeof input === 'string') {
        // Remove caracteres especiais perigosos
        return validator.escape(validator.trim(input));
    }
    return input;
}

// Função para validar IDs do MongoDB
function isValidObjectId(id) {
    return validator.isMongoId(id);
}

// Middleware de autenticação básica (para endpoints sensíveis)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // console.log('Recebendo requisição com token:', token);
    // console.log('Token esperado:', process.env.API_SECRET_TOKEN);

    if (!token) {
        console.log('Acesso negado. Token não fornecido.');
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    // Verificação simples do token (em produção, use JWT ou outro mecanismo mais robusto)
    if (token !== process.env.API_SECRET_TOKEN) {
        console.log('Token inválido.');
        return res.status(403).json({ message: 'Token inválido.' });
    }

    console.log('Token válido. Prosseguindo com a requisição.');
    next();
}

// Rota para verificação de banco
app.get('/api/customers', async (req, res) => {
    const { campanha } = req.query; // Pega o nome da campanha da URL

    // Validação de entrada
    if (!campanha) {
        return res.status(400).json({ message: 'O nome da campanha é obrigatório.' });
    }

    // Conecta ao MongoDB apenas quando necessário
    const client = await connectToDb();
    if (!client) {
        return res.status(500).json({ message: 'Não foi possível conectar ao banco de dados.' });
    }

    // Sanitização de entrada
    const sanitizedCampanha = sanitizeInput(campanha);

    try {
        const db = client.db(dbName);
        // IMPORTANTE: O nome da coleção do dicionario de leads criado no Hablla, é 'workspace-67e44bc7d729e2b2eab770dd-leads'.
        const collection = db.collection('workspace-67e44bc7d729e2b2eab770dd-leads');

        // Busca todos os documentos na coleção que correspondem à campanha
        const customers = await collection.find({ campanha: sanitizedCampanha }).toArray();

        res.status(200).json(customers);
    } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        // Não expor detalhes do erro para o cliente
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Atualização via API Hablla ---
const habllaWorkspaceId = process.env.HABLLA_WORKSPACE_ID;
const habllaApiToken = process.env.HABLLA_API_TOKEN;

// Função para validar IDs de cartões
function validateCardIds(cardIds) {
    if (!Array.isArray(cardIds)) return false;
    return cardIds.every(id => typeof id === 'string' && id.trim() !== '');
}

// Função para validar campos de atualização
function validateFieldsToUpdate(fieldsToUpdate) {
    if (!fieldsToUpdate || typeof fieldsToUpdate !== 'object') return false;

    const allowedFields = ['campaign', 'source', 'status', 'description', 'reason'];
    return Object.keys(fieldsToUpdate).every(key => allowedFields.includes(key));
}

// Função para validar operações de tags
function validateTagsOperation(tagsOperation) {
    if (!tagsOperation) return true; // Opcional

    if (typeof tagsOperation !== 'object') return false;

    const allowedOperations = ['add', 'remove', 'replace'];
    if (!allowedOperations.includes(tagsOperation.operation)) return false;

    if (!Array.isArray(tagsOperation.tagIds)) return false;

    return tagsOperation.tagIds.every(id => typeof id === 'string' && id.trim() !== '');
}

// Rota para atualização de cartões v3 (Status e Tags)
app.put('/api/update-cards', authenticateToken, async (req, res) => {
    const { method, cardIds, boardId, stageId, fieldsToUpdate, tagsOperation } = req.body;

    // Validação de entrada
    if (!method || (!fieldsToUpdate && !tagsOperation)) {
        return res.status(400).json({ message: 'Pelo menos um campo ou operação de tag deve ser fornecido.' });
    }

    if (!habllaWorkspaceId || !habllaApiToken) {
        return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
    }

    // Validação adicional baseada no método
    if (method === 'manual') {
        if (!cardIds || cardIds.length === 0) return res.status(400).json({ message: 'A lista de IDs de cartões é obrigatória.' });
        if (!validateCardIds(cardIds)) return res.status(400).json({ message: 'IDs de cartões inválidos.' });
    } else if (method === 'board') {
        if (!boardId || !stageId) return res.status(400).json({ message: 'O ID do quadro e da coluna são obrigatórios.' });
    } else {
        return res.status(400).json({ message: 'Método de atualização inválido.' });
    }

    // Validação de campos e operações
    if (fieldsToUpdate && !validateFieldsToUpdate(fieldsToUpdate)) {
        return res.status(400).json({ message: 'Campos para atualizar inválidos.' });
    }

    if (tagsOperation && !validateTagsOperation(tagsOperation)) {
        return res.status(400).json({ message: 'Operação de tags inválida.' });
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `${habllaApiToken}` };
    let cardsToProcess = [];

    try {
        if (method === 'manual') {
            // Para o método manual, precisamos buscar os detalhes de cada cartão se a operação for de substituição de tags
            if (tagsOperation && tagsOperation.operation === 'replace') {
                for (const id of cardIds) {
                    const cardDetails = await getCardDetails(id.trim(), headers);
                    if (cardDetails) cardsToProcess.push(cardDetails);
                }
            } else {
                cardsToProcess = cardIds.map(id => ({ id })); // Estrutura simplificada se não precisar das tags existentes
            }
        } else if (method === 'board') {
            if (!boardId || !stageId) return res.status(400).json({ message: 'O ID do quadro e da coluna são obrigatórios.' });
            cardsToProcess = await getAllCardsFromBoard(boardId, stageId, headers);
            if (cardsToProcess.length === 0) return res.status(200).json({ summary: 'Nenhum cartão encontrado no quadro e coluna especificados.', log: [] });
        } else {
            return res.status(400).json({ message: 'Método de atualização inválido.' });
        }

        const log = [];
        for (const card of cardsToProcess) {
            const cardId = card.id.trim();
            if (!cardId) continue;

            let cardLog = { cardId, status: 'success', messages: [] };

            // 1. Atualização de campos principais (status, campanha, etc.)
            if (fieldsToUpdate && Object.keys(fieldsToUpdate).length > 0) {
                const updateUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId}`;
                try {
                    const response = await fetch(updateUrl, { method: 'PUT', headers, body: JSON.stringify(fieldsToUpdate) });
                    if (response.ok) cardLog.messages.push('Campos principais atualizados.');
                    else {
                        const errorData = await response.json().catch(() => ({}));
                        cardLog.messages.push(`Falha ao atualizar campos: ${errorData.message || 'Erro'}`);
                        cardLog.status = 'error';
                    }
                } catch (e) {
                    cardLog.messages.push(`Erro de conexão ao atualizar campos: ${e.message}`);
                    cardLog.status = 'error';
                }
            }

            // 2. Operações de Tags
            if (tagsOperation) {
                // 2a. Remover Tags (para 'remove' e 'replace')
                let tagsToRemove = [];
                if (tagsOperation.operation === 'remove') {
                    tagsToRemove = tagsOperation.tagIds || [];
                } else if (tagsOperation.operation === 'replace') {
                    tagsToRemove = card.tags ? card.tags.map(t => t.id) : [];
                }

                if (tagsToRemove.length > 0) {
                    const removeTagsUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId}/remove-tags`;
                    try {
                        const response = await fetch(removeTagsUrl, { method: 'PUT', headers, body: JSON.stringify({ tags: tagsToRemove }) });
                        if (response.ok) cardLog.messages.push('Tags removidas.');
                        else {
                            const errorData = await response.json().catch(() => ({}));
                            cardLog.messages.push(`Falha ao remover tags: ${errorData.message || 'Erro'}`);
                            cardLog.status = 'error';
                        }
                    } catch (e) {
                        cardLog.messages.push(`Erro de conexão ao remover tags: ${e.message}`);
                        cardLog.status = 'error';
                    }
                }

                // 2b. Adicionar Tags (para 'add' e 'replace')
                let tagsToAdd = [];
                if (tagsOperation.operation === 'add' || tagsOperation.operation === 'replace') {
                    tagsToAdd = tagsOperation.tagIds || [];
                }

                if (tagsToAdd.length > 0) {
                    const addTagsUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId}/add-tags`;
                    try {
                        const response = await fetch(addTagsUrl, { method: 'PUT', headers, body: JSON.stringify({ tags: tagsToAdd }) });
                        if (response.ok) cardLog.messages.push('Tags adicionadas.');
                        else {
                            const errorData = await response.json().catch(() => ({}));
                            cardLog.messages.push(`Falha ao adicionar tags: ${errorData.message || 'Erro'}`);
                            cardLog.status = 'error';
                        }
                    } catch (e) {
                        cardLog.messages.push(`Erro de conexão ao adicionar tags: ${e.message}`);
                        cardLog.status = 'error';
                    }
                }
            }
            log.push(cardLog);
        }
        res.status(200).json({ summary: `Processo finalizado para ${log.length} cartões.`, log });

    } catch (error) {
        console.error('Erro ao atualizar cartões:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Funcionalidade: Gerenciamento de Seguidores ---
// Função para buscar todos os atendimentos de um usuário, tratando a paginação
async function getAllServices(userId, headers) {
    let allServices = [];
    let page = 1;
    let totalPages = 1;

    console.log(`Buscando atendimentos para o usuário: ${userId}`);

    do {
        const url = `https://api.hablla.com/v2/workspaces/${habllaWorkspaceId}/services?user=${userId}&status=in_attendance&page=${page}`;
        console.log(`Fazendo requisição para: ${url}`);
        try {
            const response = await fetch(url, { method: 'GET', headers: headers });
            console.log(`Resposta da requisição para página ${page}:`, response.status);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Falha ao buscar atendimentos na página ${page}: ${errorData.message || response.statusText}`);
            }
            const data = await response.json();
            console.log(`Dados da página ${page}:`, data.results ? data.results.length : 0);
            if (data.results && data.results.length > 0) {
                allServices = allServices.concat(data.results);
            }
            totalPages = data.totalPages || 1;
            page++;
        } catch (error) {
            console.error(error);
            // Adicionar contexto mais detalhado ao erro
            throw new Error(`Erro ao buscar atendimentos do usuário ${userId}: ${error.message}`);
        }
    } while (page <= totalPages);

    console.log(`Total de ${allServices.length} atendimentos encontrados.`);
    return allServices;
}

// Função para buscar todos os OBJETOS de cartões de um quadro/coluna, tratando a paginação
async function getAllCardsFromBoard(boardId, stageId, headers) {
    let allCards = [];
    let page = 1;
    let totalPages = 1;
    console.log(`Buscando cartões para o quadro ${boardId} e coluna ${stageId}`);

    do {
        const url = `https://api.hablla.com/v3/workspaces/${habllaWorkspaceId}/cards?board=${boardId}&list=${stageId}&page=${page}`;
        try {
            const response = await fetch(url, { method: 'GET', headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Falha ao buscar cartões na página ${page}: ${errorData.message || response.statusText}`);
            }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                allCards = allCards.concat(data.results);
            }
            totalPages = data.totalPages || 1;
            page++;
        } catch (error) {
            console.error(error);
            throw error;
        }
    } while (page <= totalPages);

    console.log(`Total de ${allCards.length} cartões encontrados.`);
    return allCards;
}

async function getCardDetails(cardId, headers) {
    // A URL pode ser v1 ou v3 dependendo da API que retorna o objeto completo do cartão.
    // Vamos assumir v3 para consistência.
    const url = `https://api.hablla.com/v3/workspaces/${habllaWorkspaceId}/cards/${cardId}`;
    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            console.error(`Falha ao buscar detalhes do cartão ${cardId}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar detalhes do cartão ${cardId}:`, error);
        return null;
    }
}

// Rota principal para gerenciar seguidores
app.post('/api/manage-followers', authenticateToken, async (req, res) => {
    const { searchUserId, userToRemoveId, userToAddId } = req.body;

    console.log('Recebendo requisição para gerenciar seguidores:', { searchUserId, userToRemoveId, userToAddId });

    // Validação de entrada
    if (!searchUserId || !userToRemoveId || !userToAddId) {
        console.log('Erro: Todos os campos de usuário são obrigatórios.');
        return res.status(400).json({ message: 'Todos os campos de usuário são obrigatórios.' });
    }

    if (!habllaWorkspaceId || !habllaApiToken) {
        console.log('Erro: Credenciais da API do Hablla não configuradas no servidor.');
        return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `${habllaApiToken}`
    };

    try {
        console.log('Buscando serviços para o usuário:', searchUserId);
        const services = await getAllServices(searchUserId, headers);
        const log = [];

        console.log('Serviços encontrados:', services.length);

        if (services.length === 0) {
            console.log('Nenhum atendimento encontrado para o usuário selecionado.');
            return res.status(200).json({ summary: 'Nenhum atendimento encontrado para o usuário selecionado.', log: [] });
        }

        for (const service of services) {
            const attendanceId = service.id;
            let stepLog = { attendanceId, serviceName: service.name, steps: [] };

            console.log('Processando atendimento:', attendanceId);

            // 1. Remover Seguidor
            const removeUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/services/${attendanceId}/remove-followers`;
            try {
                console.log('Removendo seguidor:', userToRemoveId, 'do atendimento:', attendanceId);
                const removeResponse = await fetch(removeUrl, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ followers: [userToRemoveId] })
                });
                if (removeResponse.ok) {
                    stepLog.steps.push({ action: 'Remover Seguidor', status: 'success' });
                } else {
                    const errorData = await removeResponse.json().catch(() => ({}));
                    stepLog.steps.push({ action: 'Remover Seguidor', status: 'error', message: errorData.message || 'Falha na requisição.' });
                }
            } catch (e) {
                console.error('Erro ao remover seguidor:', e);
                stepLog.steps.push({ action: 'Remover Seguidor', status: 'error', message: e.message });
            }

            // 2. Adicionar Seguidor
            const addUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/services/${attendanceId}/add-followers`;
            try {
                console.log('Adicionando seguidor:', userToAddId, 'ao atendimento:', attendanceId);
                const addResponse = await fetch(addUrl, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ followers: [userToAddId] })
                });
                if (addResponse.ok) {
                    stepLog.steps.push({ action: 'Adicionar Seguidor', status: 'success' });
                } else {
                    const errorData = await addResponse.json().catch(() => ({}));
                    stepLog.steps.push({ action: 'Adicionar Seguidor', status: 'error', message: errorData.message || 'Falha na requisição.' });
                }
            } catch (e) {
                console.error('Erro ao adicionar seguidor:', e);
                stepLog.steps.push({ action: 'Adicionar Seguidor', status: 'error', message: e.message });
            }

            log.push(stepLog);
        }

        console.log('Processo finalizado para', services.length, 'atendimentos.');
        res.status(200).json({
            summary: `Processo finalizado para ${services.length} atendimentos.`,
            log: log
        });

    } catch (error) {
        console.error('Erro ao gerenciar seguidores:', error);
        // Garantir que sempre enviamos uma resposta, mesmo em caso de erro
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Erro ao gerenciar seguidores: ' + error.message,
                details: error.message
            });
        }
    }
});

// --- Endpoints de Proxy para a API Hablla (para a nova funcionalidade dono de atendimentos/cartão) ---

// Rota para buscar serviços (atendimentos)
app.get('/api/hablla/services', authenticateToken, async (req, res) => {
    const { sectorId, page = 1 } = req.query;

    if (!sectorId) {
        return res.status(400).json({ message: 'O parâmetro sectorId é obrigatório.' });
    }

    let url = `https://api.hablla.com/v2/workspaces/${habllaWorkspaceId}/services?limit=50&sector=${sectorId}&status=in_attendance&page=${page}`;
    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: { 'Authorization': habllaApiToken, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao contatar a API do Hablla.', details: error.message });
    }
});

// Rota para buscar detalhes de um cartão
app.get('/api/hablla/cards/:cardId', authenticateToken, async (req, res) => {
    const { cardId } = req.params;

    if (!isValidObjectId(cardId)) {
        return res.status(400).json({ message: 'ID de cartão inválido.' });
    }

    const url = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId}`;

    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: { 'Authorization': habllaApiToken, 'Content-Type': 'application/json' }
        }); const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao contatar a API do Hablla.', details: error.message });
    }
});

// Rota para atualizar o dono de um cartão
app.put('/api/hablla/cards/:cardId/owner', authenticateToken, async (req, res) => {
    const { cardId } = req.params;
    const { ownerId, userToken } = req.body; // Extrai o userToken do corpo

    console.log('--- DEBUG: ATUALIZANDO DONO DO CARTÃO ---');
    console.log('Card ID Recebido:', cardId);
    console.log('Owner ID Recebido:', ownerId);
    console.log('User Token Recebido:', userToken ? `${userToken.substring(0, 10)}...` : 'Nenhum');

    if (!isValidObjectId(cardId) || !isValidObjectId(ownerId)) {
        return res.status(400).json({ message: 'ID de cartão ou de dono inválido.' });
    }

    // Usa o token do usuário se ele for fornecido, senão, usa o token do workspace como fallback
    const authHeader = userToken ? `Bearer ${userToken}` : habllaApiToken;
    console.log('Authorization Header Construído:', authHeader ? `${authHeader.substring(0, 20)}...` : 'Nenhum');

    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autorização do Hablla não encontrado.' });
    }

    const url = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId}`;
    const body = { user: ownerId };

    console.log('URL da Requisição para Hablla:', url);
    console.log('Corpo da Requisição para Hablla:', JSON.stringify(body));
    console.log('----------------------------------------');

    try {
        const response = await fetchWithRetry(url, {
            method: 'PUT',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.status === 204 || response.ok) { // 204 No Content é um sucesso comum para PUT
            return res.status(204).send();
        }
        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao contatar a API do Hablla.', details: error.message });
    }
});




// --- NOVOS ENDPOINTS PARA ATUALIZAÇÃO DE DONO (LÓGICA OTIMIZADA) ---

// Endpoint para login de usuário Hablla e obtenção de accessToken
app.post('/api/hablla/login', authenticateToken, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const url = 'https://api.hablla.com/v1/authentication/login';
    try {
        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        // Retornamos apenas o token para o frontend, por segurança
        res.status(200).json({ accessToken: data.accessToken });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao tentar fazer login na API do Hablla.', details: error.message });
    }
});

// Endpoint para buscar cartões de um quadro e coluna
app.get('/api/hablla/cards', authenticateToken, async (req, res) => {
    const { boardId, stageId } = req.query;
    if (!boardId || !stageId) {
        return res.status(400).json({ message: 'boardId e stageId são obrigatórios.' });
    }
    try {
        const cards = await getAllCardsFromBoard(boardId, stageId, { 'Authorization': habllaApiToken });
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar cartões no Hablla.', details: error.message });
    }
});

// Endpoint para buscar serviços abertos de uma pessoa
app.post('/api/hablla/person-opened-services', authenticateToken, async (req, res) => {
    const { personId, userAccessToken } = req.body;
    if (!personId || !userAccessToken) {
        return res.status(400).json({ message: 'personId e userAccessToken são obrigatórios.' });
    }

    const url = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/persons/${personId}/opened-services`;
    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userAccessToken}` // Usa o Bearer token temporário
            }
        }, 2, 61000); // Tenta 2 vezes com um delay de 61 segundos para o bloqueio de IP
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar serviços da pessoa.', details: error.message });
    }
});

// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware para tratamento de erros 404
app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada.' });
});

// Inicia o servidor para ouvir as requisições
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});
