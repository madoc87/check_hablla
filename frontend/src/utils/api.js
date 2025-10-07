export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para centralizar a lógica de fetch para o NOSSO backend
async function apiFetch(url, options = {}) {
    // O token de autenticação para o nosso próprio backend
    const apiSecretToken = import.meta.env.VITE_API_SECRET_TOKEN;

    if (!apiSecretToken) {
        throw new Error('Variável de ambiente VITE_API_SECRET_TOKEN não está configurada no frontend.');
    }

    const headers = {
        'Content-Type': 'application/json',
        // Este é o token para autenticar o frontend com o backend
        'Authorization': `Bearer ${apiSecretToken}`,
        ...options.headers,
    };

    // As URLs agora são relativas ao nosso próprio servidor
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Resposta inválida do servidor' }));
        const errorMessage = errorData.message || response.statusText;
        console.error(`Erro na chamada ao backend: ${response.status} ${errorMessage}`, { url, options });
        throw new Error(`Erro do servidor (${response.status}): ${errorMessage}`);
    }

    // Para respostas 204 No Content, não há corpo para parsear
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/**
 * Busca todos os serviços paginados através do nosso backend.
 * @param {string} sectorId - O ID do setor.
 * @param {string} boardId - O ID do quadro para filtrar os serviços.
 * @returns {Promise<Array>} - Uma lista de todos os serviços encontrados.
 */
export async function getAllServices(sectorId, boardId = null) {
    let allServices = [];
    let page = 1;
    let totalPages = 1;

    do {
        try {
            let url = `/api/hablla/services?sectorId=${sectorId}&page=${page}`;
            if (boardId) {
                url += `&boardId=${boardId}`;
            }
            const data = await apiFetch(url);
            
            if (data.results && data.results.length > 0) {
                allServices = allServices.concat(data.results);
            }
            totalPages = data.totalPages || 1;
            page++;
            await sleep(250); // Adiciona uma pausa de 250ms para não sobrecarregar a API
        } catch (error) {
            console.error(`Erro ao buscar página ${page} dos serviços via backend:`, error);
            throw error; 
        }
    } while (page <= totalPages);

    return allServices;
}

/**
 * Busca os detalhes de um cartão específico através do nosso backend.
 * @param {string} cardId - O ID do cartão.
 * @returns {Promise<Object>} - Os detalhes do cartão.
 */
export async function getCardDetails(cardId) {
    const url = `/api/hablla/cards/${cardId}`;
    return await apiFetch(url);
}

/**
 * Atualiza o dono (usuário) de um cartão através do nosso backend.
 * @param {string} cardId - O ID do cartão a ser atualizado.
 * @param {string} ownerId - O ID do novo dono.
 * @param {string} userToken - O token de acesso do usuário do Hablla.
 * @returns {Promise<Object>} - A resposta da API após a atualização.
 */
export async function updateCardOwner(cardId, ownerId, userToken) {
    const url = `/api/hablla/cards/${cardId}/owner`;
    return await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify({ ownerId, userToken }), // Envia o token no corpo
    });
}

// --- NOVAS FUNÇÕES PARA LÓGICA OTIMIZADA ---

export async function getHabllaUserToken(email, password) {
    return await apiFetch('/api/hablla/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

export async function getCardsFromBoard(boardId, stageId) {
    const url = `/api/hablla/cards?boardId=${boardId}&stageId=${stageId}`;
    return await apiFetch(url);
}

export async function getOpenedServicesForPerson(personId, userAccessToken) {
    return await apiFetch('/api/hablla/person-opened-services', {
        method: 'POST',
        body: JSON.stringify({ personId, userAccessToken })
    });
}