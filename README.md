# RPG Scheduler

Este é um aplicativo web simples projetado para ajudar grupos de RPG a agendar suas sessões. Ele permite que os jogadores marquem sua disponibilidade para os próximos dias, e fornece ao Mestre do Jogo (GM) uma visão geral para encontrar a melhor data para a próxima aventura.

## ✨ Funcionalidades

-   **Autenticação de Usuário:** Sistema de registro e login simples usando nome de usuário e senha.
-   **Visão do Jogador:**
    -   Exibe uma grade com os próximos 14 dias.
    -   Permite que os jogadores marquem sua disponibilidade como "Posso Jogar", "Não Posso" ou "Talvez".
    -   Salva a disponibilidade em tempo real no Firestore.
-   **Visão do Mestre (GM):**
    -   Exibe a grade de disponibilidade pessoal (para o mestre também marcar seus dias).
    -   Exibe um painel com a disponibilidade de todos os jogadores em uma tabela.
    -   Possui uma função para "Encontrar Melhor Dia", que analisa os dados e sugere as datas mais promissoras.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3, TypeScript
-   **Backend & Database:** Firebase (Authentication e Firestore)
-   **Hospedagem:** Firebase Hosting
-   **Build Tool:** Webpack com `ts-loader`

## 📂 Estrutura do Projeto

O código-fonte está localizado no diretório `src` e foi organizado de forma modular para facilitar a manutenção:

-   `src/main.ts`: O ponto de entrada da aplicação. Inicializa os outros módulos.
-   `src/firebase.ts`: Inicializa e exporta as instâncias do Firebase (`auth`, `db`).
-   `src/auth.ts`: Gerencia todo o fluxo de autenticação, incluindo a lógica do formulário e o observador de estado de login.
-   `src/player-view.ts`: Responsável por renderizar a grade de disponibilidade para um jogador.
-   `src/gm-view.ts`: Responsável por renderizar o painel do mestre e a lógica para encontrar o melhor dia.
-   `src/utils.ts`: Contém funções de utilidade, como formatação de datas.
-   `src/firebase-config.ts`: **(Requer configuração manual)** Arquivo onde a configuração do seu projeto Firebase deve ser inserida.

## 🚀 Instalação e Uso

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <nome-do-diretorio>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Firebase:**
    -   Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    -   Adicione um aplicativo da Web ao seu projeto.
    -   Copie o objeto de configuração do Firebase e cole-o em `src/firebase-config.ts`.
    -   No console do Firebase, vá para **Build > Authentication > Sign-in method** e habilite o provedor **Email/Password**.
    -   No console do Firebase, vá para **Build > Firestore Database** e crie um banco de dados no modo de produção.

4.  **Execute em modo de desenvolvimento:**
    -   Para compilar o código e observar as mudanças automaticamente:
        ```bash
        npm start
        ```
    -   Abra o arquivo `public/index.html` em seu navegador.

## 📜 Scripts Disponíveis

-   `npm start`: Inicia o Webpack em modo de observação (`watch`), recompilando o `bundle.js` a cada alteração nos arquivos `.ts`.
-   `npm run build`: Executa uma compilação única do projeto para produção.
-   `npm run deploy`: Faz o deploy do conteúdo da pasta `public` para o Firebase Hosting. (Requer login prévio).
-   `npm run build-and-deploy`: Executa a compilação e o deploy em um único comando.

## ☁️ Deploy no Firebase Hosting

1.  **Faça o login no Firebase:**
    -   Este comando só precisa ser executado uma vez.
    ```bash
    npx firebase login
    ```

2.  **Faça o deploy:**
    -   Para fazer o deploy da versão mais recente do seu código, certifique-se de que ele foi compilado primeiro.
    ```bash
    npm run build-and-deploy
    ```
    -   Após a conclusão, o terminal exibirá a URL onde sua aplicação está hospedada (ex: `https://rpg-datas.web.app`).
