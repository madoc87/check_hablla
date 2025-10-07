# Backend - API de Verificação de Disparos

Este diretório contém o código da API RESTful responsável por se conectar ao banco de dados MongoDB e fornecer os dados dos clientes para o frontend.

## Scripts Disponíveis

No diretório do projeto, você pode executar:

### `npm install`

Instala todas as dependências necessárias para o servidor.

### `npm start`

Inicia o servidor em modo de produção. Por padrão, ele rodará em `http://localhost:3001`.

## Variáveis de Ambiente

Para que o servidor funcione, é obrigatório criar um arquivo `.env` na raiz desta pasta (`/backend`). Use o arquivo `.env.example` como um modelo.

As seguintes variáveis são necessárias:

* `MONGO_URI`: A string de conexão completa do seu banco de dados MongoDB.
* `DB_NAME`: O nome específico do banco de dados onde os dados da campanha estão armazenados.
* `PORT`: A porta em que o servidor será executado (o padrão é `3001`).
* `HABLLA_WORKSPACE_ID`: O ID do workspace na API do Hablla.
* `HABLLA_API_TOKEN`: O token de autorização para a API do Hablla.
* `API_SECRET_TOKEN`: Token secreto para autenticação das rotas sensíveis da API.

## Estrutura da API

### Endpoint Principal

* **`GET /api/customers`**

    Busca e retorna uma lista de clientes de uma campanha específica.

    **Query Parameters:**
    * `campanha` (obrigatório): O nome exato da campanha a ser consultada. Ex: `?campanha=HB%20ANIV%20LOJAS...`

    **Resposta de Sucesso (200 OK):**
    ```json
    [
      {
        "_id": "687929a9e03bb3e24d236fef",
        "nome": "MARIA CLIENTE TESTE",
        "telefone": "5561999999998",
        "idSankhya": "29870",
        "campanha": "HB ANIV LOJAS NÃO ATENDE 01.01 A 30.06.2025.04",
        "...": "..."
      }
    ]
    ```

    **Resposta de Erro (400 Bad Request):**
    ```json
    {
      "message": "O nome da campanha é obrigatório."
    }
    ```

### Endpoints Protegidos (Requerem autenticação)

* **`PUT /api/update-cards`**

    Atualiza cartões na API do Hablla.

    **Headers:**
    * `Authorization`: `Bearer seu-token-secreto-aqui`

* **`POST /api/manage-followers`**

    Gerencia seguidores na API do Hablla.

    **Headers:**
    * `Authorization`: `Bearer seu-token-secreto-aqui`

## Segurança

A API implementa as seguintes medidas de segurança:

* **Autenticação por token**: Endpoints sensíveis requerem um token de autorização no header.
* **Helmet**: Configura cabeçalhos HTTP para proteção contra vulnerabilidades conhecidas.
* **Rate Limiting**: Limita o número de requisições por IP para prevenir ataques de força bruta.
* **MongoDB Sanitization**: Previne ataques de injeção NoSQL.
* **XSS Protection**: Previne ataques de Cross-Site Scripting.
* **Parameter Pollution Protection**: Previne ataques de poluição de parâmetros.
* **Validação de entrada**: Todos os dados recebidos são validados e sanitizados.
* **Tratamento de erros**: Erros internos não são expostos diretamente ao cliente.