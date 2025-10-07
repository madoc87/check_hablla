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
    * Helmet (para segurança)
    * Express Rate Limit (para proteção contra ataques de força bruta)
    * Express Mongo Sanitize (para proteção contra NoSQL injection)
    * XSS Clean (para proteção contra XSS)
    * HPP (para proteção contra parameter pollution)
    * Validator (para validação de dados)

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

    # Credenciais da API do Hablla
    HABLLA_WORKSPACE_ID="seu-workspace-id-aqui"
    HABLLA_API_TOKEN="seu-token-de-autorizacao-aqui"

    # Token de segurança para API
    API_SECRET_TOKEN="seu-token-secreto-aqui"
    ```

4.  **Inicie o servidor backend:**
    ```bash
    npm start
    # ou node secure-server.js
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

3.  **Configure as variáveis de ambiente:**
    * Renomeie o arquivo `.env.example` para `.env`.
    * Abra o arquivo `.env` e preencha com as credenciais de acesso.
    ```env
    VITE_API_SECRET_TOKEN=seu-token-secreto-aqui
    VITE_DEFAULT_THEME=dark

    # Usuário administrador padrão
    VITE_USER_ADMIN_PASSWORD=password
    VITE_USER_ADMIN_NAME=Administrador
    VITE_USER_ADMIN_THEME=dark
    ```

4.  **Inicie a aplicação React:**
    ```bash
    npm start
    ```
    A aplicação será aberta automaticamente no seu navegador, geralmente em `http://localhost:3000`.

---

## Uso da Ferramenta

1.  Acesse a aplicação no seu navegador (`http://localhost:3000`).
2.  Faça login com as credenciais configuradas no arquivo `.env`.
3.  Insira o nome exato da campanha que deseja verificar.
4.  Escolha o critério de comparação (Telefone ou ID).
5.  Carregue a planilha XLS/XLSX com a lista completa de clientes.
6.  Clique em "Analisar Dados".
7.  A aplicação mostrará duas listas: clientes que receberam a mensagem (encontrados no banco) e os que não receberam.
8.  Selecione os clientes da lista de "Não Enviados" e clique em "Exportar" para gerar uma nova planilha, pronta para o reenvio.

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

---

## Sistema de Autenticação

A aplicação agora inclui um sistema de autenticação avançado baseado em variáveis de ambiente:

### 1. Configuração de Múltiplos Usuários
- Suporte para múltiplos usuários configuráveis via variáveis de ambiente
- Cada usuário pode ter seu próprio tema preferido
- Exemplo de configuração:
  ```env
  # Usuário administrador
  VITE_USER_ADMIN_PASSWORD=password
  VITE_USER_ADMIN_NAME=Administrador
  VITE_USER_ADMIN_THEME=dark
  
  # Usuário operador
  VITE_USER_OPERATOR_PASSWORD=operator123
  VITE_USER_OPERATOR_NAME=Operador
  VITE_USER_OPERATOR_THEME=light
  ```

### 2. Temas Personalizados
- Suporte para temas claro e escuro
- Tema padrão configurável via `VITE_DEFAULT_THEME`
- Cada usuário pode ter seu tema preferido
- Botão de alternância de tema na tela de login e na interface principal

### 3. Funcionamento
- O sistema utiliza tokens JWT armazenados no localStorage para manter a sessão
- Não é necessário banco de dados para armazenar usuários
- O token é validado a cada acesso e tem validade de 8 horas
- Exibição do nome do usuário logado na interface principal

### 4. Segurança
- Senhas verificadas diretamente com as variáveis de ambiente
- Tokens JWT gerados localmente e armazenados de forma segura
- Botão de logout para encerrar sessão
- Animação de ondas SVG na tela de login para melhor experiência visual

---

## Correções e Atualizações (Setembro 2025)

### Correção de Erros na Função de Gerenciamento de Seguidores (10 Setembro 2025)

Foram realizadas melhorias importantes no tratamento de erros da função de gerenciamento de seguidores:

1. **Tratamento Robusto de Erros no Backend**:
   - Adicionada verificação para garantir que sempre é enviada uma resposta, mesmo em casos de erro
   - Melhoradas as mensagens de erro para incluir detalhes do erro original
   - Aprimorada a função `getAllServices` para fornecer mensagens de erro mais descritivas

2. **Melhorias na Experiência do Usuário**:
   - Tratamento específico para erros comuns como falha na conexão com o servidor
   - Mensagens mais amigáveis e orientadas para solução de problemas
   - Melhorias no tratamento de erros de conexão interrompida (ECONNRESET)
   - Aprimoramento do tratamento de respostas vazias do servidor

### Correção de Erros na Conexão com MongoDB (10 Setembro 2025)

Identificado e corrigido problema com o gerenciamento de conexões com o MongoDB Atlas:

- Erro relacionado a "Client network socket disconnected before secure TLS connection was established"
- Problema estava relacionado ao acúmulo de conexões não fechadas corretamente
- Implementado melhor gerenciamento de conexões com:
  - Reutilização de conexões existentes
  - Fechamento automático de conexões quando o processo é encerrado
  - Tratamento de promises para evitar múltiplas tentativas de conexão simultâneas

Para resolver problemas de conexão com MongoDB:
1. Verifique se a string de conexão no `.env` está correta
2. Certifique-se de que seu firewall permite conexões de saída na porta 27017
3. Verifique se há problemas de certificado TLS em sua rede
4. Tente usar uma string de conexão com opções adicionais: `?ssl=true&retryWrites=true&w=majority&tlsInsecure=true` (apenas para testes)

### Melhorias no Tratamento de Erros da Função de Verificação de Banco (10 Setembro 2025)

Foram implementadas melhorias significativas no tratamento de erros da função de verificação de banco de dados:

1. **Backend**:
   - Aprimorada a função de conexão com o MongoDB com opções mais robustas de timeout e retry
   - Melhorada a verificação de conexão existente antes de criar uma nova
   - Adicionado tratamento mais detalhado de erros de conexão com informações específicas sobre o tipo de erro
   - Implementado mecanismo para fechamento automático de conexões

2. **Frontend**:
   - Aprimorado o tratamento de erros na função `handleDbCheckAnalyze` com mensagens mais específicas
   - Adicionado tratamento específico para erros comuns como:
     - Falha na conexão com o servidor
     - Conexão interrompida
     - Respostas vazias do servidor
     - Erros internos do servidor (500)
   - Melhoradas as mensagens para orientar o usuário sobre como resolver os problemas

### Implementação do Sistema de Login Avançado (15 Setembro 2025)

1. **Correção do Erro no Tailwind**
   - Problema: Erro "'require' is not defined.eslintno-undef" no tailwind.config.js
   - Solução: Atualizei o arquivo para usar importações ESM modernas em vez de `require()`

2. **Criação da Tela de Login com Animação**
   - Interface de login completa com animação de ondas SVG
   - Campos para nome de usuário e senha
   - Toggle para mostrar/ocultar senha
   - Validação de campos obrigatórios
   - Feedback visual durante o processo de autenticação
   - Design responsivo e moderno usando TailwindCSS
   - Botão de alternância de tema na tela de login

3. **Sistema de Autenticação Avançado**
   - Suporte para múltiplos usuários configuráveis via variáveis de ambiente
   - Cada usuário pode ter seu próprio tema preferido
   - Tema padrão configurável
   - Tokens JWT com expiração de 8 horas
   - Exibição do nome do usuário logado na interface principal

4. **Integração com a Aplicação**
   - Componente ProtectedRoute: Wrapper que protege todas as rotas da aplicação
   - Refatoração do App.jsx: Separação em App.jsx (roteamento) e MainApp.jsx (conteúdo principal)
   - Botão de Logout: Adicionado à interface principal para sair da aplicação
   - Exibição do nome do usuário logado na interface

5. **Configuração e Documentação**
   - Atualização dos arquivos .env: Adição das variáveis para múltiplos usuários
   - Atualização do README.md: Documentação completa do sistema de autenticação
   - Instruções claras: Passo a passo para configurar e usar o sistema de login

**Benefícios da Implementação**

1. Segurança: Protege o acesso à aplicação sem necessidade de banco de dados
2. Flexível: Suporte para múltiplos usuários configuráveis via variáveis de ambiente
3. Personalizável: Cada usuário pode ter seu tema preferido
4. Compatível: Funciona perfeitamente com sua infraestrutura Docker/EasyPanel
5. Profissional: Interface moderna com animações e responsiva


### 16/09

Melhorias Implementadas

  1. Sistema de Autenticação Avançado
   - Múltiplos Usuários: Agora você pode criar vários usuários configurando variáveis de ambiente seguindo o padrão:
     - VITE_USER_[NOME]_PASSWORD - Senha do usuário
     - VITE_USER_[NOME]_NAME - Nome de exibição do usuário
     - VITE_USER_[NOME]_THEME - Tema preferido do usuário (dark/light)

  2. Sistema de Temas
   - Tema Padrão: Configurável via VITE_DEFAULT_THEME (dark ou light)
   - Temas por Usuário: Cada usuário pode ter seu tema preferido
   - Alternância de Tema: Botão para alternar entre temas claro e escuro tanto na tela de login quanto na interface
     principal
   - Nome do Usuário: Exibição do nome do usuário logado no cabeçalho da aplicação

  3. Interface Aprimorada
   - Animação de Ondas SVG: Implementação da animação de ondas na tela de login, igual ao modelo desejado
   - Design Moderno: Interface atualizada com melhor experiência visual
   - Responsividade: Layout otimizado para diferentes tamanhos de tela

  4. Segurança e Configuração
   - Tokens JWT: Sistema de autenticação seguro com tokens que expiram em 8 horas
   - Variáveis de Ambiente: Configuração fácil e segura via arquivos .env
   - Sem Banco de Dados: Não é necessário banco de dados para gerenciar usuários

  5. Documentação Atualizada
   - README.md: Documentação completa com instruções para configurar múltiplos usuários
   - Exemplos de Configuração: Modelos prontos para adicionar novos usuários

  Como Adicionar Novos Usuários

  Para adicionar novos usuários, basta incluir as seguintes variáveis no arquivo .env do frontend:

   1 # Exemplo de novo usuário
   2 VITE_USER_SUPERVISOR_PASSWORD=supervisor123
   3 VITE_USER_SUPERVISOR_NAME=Supervisor
   4 VITE_USER_SUPERVISOR_THEME=light
   5 
   6 # Outro usuário
   7 VITE_USER_ANALYST_PASSWORD=analyst123
   8 VITE_USER_ANALYST_NAME=Analista
   9 VITE_USER_ANALYST_THEME=dark

  Agora a aplicação mais segura, personalizável e profissional, e melhorada para implantação em produção!

  ---

   Correções Realizadas

   1. Remoção de importação desnecessária: Removi a importação de getAllUsers no arquivo Login.jsx, pois ela não estava
      sendo utilizada.

   2. Correção de variáveis não utilizadas:
      - No arquivo auth.js, corrigi o bloco catch (e) para catch (error) e adicionei um log de erro para utilizar a
        variável.
      - No arquivo Login.jsx, corrigi o bloco catch (e) para catch (error) e adicionei um log de erro para utilizar a
        variável.