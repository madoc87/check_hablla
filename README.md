# Ferramenta de Verificação de Disparos Hablla

Este projeto é uma aplicação full-stack projetada para reconciliar listas de clientes de uma campanha de marketing com os registros de envio armazenados em um banco de dados MongoDB. A ferramenta permite identificar quais clientes não receberam a mensagem e exportar uma nova lista para um novo disparo.

A aplicação é construída como um **monorepo**, contendo duas partes principais:

* **/frontend**: Uma interface de usuário moderna criada com React, que permite ao usuário carregar planilhas (XLS/XLSX), definir parâmetros e visualizar os resultados.
* **/backend**: Uma API RESTful criada com Node.js e Express, responsável por se conectar de forma segura ao banco de dados MongoDB e fornecer os dados para o frontend.

---

## Tecnologias Utilizadas

* **Frontend**:
    * React
    * TailwindCSS
    * Lucide React (Ícones)
    * SheetJS (xlsx)
    * React Dropzone
* **Backend**:
    * Node.js
    * Express
    * MongoDB (com `mongodb` driver)
    * Dotenv
    * CORS

---

## Como Executar o Projeto Localmente

Para rodar a aplicação completa, você precisará executar o backend e o frontend simultaneamente em dois terminais diferentes.

### Pré-requisitos

* Node.js (versão 16 ou superior)
* npm (geralmente instalado com o Node.js)
* Acesso a um banco de dados MongoDB com as credenciais necessárias.

### Passo 1: Configurar o Backend

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    * Renomeie o arquivo `.env.example` para `.env`.
    * Abra o arquivo `.env` e preencha com as suas credenciais do MongoDB.
    ```env
    # Credenciais do MongoDB
    MONGO_URI="sua-string-de-conexao-completa-aqui"
    DB_NAME="nome-do-seu-banco-de-dados"

    # Porta do Servidor
    PORT=3001
    ```

4.  **Inicie o servidor backend:**
    ```bash
    npm start
    # ou node server.js
    ```
    O servidor estará rodando em `http://localhost:3001`.

### Passo 2: Configurar o Frontend

1.  **Abra um novo terminal** e navegue até a pasta do frontend:
    ```bash
    cd frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie a aplicação React:**
    ```bash
    npm start
    ```
    A aplicação será aberta automaticamente no seu navegador, geralmente em `http://localhost:3000`.

---

## Uso da Ferramenta

1.  Acesse a aplicação no seu navegador (`http://localhost:3000`).
2.  Insira o nome exato da campanha que deseja verificar.
3.  Escolha o critério de comparação (Telefone ou ID).
4.  Carregue a planilha XLS/XLSX com a lista completa de clientes.
5.  Clique em "Analisar Dados".
6.  A aplicação mostrará duas listas: clientes que receberam a mensagem (encontrados no banco) e os que não receberam.
7.  Selecione os clientes da lista de "Não Enviados" e clique em "Exportar" para gerar uma nova planilha, pronta para o reenvio.


### Ferramenta 3: Atualização de Cartão (API)
1.  Escolha o método de seleção de cartões: "Inserir IDs Manualmente" ou "Selecionar Quadro/Coluna".
2.  Se manual, cole a lista de IDs dos cartões.
3.  Se por quadro, selecione o Quadro e a Coluna desejados para buscar todos os cartões contidos neles.
4.  Marque as caixas de seleção dos campos que deseja atualizar (ex: Campanha, Fonte).
5.  Preencha os novos valores para os campos selecionados.
6.  Clique em "Atualizar Cartões via API".
7.  Acompanhe o log de resultados para cada cartão processado.



### Ferramenta 3: Atualização de Cartão (API)
Esta ferramenta permite a atualização em massa de cartões com dados específicos.

1.  **Seleção de Cartões**:
    * **Inserir IDs Manualmente**: Cole uma lista de IDs de cartões.
    * **Selecionar Quadro/Coluna**: Escolha um quadro e uma coluna para buscar e atualizar todos os cartões contidos neles.

2.  **Campos para Atualizar**:
    * Marque as caixas de seleção dos campos que deseja alterar.
    * **Status**: Permite alterar o status para "Em atendimento", "Ganho" ou "Perdido". Se "Perdido" for selecionado, um campo para selecionar o motivo se tornará obrigatório.
    * **Etiquetas**: Permite realizar três tipos de operações:
        * `Adicionar`: Adiciona as etiquetas selecionadas aos cartões.
        * `Remover`: Remove as etiquetas selecionadas dos cartões.
        * `Substituir Tudo`: Remove **todas** as etiquetas existentes do cartão e, em seguida, adiciona as novas etiquetas que foram selecionadas. Se nenhuma nova etiqueta for selecionada, apenas limpa as existentes.
    * Outros campos de texto como Campanha, Fonte e Descrição.

3.  **Execução**:
    * Clique em "Atualizar Cartões via API".
    * Acompanhe o log de resultados detalhado para cada cartão processado.
