# RPG Scheduler

Este é um aplicativo web simples projetado para ajudar grupos de RPG a agendar suas sessões. Ele permite que os jogadores marquem sua disponibilidade em um calendário interativo e fornece ao Mestre do Jogo (GM) uma visão geral para encontrar a melhor data para a próxima aventura.

## ✨ Funcionalidades

-   **Autenticação de Usuário:** Sistema de registro e login simples usando nome de usuário e senha.
-   **Visão do Jogador:**
    -   Exibe um calendário interativo para navegar entre os meses.
    -   Permite que os jogadores cliquem em um dia para marcar sua disponibilidade (Disponível, Talvez, Indisponível).
    -   Salva a disponibilidade em tempo real no Firestore.
-   **Visão do Mestre (GM):**
    -   Exibe o mesmo calendário de disponibilidade para o mestre também marcar seus dias.
    -   Apresenta um painel com a disponibilidade de todos os jogadores em uma tabela para o mês selecionado.
    -   Possui uma função para "Encontrar Melhor Dia", que analisa os dados do mês atual e sugere as datas mais promissoras.
-   **Tema Customizável:**
    -   Seletor de tema com as opções "Claro", "Escuro" e "Sistema".
    -   A preferência de tema é salva localmente e persiste entre as visitas.
-   **Design Responsivo:** O layout se adapta a diferentes tamanhos de tela, de desktops a celulares.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3, TypeScript
-   **Backend & Database:** Firebase (Authentication e Firestore)
-   **Hospedagem:** Firebase Hosting
-   **Build Tool:** Webpack com `ts-loader` e `dotenv`

## 📂 Estrutura do Projeto

O código-fonte está localizado no diretório `src` e foi organizado de forma modular:

-   `src/main.ts`: O ponto de entrada da aplicação. Inicializa os outros módulos.
-   `src/firebase.ts`: Inicializa e exporta as instâncias do Firebase (`auth`, `db`).
-   `src/auth.ts`: Gerencia o fluxo de autenticação e orquestra qual visão (jogador/mestre) é renderizada.
-   `src/player-view.ts`: Renderiza e gerencia o calendário de disponibilidade do jogador.
-   `src/gm-view.ts`: Renderiza e gerencia o painel de visão geral do mestre.
-   `src/theme.ts`: Controla a lógica de seleção e persistência do tema.
-   `src/utils.ts`: Contém funções de utilidade (ex: formatação de datas).

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

3.  **Configure as Variáveis de Ambiente:**
    -   Crie uma cópia do arquivo `.env.example` e renomeie-a para `.env`.
    -   Preencha o arquivo `.env` com as chaves e IDs do seu projeto Firebase. Você pode encontrá-los no **Console do Firebase > Configurações do Projeto > Geral > Seus apps**.
    -   Este passo é crucial para a segurança do projeto.

4.  **Configure o Projeto Firebase:**
    -   Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    -   No console, vá para **Build > Authentication > Sign-in method** e habilite o provedor **Email/Password**.
    -   No console, vá para **Build > Firestore Database** e crie um banco de dados (pode começar no modo de teste e depois ajustar as regras de segurança).

5.  **Execute em modo de desenvolvimento:**
    -   Para compilar o código e observar as mudanças automaticamente:
        ```bash
        npm start
        ```
    -   Abra o arquivo `public/index.html` em seu navegador.

## 🔒 Segurança

As chaves de API e outras informações sensíveis do Firebase são gerenciadas através de um arquivo `.env`. Este arquivo **não é e não deve ser** enviado para o repositório Git (ele já está no `.gitignore`). O Webpack injeta essas variáveis durante o processo de build, garantindo que elas não fiquem expostas no código-fonte.

## 📜 Scripts Disponíveis

-   `npm start`: Inicia o Webpack em modo de observação (`watch`), recompilando o `bundle.js` a cada alteração.
-   `npm run build`: Executa uma compilação única do projeto.
-   `npm run deploy`: Faz o deploy do conteúdo da pasta `public` para o Firebase Hosting. (Requer login prévio).
-   `npm run build-and-deploy`: Executa a compilação e o deploy em um único comando.

## ☁️ Deploy no Firebase Hosting

1.  **Faça o login no Firebase:**
    -   Este comando só precisa ser executado uma vez.
    ```bash
    npx firebase login
    ```

2.  **Faça o deploy:**
    -   Para fazer o deploy da versão mais recente do seu código:
    ```bash
    npm run build-and-deploy
    ```
    -   Após a conclusão, o terminal exibirá a URL onde sua aplicação está hospedada (ex: `https://rpg-datas.web.app`).
