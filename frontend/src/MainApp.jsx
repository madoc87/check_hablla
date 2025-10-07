import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { read, utils, writeFile } from 'xlsx';
import { UploadCloud, Download, ChevronsRight, Loader2, Sun, Moon, Database, RefreshCw, Send, Users, LogOut } from 'lucide-react';
import './App.css';
import { getAllServices, getCardDetails, updateCardOwner, sleep, getHabllaUserToken } from './utils/api';
import LoginModal from './components/auth/LoginModal';

// Componente reutilizável para Upload de Arquivos


// Componente reutilizável para Upload de Arquivos
const FileUploader = ({ onDrop, file, title }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });
    return (
        <div>
            <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
            <div {...getRootProps()} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} border-dashed rounded-md cursor-pointer transition-colors`}>
                <input {...getInputProps()} />
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    {file ? <p className="text-sm text-green-600 dark:text-green-400 font-semibold">{file.name}</p> : <p className="text-sm text-gray-600 dark:text-gray-400">{isDragActive ? 'Solte o arquivo aqui...' : 'Arraste e solte ou clique para selecionar'}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-500">XLS, XLSX até 10MB</p>
                </div>
            </div>
        </div>
    );
};

// --------------------------- INICIO CONSTANTES ---------------------------
// // Constantes - Campos que podem ser atualizados via API
const AVAILABLE_FIELDS = [
    { id: 'campaign', label: 'Campanha', type: 'text' },
    { id: 'source', label: 'Fonte', type: 'text' },
    { id: 'status', label: 'Status', type: 'status_select' }, // Tipo especial
    { id: 'tags', label: 'Etiquetas', type: 'tags_select' }, // Tipo especial
    { id: 'description', label: 'Descrição', type: 'textarea' },
];



const HABLLA_USERS = [
    { name: 'TI', id: '681ceb148a7cb31c4b5e53ca' },
    { name: 'Flávia Ronchi', id: '682790d6fa59863bdc7eb675' },
    { name: 'Adriana Ricardo', id: '67e6c9cb97bb78bdc59f7a3f' },
    { name: 'Amanda Aguiar', id: '67f3e657762fccd43d97ffc4' },
    { name: 'Amanda Soares', id: '6895fcb6cf3fce16ed2841be' },
    { name: 'Anselmo Lázaro', id: '6825e45c54eb0f846f1ed757' },
    { name: 'Diogo Cruz', id: '685078a023f7a09562ee3a9e' },
    { name: 'Eduardo Rocha', id: '687936b47bdf3e244b2ddc24' },
    { name: 'Felipe Adauto', id: '68b5a0a331973eeb1b985d1f' },
    { name: 'Gustavo Sales - Inside', id: '6889030fb28207ba82cbc56b' },
    { name: 'Janderson Pires', id: '6870fe5160fdda6d848b95a3' },
    { name: 'João Victor Oliveira dos Santos', id: '6878fece81c8664ae4944eec' },
    { name: 'Júlia Rocha', id: '689ba1c1a00bca67dd0809b3' },
    { name: 'Letícia Lopes SAC', id: '6871202deb6aea67473b699a' },
    { name: 'Lorena Amaral', id: '67ed2ab29126c951b231c308' },
    { name: 'Lourrany Guedes', id: '685da2c08a27472541b92c40' },
    { name: 'LUANA AMANCIO', id: '681e0768a307e8932ad53739' },
    { name: 'Luis Eduardo', id: '68c804b80f54d5269c61d336' },
    { name: 'Luna', id: '681e06ced30e18843cff1bf1' },
    { name: 'Manoela Teixeira', id: '681e069f545baaffcf3d2d7a' },
    { name: 'Michelle', id: '686298edf577ef4265cc6ab8' },
    { name: 'Nayara Maciel', id: '689f3b34ba21750abee08ff9' },
    { name: 'Pedro Marinho', id: '68c804776c11d07a7b0b4b6d' },
    { name: 'Theo Lobo', id: '681e072a7674ab5b15f61487' },
    { name: 'Wesley Abreu', id: '68793f258538980eb2ade8db' },
    // Se necessario podem ser adicionados outros usuários aqui
];

const HABLLA_SECTORS = [
    { name: 'Digital', id: '68c42f143f934dcd3fad6f09' },
    { name: 'TI', id: '681c98f3485e133f2e01922c' },
    { name: 'Televendas - PF', id: '67eac8cd51ad3f9f350ac8bf' },
    { name: 'Assistência Técnica', id: '681c989bb89a8cf337ac1868' },
    { name: 'Digital / Site / E-Commerce', id: '681c9941046cf838ac984282' },
    { name: 'Financeiro', id: '6825e7403a2da115725886a0' },
    { name: 'Inside Sales', id: '67e546d91c797f3123a9d167' },
    { name: 'Lojas', id: '681c99235cf759fd86fa7418' },
    { name: 'Marketing', id: '681c98d93dfbfa55a9083972' },
    { name: 'Pessoa Jurídica - PJ', id: '681c990b5cf759fd86fa735e' },
    { name: 'Projetos e Tarefas', id: '67eac940a9cd2238e8a63b27' },
    // Se necessario podem ser adicionados outros setores aqui
];

const BOARDS = {
    '682251a6c5a42b757a5dbe79': {
        name: 'IA Manutenção',
        stages: [
            { name: 'Tentativa de contato', id: '6852ca77894e7f357ac3ca09' },
            { name: 'IA Agendando', id: '6824f24ccb0e13b88d43e8e6' },
            { name: 'Finalizado', id: '6874ebfab63f08f2bda7f92a' },
            { name: 'Aguardando Aprovação', id: '6824f25ba10f0696039b3459' },
            { name: 'Operador Agendando', id: '6824f25284abcef8ed206379' },
            { name: 'Abandonado', id: '6824f25f52eac2d758733e79' },
            { name: 'Aguardando troca', id: '6852c9d9a9bcdc109b308f5a' },
            { name: 'Remarketing', id: '68641e2511228ce80a6c7729' },
        ]
    },

    //SEGUNDO QUADRO
    '68c42f9c626dd84e960cc92b': {
        name: 'Digital',
        stages: [
            { name: 'Lead Recebido', id: '68c43adc981b35cf9508f232' },
            { name: 'Tentando Contato', id: '68c43b0a7592114b79eb0ae7' },
            { name: 'Qualificado', id: '68c43b356933d9f630a256ac' },
            { name: 'Proposta | Valor R$', id: '68c43c651122024d4d381fa0' },
        ]
    },

    //TERCEIRO QUADRO
    '67ed27b22f1b8a5a02c348c2': {
        name: 'Televendas PF',
        stages: [
            { name: 'Receptivo', id: '67ed287db11105bceabd4d59' },
            { name: 'Leads', id: '684096a4789acfc8a2bf548e' },
            { name: 'Em Atendimento', id: '67ed28e77b44cf905161f4ca' },
            { name: 'Negociando', id: '67ed291d8deaf73871b50fc4' },
            { name: 'Finalizado', id: '67f81d44e6edd9b4284d7b56' },
            { name: 'Remarketing', id: '685c2373b204202a7a8b557c' },
            { name: 'para deletar 2', id: '685c2382dfe606fc5154c7cf' },
            { name: 'para deletar 3', id: '685eef0c66e33f79eab4ff7d' },
        ]
    },

    //QUARTO QUADRO
    '6862f617232cdd6b69cfe545': {
        name: 'Lojas',
        stages: [
            { name: 'Bot', id: '68822b4cf1d8bcc0e22acbc4' },
            { name: 'Aguardando Atendimento', id: '6868351cd4da80c5393074b1' },
            { name: 'Negociação', id: '68643482097d60264bf64bf1' },
            { name: 'Finalizado', id: '68667f250ffbbbd07f5bbc94' },
            { name: 'Abandonado', id: '68667e72be0d01b52e9fbcbb' },
            { name: 'Re-marketing', id: '686434f07b42b21d5c9f5bb1' },
            { name: 'Tentativa de contato', id: '68667c5eeae545c8762afc22' },
        ]
    },

    //QUINTO QUADRO
    '685c24cca0784d79c539af00': {
        name: 'Televendas PJ',
        stages: [
            { name: 'Prospeção', id: '685c24dc50a4e236507cef81' },
            { name: 'Leads', id: '689f952009bc10b83f9cb3d6' },
            { name: 'Em Atendimento', id: '685c24e68a85f24ffcff6505' },
            { name: 'Visitas agendadas', id: '686c21946be4253f97c3c22d' },
            { name: 'Proposta Enviada', id: '685c24ef9882618f5b6b13ba' },
            { name: 'Finalizado', id: '686c21331ab7c007027a8b33' },
        ]
    },

    //SEXTO QUADRO
    '67e69469e61a2499d84a4e65': {
        name: 'Inside Sales',
        stages: [
            { name: 'Leads', id: '67e694738b906aae64dc2837' },
            { name: 'Sem Contato', id: '689202205c83694b8e6bc8a0' },
            { name: 'Primeiro contato', id: '682cdb244186cba8bc39bb1e' },
            { name: 'Negociação', id: '67e6947c8d506fc6c0924598' },
            { name: 'Proposta', id: '67ed294b68ac2bffdc128dce' },
            { name: 'Ganho', id: '67ed298368ac2bffdc128f98' },
            { name: 'Perdido', id: '689203ae36d27ff0e2e2eb8c' },
        ]
    },

    //SETIMO QUADRO
    '681fd53d454440210d383433': {
        name: 'Assistência Técnica',
        stages: [
            { name: 'Orçamento', id: '681fd5588a7cb31c4b69cc1d' },
            { name: 'OS Aberta', id: '681fd565485e133f2e0ff3d6' },
            { name: 'Diagnóstico', id: '681fd56a5fb71d918b2b129f' },
            { name: 'OS Reparo', id: '681fd571ee02d524cb39f666' },
            { name: 'Retirada/Entrega', id: '685c22c8278e23aa93a4594f' },
            { name: 'OS Concluída', id: '685c22d16a902f6fbce23479' },
            { name: 'OS fechada', id: '685c22d5a0784d79c5399a49' },
        ]
    },

    //OITAVO QUADRO
    '6825d919b5c101953b6b67be': {
        name: 'Projetos e Tarefas | Por Departamento',
        stages: [
            { name: '🚨 - Pendente / Pra fazer', id: '6825d9bb6ec84f29a6cd877a' },
            { name: '⌛ - Fazendo', id: '6825dae9b6b7d4462ab0bf11' },
            { name: '🔐 - Dependente', id: '6825dbd0fa59863bdc765d44' },
            { name: '❌ - Não realizado | Atrasado', id: '6825dc47c7a0f02cfd615b10' },
            { name: '✅ - Realizado | Entregue', id: '6825dc026ec84f29a6cd96a1' },
            { name: 'Departamentos', id: '6835c42afd67c0b5aa074bbd' },
        ]
    },

    //NONO e ULTIMO QUADRO
    '682cbfd0b7a2255a8de33d90': {
        name: 'DEMANDAS MARKETING',
        stages: [
            { name: 'DEMANDAS NOVAS', id: '682ce027e11a2e1830d27ab9' },
            { name: 'EM ANDAMENTO', id: '682ce3ffded92c130b89d8bd' },
            { name: 'EM APROVAÇÃO', id: '682ce4094186cba8bc3a1b3e' },
            { name: 'EM ORÇAMENTO', id: '682ce41b49d8ac8e503f0547' },
            { name: 'CONCLUIDOS', id: '682ce434ea452303891fe0ec' },
        ]
    },

    //DECIMO e ULTIMO QUADRO
    '68d2bc9e211ec7addd2ed582': {
        name: 'zTeste',
        stages: [
            { name: 'Coluna 1', id: '68d2bcce3e9caad995ab4b57' },
            { name: 'Coluna 2', id: '68d2bcd27e0d15b9c35a9bab' },
            { name: 'Coluna 3', id: '68d2bcd7115d852f0bfe1522' },
        ]
    }
};

// const HABLLA_SECTORS = [
// { name: 'Digital', id: '68c42f143f934dcd3fad6f09' },
// { name: 'Comercial', id: '6825e45c54eb0f846f1ed757' },
// Adicione outros setores conforme necessário
// ];

const STATUS_OPTIONS = [
    { name: 'Em atendimento', id: 'in_attendance' },
    { name: 'Ganho', id: 'won' },
    { name: 'Perdido', id: 'lost' },
];

const LOST_REASONS = [
    { name: 'Nunca respondeu (Lojas)', id: '689b87ff1a55b1d88470c6b4' },
    { name: 'Achou caro', id: '67eac5e3b2c518858668a6dd' },
    { name: 'Mensagem não enviada (TI)', id: '689b99f5c8d72e2195ea6904' },
    { name: 'Outro Estado - Sem possibilidade de Venda', id: '67eac577b2c518858668a3fb' },
    { name: 'Vai pensar!', id: '67eac5fcb0bd67bc269e98ba' },
    { name: 'Comprou com o concorrente', id: '67ec3451654dd53d86449853' },
    { name: 'Sem Contato - Respondeu e Desapareçou', id: '67eac4dc56988ee8f0ae22d6' },
];

const TAGS = [
    { name: 'Disparo em massa (Loja)', id: '689b88a304315bd8e116c6fa' },
    { name: 'Everest', id: '688931377adca9b52875f47a' },
    { name: 'IA - Mgs não enviada', id: '689214de8385d506466c22ff' },
    { name: 'Lojas', id: '68261a182e9ff3cd23a05ef1' },
    { name: 'Nunca respondeu', id: '689e4a9209755560a31768a7' },
];

// --------------------------- FIM CONSTANTES ---------------------------

export default function MainApp({ currentUser }) {
    const initialBoardForOwner = Object.keys(BOARDS)[0];
    const initialStageForOwner = BOARDS[initialBoardForOwner].stages[0]?.id || '';
    const [theme, setTheme] = useState(currentUser?.theme || 'dark');
    const [activeTool, setActiveTool] = useState('databaseCheck');

    // Estados para a nova ferramenta de atualização de dono do cartão
    const [selectedBoardForOwnerUpdate, setSelectedBoardForOwnerUpdate] = useState(initialBoardForOwner);
    const [selectedStageForOwnerUpdate, setSelectedStageForOwnerUpdate] = useState(initialStageForOwner);
    const [selectedSectorForOwnerUpdate, setSelectedSectorForOwnerUpdate] = useState(HABLLA_SECTORS[0].id);
    const [onlyWithoutOwner, setOnlyWithoutOwner] = useState(true);
    const [hasStartedOwnerUpdate, setHasStartedOwnerUpdate] = useState(false);
    const [cardOwnerUpdateIsLoading, setCardOwnerUpdateIsLoading] = useState(false);
    const [cardOwnerUpdateError, setCardOwnerUpdateError] = useState('');
    const [cardOwnerUpdateResults, setCardOwnerUpdateResults] = useState({ summary: '', log: [], noCards: [], multipleCards: [], skipped: [], missingOwner: [] });
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [habllaUserToken, setHabllaUserToken] = useState(null);

    // Estados para Gerenciamento de Seguidores
    const [searchUserId, setSearchUserId] = useState(HABLLA_USERS[1].id);
    const [userToRemoveId, setUserToRemoveId] = useState(HABLLA_USERS[0].id);
    const [userToAddId, setUserToAddId] = useState(HABLLA_USERS[0].id);
    const [followerMgmtIsLoading, setFollowerMgmtIsLoading] = useState(false);
    const [followerMgmtResults, setFollowerMgmtResults] = useState({ summary: '', log: [] });
    const [followerMgmtError, setFollowerMgmtError] = useState('');


    // --- Estados para a Ferramenta de Atualização via API ---
    const [cardIds, setCardIds] = useState('');
    const [selectedFields, setSelectedFields] = useState({});
    const [fieldValues, setFieldValues] = useState({});
    const [apiUpdateIsLoading, setApiUpdateIsLoading] = useState(false);
    const [apiUpdateResults, setApiUpdateResults] = useState([]);
    const [apiUpdateError, setApiUpdateError] = useState('');

    // --- Novos estados da aplicação ---
    const [updateMethod, setUpdateMethod] = useState('manual'); // 'manual' ou 'board'
    const [selectedBoardId, setSelectedBoardId] = useState(Object.keys(BOARDS)[0]);
    const [selectedStageId, setSelectedStageId] = useState(BOARDS[Object.keys(BOARDS)[0]].stages[0].id);


    // --- Estados para Verificação de Banco ---
    const [dbCheckFile, setDbCheckFile] = useState(null);
    const [dbCheckXlsData, setDbCheckXlsData] = useState([]);
    const [campaignName, setCampaignName] = useState('');
    const [comparisonKey, setComparisonKey] = useState('telefone');
    const [sentCustomers, setSentCustomers] = useState([]);
    const [notSentCustomers, setNotSentCustomers] = useState([]);
    const [selectedToExport, setSelectedToExport] = useState(new Set());
    const [dbCheckIsLoading, setDbCheckIsLoading] = useState(false);
    const [dbCheckError, setDbCheckError] = useState('');
    const [dbCheckStep, setDbCheckStep] = useState(1);

    // --- Estados para Correção de Planilhas ---
    const [dispatchFile, setDispatchFile] = useState(null);
    const [cardsFile, setCardsFile] = useState(null);
    const [dispatchData, setDispatchData] = useState([]);
    const [cardsData, setCardsData] = useState([]);
    const [updatedRows, setUpdatedRows] = useState([]);
    const [finalSheetData, setFinalSheetData] = useState([]);
    const [sheetCorrectionIsLoading, setSheetCorrectionIsLoading] = useState(false);
    const [sheetCorrectionError, setSheetCorrectionError] = useState('');
    const [sheetCorrectionStep, setSheetCorrectionStep] = useState(1);

    // Função para fazer logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        window.location.reload();
    };

    // Tema definido por padrão
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const handleFileDrop = (acceptedFiles, setFile, setData, setError) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setFile(file);
            setError('');
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    setData(utils.sheet_to_json(worksheet));
                } catch (error) {
                    console.error('Erro ao processar o arquivo:', error);
                    setError("Erro ao ler o arquivo.");
                    setFile(null);
                    setData([]);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    //Lógica para selecionar todos ou desmarcar todos
    const areAllSelected = notSentCustomers.length > 0 && selectedToExport.size === notSentCustomers.length;
    const handleToggleSelectAll = () => {
        // Se todos já estiverem selecionados, limpe a seleção
        if (areAllSelected) {
            setSelectedToExport(new Set());
        } else {
            // Se não, selecione todos
            const allCustomerIdentifiers = notSentCustomers.map(customer => {
                const identifier = comparisonKey === 'telefone' ? customer.Telefone : customer.Sequencia;
                // Retorna o identificador como string, tratando casos nulos/undefined
                return identifier ? String(identifier) : null;
            }).filter(Boolean); // Remove quaisquer identificadores nulos da lista

            setSelectedToExport(new Set(allCustomerIdentifiers));
        }
    };

    // Lógica de Gerenciamento de Seguidores
    const handleManageFollowers = async () => {
        setFollowerMgmtIsLoading(true);
        setFollowerMgmtError('');
        setFollowerMgmtResults({ summary: '', log: [] });
        try {
            const response = await fetch('/api/manage-followers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN || 'sua-senha-secreta-aqui'}`
                },
                body: JSON.stringify({ searchUserId, userToRemoveId, userToAddId }),
            });

            // Verifica se a resposta tem conteúdo antes de tentar parsear como JSON
            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Resposta vazia do servidor. Verifique se o backend está em execução e se as credenciais do MongoDB estão configuradas corretamente.');
            }

            let results;
            try {
                results = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}. Verifique se o backend está funcionando corretamente.`);
            }

            if (!response.ok) {
                const errorMessage = results.message || 'Ocorreu um erro no servidor.';
                throw new Error(`Erro na requisição (${response.status}): ${errorMessage}`);
            }

            setFollowerMgmtResults(results);
        } catch (error) {
            console.error('Erro ao gerenciar seguidores:', error);
            let userFriendlyMessage = error.message;

            // Melhorar mensagens de erro comuns
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                userFriendlyMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.';
            } else if (error.message.includes('ECONNRESET')) {
                userFriendlyMessage = 'Conexão interrompida com o servidor. Tente novamente ou verifique sua conexão com a internet.';
            } else if (error.message.includes('Resposta vazia')) {
                userFriendlyMessage = 'O servidor não retornou dados. Verifique se o backend está funcionando e se as credenciais do MongoDB estão corretas.';
            } else if (error.message.includes('API (500)')) {
                userFriendlyMessage = 'Erro interno no servidor. Verifique se o MongoDB está acessível e se as credenciais estão corretas.';
            }

            setFollowerMgmtError(userFriendlyMessage);
        } finally {
            setFollowerMgmtIsLoading(false);
        }
    };

    // --- Lógica das outras Ferramentas de Atualização via API ---
    const handleFieldToggle = (fieldId) => {
        setSelectedFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
    };

    const handleValueChange = (fieldId, value) => {
        setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleApiUpdate = async () => {
        let payload = {};

        // Validações e montagem do payload
        const fieldsToUpdate = {};
        let tagsOperation = null;

        // Monta o payload dos campos simples
        Object.keys(selectedFields).forEach(key => {
            if (selectedFields[key]) {
                if (key === 'campaign' || key === 'source' || key === 'description') {
                    fieldsToUpdate[key] = fieldValues[key] || '';
                }
                // Lógica para Status
                if (key === 'status') {
                    const statusValue = fieldValues.status?.value;
                    if (statusValue) {
                        fieldsToUpdate.status = statusValue;
                        if (statusValue === 'lost') {
                            const reasonId = fieldValues.status?.reasonId;
                            if (!reasonId) {
                                setApiUpdateError('Ao marcar o status como "Perdido", um motivo é obrigatório.');
                                return;
                            }
                            fieldsToUpdate.reason = reasonId; // Nome do campo na API para motivo
                        }
                    }
                }
                // Lógica para Tags
                if (key === 'tags') {
                    const tagsData = fieldValues.tags;
                    if (tagsData && tagsData.operation) {
                        tagsOperation = {
                            operation: tagsData.operation,
                            tagIds: tagsData.tagIds || []
                        };
                    }
                }
            }
        });

        if (Object.keys(fieldsToUpdate).length === 0 && !tagsOperation) {
            setApiUpdateError('Por favor, selecione e preencha pelo menos um campo para atualizar.');
            return;
        }

        if (updateMethod === 'manual') {
            const ids = cardIds.split(/[\n,]+/).filter(id => id.trim() !== '');
            if (ids.length === 0) {
                setApiUpdateError('Por favor, insira pelo menos um ID de cartão.');
                return;
            }
            payload = { method: 'manual', cardIds: ids, fieldsToUpdate, tagsOperation };
        } else { // 'board'
            payload = { method: 'board', boardId: selectedBoardId, stageId: selectedStageId, fieldsToUpdate, tagsOperation };
        }

        setApiUpdateIsLoading(true);
        setApiUpdateError('');
        setApiUpdateResults({ summary: '', log: [] });

        try {
            const response = await fetch('/api/update-cards', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN || 'sua-senha-secreta-aqui'}`
                },
                body: JSON.stringify(payload),
            });

            // Verifica se a resposta tem conteúdo antes de tentar parsear como JSON
            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Resposta vazia do servidor');
            }

            let results;
            try {
                results = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Erro ao parsear resposta do servidor: ${parseError.message}. Conteúdo: ${responseText}`);
            }

            if (!response.ok) throw new Error(results.message || 'Ocorreu um erro no servidor.');
            setApiUpdateResults(results);
        } catch (error) {
            setApiUpdateError(error.message);
        } finally {
            setApiUpdateIsLoading(false);
        }
    };



    // --- Lógica da Verificação de Banco ---
    const onDbCheckFileDrop = useCallback((files) => handleFileDrop(files, setDbCheckFile, setDbCheckXlsData, setDbCheckError), []);
    const handleDbCheckAnalyze = async () => {
        if (!dbCheckFile || dbCheckXlsData.length === 0) {
            setDbCheckError("Por favor, carregue a planilha de disparo.");
            return;
        }
        setDbCheckIsLoading(true);
        setDbCheckError('');
        try {
            const response = await fetch(`/api/customers?campanha=${encodeURIComponent(campaignName.trim())}`);

            // Verifica se a resposta tem conteúdo antes de tentar parsear como JSON
            const responseText = await response.text();
            if (!responseText) {
                throw new Error("Resposta vazia do servidor. Verifique se o backend está em execução e se as credenciais do MongoDB estão configuradas corretamente.");
            }

            let dbRecords;
            try {
                dbRecords = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}. Verifique se o backend está funcionando corretamente.`);
            }

            if (!response.ok) {
                const errorMessage = dbRecords.message || 'Erro desconhecido no servidor.';
                throw new Error(`Erro na API (${response.status}): ${errorMessage}`);
            }

            const dbComparisonValues = new Set(dbRecords.map(r => String(r[comparisonKey])));
            const xlsColumnName = comparisonKey === 'telefone' ? 'Telefone' : 'Sequencia';
            const sent = dbCheckXlsData.filter(row => dbComparisonValues.has(String(row[xlsColumnName])));
            const notSent = dbCheckXlsData.filter(row => !dbComparisonValues.has(String(row[xlsColumnName])));
            setSentCustomers(sent);
            setNotSentCustomers(notSent);
            setDbCheckStep(2);
        } catch (error) {
            console.error("Erro na análise do banco de dados:", error);
            let userFriendlyMessage = error.message;

            // Melhorar mensagens de erro comuns
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                userFriendlyMessage = "Não foi possível conectar ao servidor. Verifique se o backend está em execução.";
            } else if (error.message.includes('ECONNRESET')) {
                userFriendlyMessage = "Conexão interrompida com o servidor. Tente novamente ou verifique sua conexão com a internet.";
            } else if (error.message.includes('Resposta vazia')) {
                userFriendlyMessage = "O servidor não retornou dados. Verifique se o backend está funcionando e se as credenciais do MongoDB estão corretas.";
            } else if (error.message.includes('API (500)')) {
                userFriendlyMessage = "Erro interno no servidor. Verifique se o MongoDB está acessível e se as credenciais estão corretas.";
            }

            setDbCheckError(userFriendlyMessage);
        } finally {
            setDbCheckIsLoading(false);
        }
    };
    const handleDbCheckExport = () => {
        const xlsColumnName = comparisonKey === 'telefone' ? 'Telefone' : 'Sequencia';
        const dataToExport = notSentCustomers.filter(c => selectedToExport.has(String(c[xlsColumnName])));
        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "NaoEnviados");
        writeFile(workbook, "Clientes_para_reenvio_check-Hablla_db.xlsx");
    };
    const handleSelectCustomer = (customerIdentifier, isChecked) => {
        const newSet = new Set(selectedToExport);
        const xlsColumnName = comparisonKey === 'telefone' ? 'Telefone' : 'Sequencia';
        const key = String(customerIdentifier[xlsColumnName]);
        if (isChecked) newSet.add(key);
        else newSet.delete(key);
        setSelectedToExport(newSet);
    };

    // --- Lógica da Correção de Planilhas ---
    const onDispatchFileDrop = useCallback((files) => handleFileDrop(files, setDispatchFile, setDispatchData, setSheetCorrectionError), []);
    const onCardsFileDrop = useCallback((files) => handleFileDrop(files, setCardsFile, setCardsData, setSheetCorrectionError), []);
    const handleSheetCorrectionProcess = () => {
        if (!dispatchFile || !cardsFile) {
            setSheetCorrectionError("Por favor, carregue as duas planilhas.");
            return;
        }
        setSheetCorrectionIsLoading(true);
        setSheetCorrectionError('');
        setTimeout(() => {
            try {
                const dispatchMap = new Map(dispatchData.map(row => [String(row['Telefone']).replace(/\D/g, ''), row['Campanha']]));
                const updatedRowsLog = [];
                const finalSheet = cardsData.map(cardRow => {
                    const campaign = cardRow['Campanha'];
                    if (!campaign || String(campaign).trim() === '' || String(campaign).trim() === '-') {
                        const phone = String(cardRow['Pessoa - Telefone']).replace(/\D/g, '');
                        if (dispatchMap.has(phone)) {
                            const newCampaign = dispatchMap.get(phone);
                            const updatedCardRow = { ...cardRow, Campanha: newCampaign };
                            updatedRowsLog.push(updatedCardRow);
                            return updatedCardRow;
                        }
                    }
                    return cardRow;
                });
                setUpdatedRows(updatedRowsLog);
                setFinalSheetData(finalSheet);
                setSheetCorrectionStep(2);
            } catch (error) {
                console.error("Erro no processamento da correção da planilha:", error);
                setSheetCorrectionError("Ocorreu um erro. Verifique se os nomes das colunas ('Telefone', 'Campanha', 'Pessoa - Telefone') estão corretos.");
            } finally {
                setSheetCorrectionIsLoading(false);
            }
        }, 500);
    };
    const handleSheetCorrectionExport = () => {
        const worksheet = utils.json_to_sheet(finalSheetData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "CartoesAtualizados");
        writeFile(workbook, "planilha_cartoes_atualizada.xlsx");
    };

    const handleUpdateCardOwners = () => {
        setIsLoginModalOpen(true);
    };

    const handleLoginSubmit = async (email, password) => {
        setCardOwnerUpdateIsLoading(true);
        setCardOwnerUpdateError('');
        try {
            const { accessToken } = await getHabllaUserToken(email, password);
            setHabllaUserToken(accessToken);
            setIsLoginModalOpen(false);
            await executeOwnerUpdate(accessToken);
        } catch (error) {
            setCardOwnerUpdateError(`Falha na autenticação: ${error.message}`);
            setCardOwnerUpdateIsLoading(false);
        }
    };

    // Função para atualizar o dono dos cartões conforme a documentação atualizada
    const executeOwnerUpdate = async (userToken) => {
        setHasStartedOwnerUpdate(true);
        setCardOwnerUpdateIsLoading(true);
        setCardOwnerUpdateError('');
        setCardOwnerUpdateResults({ summary: 'Iniciando processo...', log: [], noCards: [], multipleCards: [], skipped: [], missingOwner: [] });

        try {
            setCardOwnerUpdateResults(prev => ({ ...prev, summary: 'Buscando atendimentos do setor selecionado...' }));
            const allServices = await getAllServices(selectedSectorForOwnerUpdate);

            if (!allServices || allServices.length === 0) {
                setCardOwnerUpdateResults({
                    summary: 'Nenhum atendimento encontrado para o setor selecionado.',
                    log: [],
                    noCards: [],
                    multipleCards: [],
                    skipped: [],
                    missingOwner: []
                });
                return;
            }

            const noCards = [];
            const multipleCards = [];
            const missingOwner = [];
            const skipped = [];
            const cardsToUpdate = [];

            for (const service of allServices) {
                const ownerId = service.user_id || service.user || (service.user && service.user.id) || service.owner || null;
                if (!ownerId) {
                    missingOwner.push({ attendanceId: service.id, attendanceName: service.name });
                    continue;
                }

                const cards = Array.isArray(service.cards) ? service.cards : [];
                if (cards.length === 0) {
                    noCards.push({ attendanceId: service.id, attendanceName: service.name, ownerId });
                    continue;
                }
                if (cards.length > 1) {
                    multipleCards.push({ attendanceId: service.id, attendanceName: service.name, cardIds: cards, ownerId });
                }

                for (const cardId of cards) {
                    try {
                        const cardDetails = await getCardDetails(cardId);
                        const boardId = cardDetails.board_id || cardDetails.board;
                        const stageId = cardDetails.list_id || cardDetails.list;
                        const status = cardDetails.status;
                        const currentOwner = cardDetails.user || cardDetails.user_id || cardDetails.owner || null;

                        if (boardId !== selectedBoardForOwnerUpdate || stageId !== selectedStageForOwnerUpdate) {
                            continue;
                        }
                        if (status !== 'in_attendance') {
                            skipped.push({ cardId, reason: 'Status diferente de "in_attendance"', currentOwner, serviceName: service.name });
                            continue;
                        }
                        if (onlyWithoutOwner && currentOwner) {
                            skipped.push({ cardId, reason: 'Cartão já possui dono', currentOwner, serviceName: service.name });
                            continue;
                        }
                        if (!onlyWithoutOwner && currentOwner && currentOwner === ownerId) {
                            skipped.push({ cardId, reason: 'Cartão já está com o dono correto', currentOwner, serviceName: service.name });
                            continue;
                        }

                        cardsToUpdate.push({ cardId, ownerId, currentOwner, serviceName: service.name });
                    } catch (error) {
                        console.error(`Erro ao buscar detalhes do cartão ${cardId}:`, error);
                        skipped.push({ cardId, reason: `Falha ao obter detalhes: ${error.message}`, serviceName: service.name });
                    }
                    await sleep(250);
                }
            }

            if (cardsToUpdate.length === 0) {
                setCardOwnerUpdateResults({
                    summary: 'Nenhum cartão elegível para atualização encontrado com os filtros atuais.',
                    log: [],
                    noCards,
                    multipleCards,
                    skipped,
                    missingOwner
                });
                return;
            }

            const log = [];
            let updatedCount = 0;

            for (const card of cardsToUpdate) {
                try {
                    await updateCardOwner(card.cardId, card.ownerId, userToken);
                    log.push({
                        cardId: card.cardId,
                        status: 'success',
                        message: `Dono atualizado para ${card.ownerId} (atendimento: ${card.serviceName})`
                    });
                    updatedCount++;
                } catch (error) {
                    log.push({
                        cardId: card.cardId,
                        status: 'error',
                        message: `Falha ao atualizar dono: ${error.message}`
                    });
                }
                await sleep(300);
            }

            const errorsCount = log.filter(item => item.status === 'error').length;
            const summaryParts = [];
            summaryParts.push(`${updatedCount}/${cardsToUpdate.length} cartões atualizados`);
            if (errorsCount > 0) summaryParts.push(`${errorsCount} com erro`);
            if (skipped.length > 0) summaryParts.push(`${skipped.length} ignorados`);

            setCardOwnerUpdateResults({
                summary: `Processo finalizado: ${summaryParts.join(', ')}.`,
                log,
                noCards,
                multipleCards,
                skipped,
                missingOwner
            });
        } catch (error) {
            console.error('Erro no processo de atualização de donos:', error);
            setCardOwnerUpdateError(error.message);
        } finally {
            setCardOwnerUpdateIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center transition-colors duration-300">
            <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Ferramenta de Apoio Hablla</h1>
                        <p className="mt-2 text-gray-600 dark:text-violet-500">Utilitários para verificação, correção e atualização de dados.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.displayName || currentUser?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
                        </div>
                        <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" title="Sair">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-1 sm:space-x-4 p-2 sm:p-4" aria-label="Tabs">
                        {/*Botão de Verificação (Banco) */}
                        <button onClick={() => setActiveTool('databaseCheck')}
                            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md 
                            ${activeTool === 'databaseCheck' ?
                                    'bg-blue-100 text-blue-700 dark:bg-violet-900/50 dark:text-violet-300' :
                                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}>
                            <Database size={16} className="mr-2" /> Verificação (Banco)
                        </button>

                        {/*Botão de Correção de Cartões (Planilha) */}
                        <button onClick={() => setActiveTool('sheetCorrection')}
                            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md 
                            ${activeTool === 'sheetCorrection' ?
                                    'bg-blue-100 text-blue-700 dark:bg-violet-900/50 dark:text-violet-300' :
                                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}>
                            <RefreshCw size={16} className="mr-2" />Correção de Cartões (Planilha)
                        </button>

                        {/*Botão de Atualização de Cartões (API) */}
                        <button onClick={() => setActiveTool('apiUpdate')}
                            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md 
                            ${activeTool === 'apiUpdate' ?
                                    'bg-blue-100 text-blue-700 dark:bg-violet-900/50 dark:text-violet-300' :
                                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}>
                            <Send size={16} className="mr-2" /> Atualização de Cartões (API)
                        </button>

                        {/*Botão de Gerenciar Seguidores */}
                        <button onClick={() => setActiveTool('followerManagement')}
                            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md 
                                ${activeTool === 'followerManagement' ?
                                    'bg-blue-100 text-blue-700 dark:bg-violet-900/50 dark:text-violet-300' :
                                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}>
                            <Users size={16} className="mr-2" /> Gerenciar Seguidores
                        </button>

                        {/*Botão de Atualizar Dono Cartão */}
                        <button onClick={() => setActiveTool('updateCardOwner')}
                            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md 
                                ${activeTool === 'updateCardOwner' ?
                                    'bg-blue-100 text-blue-700 dark:bg-violet-900/50 dark:text-violet-300' :
                                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}>
                            <Users size={16} className="mr-2" /> Atualizar Dono Cartão
                        </button>

                    </nav>
                </div>

                {/* Ferramenta de Verificação de Banco */}
                {activeTool === 'databaseCheck' && (
                    <div className="p-6 sm:p-8">
                        {dbCheckStep === 1 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <FileUploader onDrop={onDbCheckFileDrop} file={dbCheckFile}
                                        title="1. Planilha de Disparo" />
                                    <div>
                                        <label
                                            htmlFor="campaignName"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            2. Nome da Campanha no Banco
                                        </label>
                                        <input
                                            type="text"
                                            id="campaignName"
                                            value={campaignName}
                                            placeholder="Ex: HB ANIV LOJAS..."
                                            onChange={(e) => setCampaignName(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <h3
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            3. Chave de Comparação
                                        </h3>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    name="comparisonKey"
                                                    value="telefone"
                                                    checked={comparisonKey === 'telefone'}
                                                    onChange={(e) => setComparisonKey(e.target.value)}
                                                    className="form-radio" />
                                                <span>Telefone</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    name="comparisonKey"
                                                    value="idSankhya"
                                                    checked={comparisonKey === 'idSankhya'}
                                                    onChange={(e) => setComparisonKey(e.target.value)}
                                                    className="form-radio" />
                                                <span>Sequência Sankhya</span>
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDbCheckAnalyze}
                                        disabled={!dbCheckFile || dbCheckIsLoading}
                                        className="w-full flex items-center justify-center bg-violet-800 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:opacity-50">
                                        {dbCheckIsLoading ? <><Loader2 className="animate-spin mr-2" />
                                            Analisando...</> : <>Analisar
                                            <ChevronsRight className="ml-2" /></>}
                                    </button>

                                    {dbCheckError && <p className="text-red-500 mt-2">{dbCheckError}</p>}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Instruções</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Esta ferramenta compara sua planilha com os registros do banco de dados para encontrar clientes que não receberam a mensagem.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Clientes que fizemos disparo ({sentCustomers.length})</h2>
                                    </div>
                                    <div className="h-96 overflow-y-auto border rounded-lg scrollbar
                                    scrollbar-thumb-gray-500/75 scrollbar-track-gray-300/50
                                    dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-900/50
                                    border-gray-200 dark:border-gray-700">
                                        {/* <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"> */}
                                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 w-2/3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                                    <th className="px-6 py-3 w-1/3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonKey === 'telefone' ? 'Telefone' : 'Seq. Sankhya'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {sentCustomers.map((customer, index) => {
                                                    // A planilha pode ter colunas com nomes variados, vamos tentar acessar de forma mais robusta
                                                    const name = customer.Nome || customer.nome || customer['Nome Completo'] || customer['Name'] || '-';
                                                    const identifier = comparisonKey === 'telefone' ? (customer.Telefone || customer.telefone || '-') : (customer.Sequencia || customer.idSankhya || '-');
                                                    return (
                                                        <tr key={index}>
                                                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-900 dark:text-white">{name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{identifier}</td> */}
                                                            <td className="px-6 py-4 break-words text-sm  text-gray-900 dark:text-white">{name}</td>
                                                            <td className="px-6 py-4 break-words text-sm text-gray-500 dark:text-gray-400">{identifier}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {sentCustomers.length === 0 && <p className="text-center p-8 text-gray-500">Nenhum cliente encontrado no banco.</p>}
                                    </div>
                                    <div className="flex items-center mt-6">
                                        <button
                                            onClick={() => setDbCheckStep(1)}
                                            className="font-medium h-8 px-3 rounded-lg flex-1 text-base
                                            bg-blue-200 hover:bg-blue-300 text-blue-600
                                            dark:text-blue-100 dark:hover:text-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700">
                                            Fazer nova verificação
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white ">Clientes que NÃO fizemos disparo ({notSentCustomers.length})</h2>
                                        <div className="flex space-x-2">

                                        </div>
                                    </div>
                                    <div className="h-96 overflow-y-auto border rounded-lg scrollbar
                                    scrollbar-thumb-gray-500/75 scrollbar-track-gray-300/50
                                    dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-900/50
                                    border-gray-200 dark:border-gray-700 ">
                                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 w-1/12 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sel</th>
                                                    <th className="px-6 py-3 w-2/5 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                                    <th className="px-6 py-3 w-1/4 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{comparisonKey === 'telefone' ? 'Telefone' : 'ID'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {notSentCustomers.map((customer, index) => {
                                                    // A planilha pode ter colunas com nomes variados, vamos tentar acessar de forma mais robusta
                                                    const name = customer.Nome || customer.nome || customer['Nome Completo'] || customer['Name'] || '-';
                                                    const identifier = comparisonKey === 'telefone' ? (customer.Telefone || customer.telefone || '-') : (customer.Sequencia || customer.idSankhya || '-');
                                                    return (
                                                        <tr key={index} className={selectedToExport.has(String(identifier)) ? 'bg-blue-100/60 dark:bg-violet-900/15' : ''}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedToExport.has(String(identifier))}
                                                                    onChange={(e) => handleSelectCustomer(customer, e.target.checked)}
                                                                    className="form-checkbox h-4 w-4 rounded checked:bg-blue-500 checked:dark:bg-violet-500" />
                                                            </td>
                                                            <td className="px-6 py-4 break-words text-sm text-gray-900 dark:text-white">{name}</td>
                                                            <td className="px-6 py-4 break-words text-sm text-gray-500 dark:text-gray-400">{identifier}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {notSentCustomers.length === 0 && <p className="text-center p-8 text-gray-500">
                                            Todos os clientes foram encontrados no banco.</p>}
                                    </div>
                                    <div className="justify-between items-center mt-6 flex">
                                        <button
                                            // onClick={() => {
                                            //     const newSet = new Set(selectedToExport);
                                            //     notSentCustomers.forEach(customer => {
                                            //         const identifier = comparisonKey === 'telefone' ? customer.Telefone : customer.Sequencia;
                                            //         if (identifier) newSet.add(String(identifier));
                                            //     });
                                            //     setSelectedToExport(newSet);
                                            // }}
                                            onClick={handleToggleSelectAll}
                                            disabled={notSentCustomers.length === 0}
                                            className="text-base font-medium h-8 px-4 rounded-lg
                                                bg-blue-200 hover:bg-blue-300 text-blue-600
                                                dark:bg-violet-900 dark:hover:bg-violet-800 dark:text-violet-100
                                                disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-800 disabled:hover:bg-gray-300dark:disabled:bg-gray-200 dark:disabled:text-gray-800 dark:disabled:hover:bg-gray-300">
                                            {areAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                            {/* Selecionar Todos */}
                                        </button>
                                        <button
                                            onClick={handleDbCheckExport}
                                            disabled={selectedToExport.size === 0}
                                            className="flex items-center justify-center font-medium h-8 px-4 rounded-lg text-base
                                            bg-green-600 hover:bg-green-700 text-white 
                                            disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-800 disabled:font-medium disabled:hover:bg-gray-300">
                                            <Download size={16} className="mr-1" /> Exportar ({selectedToExport.size})
                                        </button>
                                    </div>
                                    <div className='text-center mt-6'>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Ferramenta de Correção de Planilhas */}
                {activeTool === 'sheetCorrection' && (
                    <div className="p-6 sm:p-8">
                        {sheetCorrectionStep === 1 ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FileUploader onDrop={onDispatchFileDrop} file={dispatchFile} title="1. Planilha do Disparo (Arquivo Fonte)" />
                                    <FileUploader onDrop={onCardsFileDrop} file={cardsFile} title="2. Planilha dos Cartões (Para Atualizar)" />
                                </div>
                                <div className="text-center">
                                    <button onClick={handleSheetCorrectionProcess} disabled={!dispatchFile || !cardsFile || sheetCorrectionIsLoading}
                                        className="w-full md:w-[calc(50%-15px)] flex items-center justify-center bg-violet-800 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-700 disabled:text-gray-400 disabled:opacity-50">
                                        {sheetCorrectionIsLoading ? <><Loader2 className="animate-spin mr-2" />Processando...</> : <>Processar e Atualizar Planilhas <ChevronsRight className="ml-2" /></>}
                                    </button>
                                </div>
                                {sheetCorrectionError && <div className="mt-4 text-center text-red-500">{sheetCorrectionError}</div>}
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resultado da Correção</h2>
                                    <button onClick={handleSheetCorrectionExport} disabled={finalSheetData.length === 0} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"><Download className="mr-2" /> Baixar Planilha Atualizada</button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{updatedRows.length} cartões tiveram a campanha preenchida. Abaixo estão as linhas que foram alteradas:</p>
                                <div className="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome (Pessoa)</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campanha (Atualizada)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {updatedRows.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row['Pessoa - Nome']}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Pessoa - Telefone']}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">{row['Campanha']}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {updatedRows.length === 0 && <p className="text-center p-8 text-gray-500">Nenhuma linha precisou de atualização.</p>}
                                </div>
                                <div className="text-center mt-6"><button onClick={() => setSheetCorrectionStep(1)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">Fazer nova correção</button></div>
                            </div>
                        )}
                    </div>
                )}


                {/* Ferramenta de Atualização via API */}
                {/* {activeTool === 'apiUpdate' && (
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Como deseja selecionar os cartões?</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2"><input type="radio" name="updateMethod" value="manual" checked={updateMethod === 'manual'} onChange={() => setUpdateMethod('manual')} className="form-radio"/><span>Inserir IDs Manualmente</span></label>
                                        <label className="flex items-center space-x-2"><input type="radio" name="updateMethod" value="board" checked={updateMethod === 'board'} onChange={() => setUpdateMethod('board')} className="form-radio"/><span>Selecionar Quadro/Coluna</span></label>
                                    </div>
                                </div>
                                
                                {updateMethod === 'manual' ? (
                                    <div>
                                        <label htmlFor="cardIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. IDs dos Cartões</label>
                                        <textarea id="cardIds" value={cardIds} onChange={(e) => setCardIds(e.target.value)} rows="8" className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Cole os IDs aqui, um por linha ou separados por vírgula."></textarea>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="boardSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Selecione o Quadro</label>
                                            <select id="boardSelect" value={selectedBoardId} onChange={e => { setSelectedBoardId(e.target.value); setSelectedStageId(BOARDS[e.target.value].stages[0].id); }} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                                {Object.keys(BOARDS).map(boardId => <option key={boardId} value={boardId}>{BOARDS[boardId].name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="stageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. Selecione a Coluna</label>
                                            <select id="stageSelect" value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                                {BOARDS[selectedBoardId].stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Último Passo: Campos para Atualizar</h3>
                                    <div className="space-y-4">
                                        {AVAILABLE_FIELDS.map(field => (
                                            <div key={field.id}>
                                                <label className="flex items-center space-x-3">
                                                    <input type="checkbox" checked={!!selectedFields[field.id]} onChange={() => handleFieldToggle(field.id)} className="form-checkbox h-5 w-5 text-blue-600 rounded" />
                                                    <span className="text-gray-700 dark:text-gray-300">{field.label}</span>
                                                </label>
                                                {selectedFields[field.id] && (
                                                    field.type === 'textarea' ?
                                                    <textarea value={fieldValues[field.id] || ''} onChange={(e) => handleValueChange(field.id, e.target.value)} rows="3" className="mt-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder={`Novo valor para ${field.label}...`}></textarea> :
                                                    <input type={field.type} value={fieldValues[field.id] || ''} onChange={(e) => handleValueChange(field.id, e.target.value)} className="mt-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder={`Novo valor para ${field.label}...`}/>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleApiUpdate} disabled={apiUpdateIsLoading} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400">
                                    {apiUpdateIsLoading ? <><Loader2 className="animate-spin mr-2"/>Atualizando...</> : <>Atualizar Cartões via API <Send className="ml-2"/></>}
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resultados da Atualização</h3>
                                {apiUpdateError && <p className="text-red-500 mb-4">{apiUpdateError}</p>}
                                {apiUpdateResults.summary && <p className="text-gray-600 dark:text-gray-300 mb-4">{apiUpdateResults.summary}</p>}
                                <div className="h-96 overflow-y-auto space-y-2 pr-2">
                                    {apiUpdateResults.log && apiUpdateResults.log.length === 0 && !apiUpdateIsLoading && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Os resultados aparecerão aqui.</p>}
                                    {apiUpdateIsLoading && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Processando requisições...</p>}
                                    {apiUpdateResults.log && apiUpdateResults.log.map((result, index) => (
                                        <div key={index} className={`p-3 rounded-md text-sm ${result.status === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                                            <strong>ID: {result.cardId}</strong> - {result.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )} */}


                {/* Ferramenta de Atualização via API */}
                {activeTool === 'apiUpdate' && (
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2
                                    text-gray-700 dark:text-gray-300">
                                        1. Como deseja selecionar os cartões?</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="updateMethod"
                                                value="manual"
                                                checked={updateMethod === 'manual'}
                                                onChange={() => setUpdateMethod('manual')}
                                                className="form-radio checked:bg-blue-600 checked:dark:bg-violet-600
                                                focus:ring-transparent dark:ring-offset-0"/>
                                            <span>Inserir IDs Manualmente</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="updateMethod"
                                                value="board"
                                                checked={updateMethod === 'board'}
                                                onChange={() => setUpdateMethod('board')}
                                                className="form-radio checked:bg-blue-600 checked:dark:bg-violet-600
                                                focus:ring-transparent dark:ring-offset-0"/>
                                            <span>Selecionar Quadro/Coluna</span>
                                        </label>
                                    </div>
                                </div>

                                {updateMethod === 'manual' ? (
                                    <div>
                                        <label htmlFor="cardIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. IDs dos Cartões Hablla</label>
                                        <textarea id="cardIds" value={cardIds} onChange={(e) => setCardIds(e.target.value)} rows="8" className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Cole os IDs aqui, um por linha ou separados por vírgula."></textarea>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="boardSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Selecione o Quadro</label>
                                            <select id="boardSelect" value={selectedBoardId} onChange={e => { setSelectedBoardId(e.target.value); setSelectedStageId(BOARDS[e.target.value].stages[0].id); }} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                                {Object.keys(BOARDS).map(boardId => <option key={boardId} value={boardId}>{BOARDS[boardId].name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="stageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. Selecione a Coluna</label>
                                            <select id="stageSelect" value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                                {BOARDS[selectedBoardId].stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Último Passo: Campos para Atualizar</h3>
                                    <div className="space-y-4">
                                        {AVAILABLE_FIELDS.map(field => (
                                            <div key={field.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <label className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selectedFields[field.id]}
                                                        onChange={() => handleFieldToggle(field.id)}
                                                        className="form-checkbox h-5 w-5 rounded checked:bg-blue-500 checked:dark:bg-violet-500"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                        {field.label}
                                                    </span>
                                                </label>

                                                {selectedFields[field.id] && (
                                                    <div className="mt-3 pl-8 space-y-3">
                                                        {(field.type === 'text' || field.type === 'textarea') && (
                                                            field.type === 'textarea' ?
                                                                <textarea
                                                                    value={fieldValues[field.id] || ''}
                                                                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                                                                    rows="3"
                                                                    className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md"
                                                                    placeholder={`Novo valor para ${field.label}...`}>
                                                                </textarea> :
                                                                <input
                                                                    type={field.type}
                                                                    value={fieldValues[field.id] || ''}
                                                                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                                                                    className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md"
                                                                    placeholder={`Novo valor para ${field.label}...`}
                                                                />
                                                        )}

                                                        {field.type === 'status_select' && (
                                                            <>
                                                                <select value={fieldValues.status?.value || ''} onChange={(e) => handleValueChange('status', { ...fieldValues.status, value: e.target.value })} className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md">
                                                                    <option value="">Selecione um status...</option>
                                                                    {STATUS_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                                                </select>
                                                                {fieldValues.status?.value === 'lost' && (
                                                                    <select value={fieldValues.status?.reasonId || ''} onChange={(e) => handleValueChange('status', { ...fieldValues.status, reasonId: e.target.value })} className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md">
                                                                        <option value="">Selecione um motivo...</option>
                                                                        {LOST_REASONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                                                    </select>
                                                                )}
                                                            </>
                                                        )}

                                                        {field.type === 'tags_select' && (
                                                            <div className="space-y-3">
                                                                <select value={fieldValues.tags?.operation || ''} onChange={(e) => handleValueChange('tags', { ...fieldValues.tags, operation: e.target.value })} className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md">
                                                                    <option value="">Selecione uma operação...</option>
                                                                    <option value="add">Adicionar</option>
                                                                    <option value="remove">Remover</option>
                                                                    <option value="replace">Substituir Tudo</option>
                                                                </select>

                                                                {(fieldValues.tags?.operation) && (
                                                                    <div className="p-2 border rounded-md max-h-32 overflow-y-auto">
                                                                        <p className="text-xs mb-2">{fieldValues.tags.operation === 'replace' ? 'Selecione as novas tags (ou nenhuma para limpar):' : 'Selecione as tags:'}</p>
                                                                        {TAGS.map(tag => (
                                                                            <label key={tag.id} className="flex items-center space-x-2 text-sm">
                                                                                <input type="checkbox"
                                                                                    checked={fieldValues.tags?.tagIds?.includes(tag.id) || false}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = fieldValues.tags?.tagIds || [];
                                                                                        const newIds = e.target.checked ? [...currentIds, tag.id] : currentIds.filter(id => id !== tag.id);
                                                                                        handleValueChange('tags', { ...fieldValues.tags, tagIds: newIds });
                                                                                    }}
                                                                                    className="form-checkbox"
                                                                                />
                                                                                <span>{tag.name}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleApiUpdate} disabled={apiUpdateIsLoading} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400">
                                    {apiUpdateIsLoading ? <><Loader2 className="animate-spin mr-2" />Atualizando...</> : <>Atualizar Cartões via API <Send className="ml-2" /></>}
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resultados da Atualização</h3>
                                {apiUpdateError && <p className="text-red-500 mb-4">{apiUpdateError}</p>}
                                {apiUpdateResults.summary && <p className="text-gray-600 dark:text-gray-300 mb-4">{apiUpdateResults.summary}</p>}
                                <div className="h-96 overflow-y-auto space-y-2 pr-2">
                                    {apiUpdateResults.log && apiUpdateResults.log.length === 0 && !apiUpdateIsLoading && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Os resultados aparecerão aqui.</p>}
                                    {apiUpdateIsLoading && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Processando requisições...</p>}
                                    {apiUpdateResults.log && apiUpdateResults.log.map((result, index) => (
                                        <div key={index} className={`p-3 rounded-md text-sm ${result.status === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                                            <p><strong>ID: {result.cardId}</strong></p>
                                            <ul className="list-disc list-inside mt-1">
                                                {result.messages.map((msg, i) => <li key={i}>{msg}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}




                {/* Ferramenta de Gerenciamento de Seguidores */}
                {activeTool === 'followerManagement' && (
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="searchUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Buscar atendimentos do usuário:</label>
                                    <select id="searchUser" value={searchUserId} onChange={(e) => setSearchUserId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {HABLLA_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="userToRemove" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Remover o seguidor:</label>
                                    <select id="userToRemove" value={userToRemoveId} onChange={(e) => setUserToRemoveId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {HABLLA_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="userToAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. Adicionar o seguidor:</label>
                                    <select id="userToAdd" value={userToAddId} onChange={(e) => setUserToAddId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {HABLLA_USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleManageFollowers} disabled={followerMgmtIsLoading}
                                    className="w-full flex items-center justify-center  bg-violet-800 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400">
                                    {followerMgmtIsLoading ? <><Loader2 className="animate-spin mr-2" />Processando...</> : <>Iniciar Troca de Seguidores <RefreshCw className="ml-2" /></>}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Log de Operações</h3>
                                {followerMgmtError && <p className="text-red-500 mb-4">{followerMgmtError}</p>}
                                {followerMgmtResults.summary && <p className="text-gray-600 dark:text-gray-300 mb-4">{followerMgmtResults.summary}</p>}
                                <div className="h-96 overflow-y-auto space-y-2 pr-2">
                                    {followerMgmtResults.log.length === 0 && !followerMgmtIsLoading && !followerMgmtError && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Os resultados aparecerão aqui.</p>}
                                    {followerMgmtIsLoading && <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Buscando atendimentos e processando...</p>}
                                    {followerMgmtResults.log.map((result, index) => (
                                        <div key={index} className="p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Atendimento: {result.serviceName} </p>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">ID: {result.attendanceId}</p>
                                            <ul className="mt-2 space-y-1 text-xs">
                                                {result.steps.map((step, stepIndex) => (
                                                    <li key={stepIndex} className={`flex items-center ${step.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                        {step.action}: {step.status === 'success' ? 'Sucesso' : `Falha - ${step.message}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ferramenta de Atualizar Dono Cartão */}
                {activeTool === 'updateCardOwner' && (
                    <div className="p-6 sm:p-8">
                        <LoginModal
                            isOpen={isLoginModalOpen}
                            onClose={() => setIsLoginModalOpen(false)}
                            onSubmit={handleLoginSubmit}
                            isLoading={cardOwnerUpdateIsLoading}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                {!hasStartedOwnerUpdate && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Sobre esta ferramenta</h3>
                                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                                            A ferramenta cruza os atendimentos em andamento do setor selecionado com os cartões do quadro/coluna escolhidos,
                                            garantindo que o dono do cartão seja o mesmo do atendimento correspondente.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="sectorSelectOwnerUpdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Selecione o Setor</label>
                                    <select
                                        id="sectorSelectOwnerUpdate"
                                        value={selectedSectorForOwnerUpdate}
                                        onChange={(e) => setSelectedSectorForOwnerUpdate(e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        disabled={cardOwnerUpdateIsLoading}
                                    >
                                        {HABLLA_SECTORS.map(sector => (
                                            <option key={sector.id} value={sector.id}>{sector.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="boardSelectOwnerUpdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Selecione o Quadro</label>
                                    <select
                                        id="boardSelectOwnerUpdate"
                                        value={selectedBoardForOwnerUpdate}
                                        onChange={(e) => {
                                            const newBoardId = e.target.value;
                                            setSelectedBoardForOwnerUpdate(newBoardId);
                                            const firstStage = BOARDS[newBoardId].stages[0]?.id || '';
                                            setSelectedStageForOwnerUpdate(firstStage);
                                        }}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        disabled={cardOwnerUpdateIsLoading}
                                    >
                                        {Object.keys(BOARDS).map(boardId => (
                                            <option key={boardId} value={boardId}>{BOARDS[boardId].name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="stageSelectOwnerUpdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. Selecione a Coluna</label>
                                    <select
                                        id="stageSelectOwnerUpdate"
                                        value={selectedStageForOwnerUpdate}
                                        onChange={(e) => setSelectedStageForOwnerUpdate(e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        disabled={cardOwnerUpdateIsLoading}
                                    >
                                        {BOARDS[selectedBoardForOwnerUpdate].stages.map(stage => (
                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <input
                                        id="onlyWithoutOwner"
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        checked={onlyWithoutOwner}
                                        onChange={(e) => setOnlyWithoutOwner(e.target.checked)}
                                        disabled={cardOwnerUpdateIsLoading}
                                    />
                                    <div>
                                        <label htmlFor="onlyWithoutOwner" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Atualizar apenas cartões sem dono (recomendado)
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Desmarque para forçar a atualização de todos os cartões da coluna, mesmo os que já possuem dono.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpdateCardOwners}
                                    disabled={cardOwnerUpdateIsLoading}
                                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400"
                                >
                                    {cardOwnerUpdateIsLoading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" /> Processando...
                                        </>
                                    ) : (
                                        <>Atualizar Donos dos Cartões</>
                                    )}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resultados</h3>

                                {cardOwnerUpdateError && (
                                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-red-700 dark:text-red-300 text-sm">{cardOwnerUpdateError}</p>
                                    </div>
                                )}

                                {cardOwnerUpdateResults.summary && (
                                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{cardOwnerUpdateResults.summary}</p>
                                    </div>
                                )}

                                <div className="h-96 overflow-y-auto space-y-4 pr-2">
                                    {cardOwnerUpdateIsLoading && (
                                        <p className="text-gray-500 dark:text-gray-400 text-center pt-16">Buscando atendimentos e processando cartões...</p>
                                    )}

                                    {!cardOwnerUpdateIsLoading && !hasStartedOwnerUpdate && (
                                        <p className="text-gray-500 dark:text-gray-400 text-center pt-16">
                                            Configure as opções ao lado e clique em "Atualizar" para iniciar.
                                        </p>
                                    )}

                                    {cardOwnerUpdateResults.log.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Cartões atualizados ({cardOwnerUpdateResults.log.length}):</h4>
                                            <div className="space-y-2">
                                                {cardOwnerUpdateResults.log.map((result, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded-md text-sm border ${result.status === 'success'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                                                            }`}
                                                    >
                                                        <p><strong>ID: {result.cardId}</strong></p>
                                                        <p className="mt-1">{result.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cardOwnerUpdateResults.skipped && cardOwnerUpdateResults.skipped.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Cartões ignorados ({cardOwnerUpdateResults.skipped.length}):</h4>
                                            <div className="space-y-2">
                                                {cardOwnerUpdateResults.skipped.map((item, index) => (
                                                    <div key={index} className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
                                                        <p><strong>Cartão:</strong> {item.cardId}</p>
                                                        <p className="mt-1"><strong>Motivo:</strong> {item.reason}</p>
                                                        {item.currentOwner && <p className="mt-1 text-xs">Dono atual: {item.currentOwner}</p>}
                                                        {item.serviceName && <p className="mt-1 text-xs">Atendimento: {item.serviceName}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cardOwnerUpdateResults.missingOwner && cardOwnerUpdateResults.missingOwner.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Atendimentos sem dono definido ({cardOwnerUpdateResults.missingOwner.length}):</h4>
                                            <div className="space-y-2">
                                                {cardOwnerUpdateResults.missingOwner.map((item, index) => (
                                                    <div key={index} className="p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md text-sm">
                                                        <p><strong>Atendimento:</strong> {item.attendanceName} ({item.attendanceId})</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cardOwnerUpdateResults.noCards && cardOwnerUpdateResults.noCards.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Atendimentos sem cartões ({cardOwnerUpdateResults.noCards.length}):</h4>
                                            <div className="space-y-2">
                                                {cardOwnerUpdateResults.noCards.map((item, index) => (
                                                    <div key={index} className="p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                                                        <p><strong>Atendimento:</strong> {item.attendanceName} ({item.attendanceId})</p>
                                                        <p className="mt-1 text-xs">Dono do atendimento: {item.ownerId}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cardOwnerUpdateResults.multipleCards && cardOwnerUpdateResults.multipleCards.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Atendimentos com múltiplos cartões ({cardOwnerUpdateResults.multipleCards.length}):</h4>
                                            <div className="space-y-2">
                                                {cardOwnerUpdateResults.multipleCards.map((item, index) => (
                                                    <div key={index} className="p-3 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-md text-sm">
                                                        <p><strong>Atendimento:</strong> {item.attendanceName} ({item.attendanceId})</p>
                                                        <p className="mt-1 text-xs">Cartões: {item.cardIds.join(', ')}</p>
                                                        <p className="mt-1 text-xs">Dono do atendimento: {item.ownerId}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>        </div>
    );
}






