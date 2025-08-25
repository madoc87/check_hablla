// Importação dos pacotes necessários
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const fetch = require('node-fetch'); // 'node-fetch' para chamadas de API no backend
require('dotenv').config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;

// Configurações do Middleware
app.use(cors());
app.use(express.json());

// --- Conexão com MongoDB ---
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new MongoClient(mongoUri);

async function connectToDb() {
  try {
    await client.connect();
    console.log('Conectado com sucesso ao MongoDB!');
  } catch (err) {
    console.error('Falha ao conectar com o MongoDB', err);
  }
}

if(mongoUri) {
    connectToDb();
}

// Rota para verificação de banco
app.get('/api/customers', async (req, res) => {
  const { campanha } = req.query; // Pega o nome da campanha da URL

  if (!campanha) {
    return res.status(400).json({ message: 'O nome da campanha é obrigatório.' });
  }

  try {
    const db = client.db(dbName);
    // IMPORTANTE: O nome da coleção do dicionario de leads criado no Hablla, é 'workspace-67e44bc7d729e2b2eab770dd-leads'.
    const collection = db.collection('workspace-67e44bc7d729e2b2eab770dd-leads'); 

    // Busca todos os documentos na coleção que correspondem à campanha
    const customers = await collection.find({ campanha: campanha }).toArray();
    
    res.status(200).json(customers);
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});


// --- Atualização via API Hablla ---
const habllaWorkspaceId = process.env.HABLLA_WORKSPACE_ID;
const habllaApiToken = process.env.HABLLA_API_TOKEN;

// --- Rota para atualização de cartões
// app.put('/api/update-cards', async (req, res) => {
//   const { cardIds, fieldsToUpdate } = req.body;

//   if (!cardIds || !fieldsToUpdate || cardIds.length === 0) {
//     return res.status(400).json({ message: 'IDs dos cartões e campos para atualizar são obrigatórios.' });
//   }

//   if (!habllaWorkspaceId || !habllaApiToken) {
//     return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
//   }

//   const results = [];
//   const headers = {
//     'Content-Type': 'application/json',
//     'Authorization': `${habllaApiToken}`
//   };

//   // O Hablla espera o payload com os campos a serem atualizados.
//   // O nome do campo no payload deve ser o mesmo esperado pela API.
//   // Ex: { "campaign": "Nova Campanha", "source": "Nova Fonte" }
//   const payload = fieldsToUpdate;

//   for (const cardId of cardIds) {
//     const url = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${cardId.trim()}`;
    
//     try {
//       const response = await fetch(url, {
//         method: 'PUT',
//         headers: headers,
//         body: JSON.stringify(payload)
//       });

//       if (response.ok) {
//         results.push({ cardId: cardId, status: 'success', message: 'Cartão atualizado com sucesso.' });
//       } else {
//         const errorData = await response.json();
//         results.push({ cardId: cardId, status: 'error', message: `Falha: ${errorData.message || response.statusText}` });
//       }
//     } catch (error) {
//       results.push({ cardId: cardId, status: 'error', message: `Erro de conexão: ${error.message}` });
//     }
//   }

//   res.status(200).json(results);
// });

// Rota para atualização de cartões v2
// app.put('/api/update-cards', async (req, res) => {
//     const { method, cardIds, boardId, stageId, fieldsToUpdate } = req.body;

//     if (!method || !fieldsToUpdate) {
//         return res.status(400).json({ message: 'O método e os campos para atualizar são obrigatórios.' });
//     }

//     if (!habllaWorkspaceId || !habllaApiToken) {
//         return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
//     }

//     const headers = { 'Content-Type': 'application/json', 'Authorization': `${habllaApiToken}` };
//     let finalCardIds = [];

//     try {
//         if (method === 'manual') {
//             if (!cardIds || cardIds.length === 0) {
//                 return res.status(400).json({ message: 'A lista de IDs de cartões é obrigatória para o método manual.' });
//             }
//             finalCardIds = cardIds;
//         } else if (method === 'board') {
//             if (!boardId || !stageId) {
//                 return res.status(400).json({ message: 'O ID do quadro e da coluna são obrigatórios para o método de quadro.' });
//             }
//             finalCardIds = await getAllCardIdsFromBoard(boardId, stageId, headers);
//             if (finalCardIds.length === 0) {
//                 return res.status(200).json({ summary: 'Nenhum cartão encontrado no quadro e coluna especificados.', log: [] });
//             }
//         } else {
//             return res.status(400).json({ message: 'Método de atualização inválido.' });
//         }

//         const log = [];
//         for (const cardId of finalCardIds) {
//             const trimmedCardId = String(cardId).trim();
//             if (!trimmedCardId) continue;

//             const url = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/cards/${trimmedCardId}`;
//             try {
//                 const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(fieldsToUpdate) });
//                 if (response.ok) {
//                     log.push({ cardId: trimmedCardId, status: 'success', message: 'Cartão atualizado.' });
//                 } else {
//                     const errorData = await response.json().catch(() => ({ message: response.statusText }));
//                     log.push({ cardId: trimmedCardId, status: 'error', message: `Falha: ${errorData.message}` });
//                 }
//             } catch (error) {
//                 log.push({ cardId: trimmedCardId, status: 'error', message: `Erro de conexão: ${error.message}` });
//             }
//         }
//         res.status(200).json({ summary: `Processo finalizado para ${log.length} cartões.`, log });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });










// Rota para atualização de cartões v3 (Status e Tags)
app.put('/api/update-cards', async (req, res) => {
    const { method, cardIds, boardId, stageId, fieldsToUpdate, tagsOperation } = req.body;

    if (!method || (!fieldsToUpdate && !tagsOperation)) {
        return res.status(400).json({ message: 'Pelo menos um campo ou operação de tag deve ser fornecido.' });
    }

    if (!habllaWorkspaceId || !habllaApiToken) {
        return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `${habllaApiToken}` };
    let cardsToProcess = [];

    try {
        if (method === 'manual') {
            if (!cardIds || cardIds.length === 0) return res.status(400).json({ message: 'A lista de IDs de cartões é obrigatória.' });
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
        res.status(500).json({ message: error.message });
    }
});
















// --- Nova Funcionalidade: Gerenciamento de Seguidores ---
// const habllaWorkspaceId = process.env.HABLLA_WORKSPACE_ID;
// const habllaApiToken = process.env.HABLLA_API_TOKEN;

// Função para buscar todos os atendimentos de um usuário, tratando a paginação
async function getAllServices(userId, headers) {
    let allServices = [];
    let page = 1;
    let totalPages = 1;

    console.log(`Buscando atendimentos para o usuário: ${userId}`);

    do {
        const url = `https://api.hablla.com/v2/workspaces/${habllaWorkspaceId}/services?user=${userId}&status=in_attendance&page=${page}`;
        try {
            const response = await fetch(url, { method: 'GET', headers: headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Falha ao buscar atendimentos na página ${page}: ${errorData.message || response.statusText}`);
            }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                allServices = allServices.concat(data.results);
            }
            totalPages = data.totalPages || 1;
            page++;
        } catch (error) {
            console.error(error);
            throw error; // Propaga o erro para ser tratado na rota principal
        }
    } while (page <= totalPages);
    
    console.log(`Total de ${allServices.length} atendimentos encontrados.`);
    return allServices;
}








// Função para buscar todos os OBJETOS de cartões de um quadro/coluna, tratando a paginação

async function getAllCardsFromBoard(boardId, stageId, headers) {
    // let allCardIds = [];
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
                // const ids = data.results.map(card => card.id);
                // allCardIds = allCardIds.concat(ids);
                allCards = allCards.concat(data.results);
            }
            totalPages = data.totalPages || 1;
            page++;
        } catch (error) {
            console.error(error);
            throw error;
        }
    } while (page <= totalPages);

    // console.log(`Total de ${allCardIds.length} cartões encontrados.`);
    console.log(`Total de ${allCards.length} cartões encontrados.`);
    // return allCardIds;
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
app.post('/api/manage-followers', async (req, res) => {
    const { searchUserId, userToRemoveId, userToAddId } = req.body;

    if (!searchUserId || !userToRemoveId || !userToAddId) {
        return res.status(400).json({ message: 'Todos os campos de usuário são obrigatórios.' });
    }

    if (!habllaWorkspaceId || !habllaApiToken) {
        return res.status(500).json({ message: 'Credenciais da API do Hablla não configuradas no servidor.' });
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `${habllaApiToken}`
    };

    try {
        const services = await getAllServices(searchUserId, headers);
        const log = [];

        if (services.length === 0) {
            return res.status(200).json({ summary: 'Nenhum atendimento encontrado para o usuário selecionado.', log: [] });
        }

        for (const service of services) {
            const attendanceId = service.id;
            let stepLog = { attendanceId, serviceName: service.name, steps: [] };

            // 1. Remover Seguidor
            const removeUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/services/${attendanceId}/remove-followers`;
            try {
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
                stepLog.steps.push({ action: 'Remover Seguidor', status: 'error', message: e.message });
            }

            // 2. Adicionar Seguidor
            const addUrl = `https://api.hablla.com/v1/workspaces/${habllaWorkspaceId}/services/${attendanceId}/add-followers`;
            try {
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
                stepLog.steps.push({ action: 'Adicionar Seguidor', status: 'error', message: e.message });
            }
            
            log.push(stepLog);
        }

        res.status(200).json({ 
            summary: `Processo finalizado para ${services.length} atendimentos.`,
            log: log 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});









// Inicia o servidor para ouvir as requisições
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});
