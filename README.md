# 📋 CheckList - Sistema de Gerenciamento de ocorrência

 Sistema web para gerenciamento e ocorrências, desenvolvido utilizando JavaScript moderno (ES Modules), HTML5 e CSS3, com autenticação baseada em Token JWT e comunicação com API REST.

---

# 📖 Sumário

- 🎯 Objetivo
- ✨ Funcionalidades
- 🏗 Arquitetura
- 📁 Estrutura do Projeto
- 🛠 Tecnologias Utilizadas
- 🔄 Fluxo da Aplicação
- 🔐 Autenticação
- 📋 Gerenciamento de ocorrência
- 💾 Persistência
- 🎨 Interface
- 🚀 Possíveis Melhorias

---

# 🎯 Objetivo

O **CheckList** é uma aplicação web desenvolvida para auxiliar usuários no gerenciamento de ocorrências de forma simples, organizada e intuitiva.

O sistema permite:

- Cadastro de usuários;
- Login autenticado;
- Gerenciamento completo de ocorrência;
- Organização por área;
- Controle do status das ocorrência;
- Visualização de indicadores em tempo real.

Todo o acesso ao sistema é protegido por autenticação utilizando **Token JWT**.

---

# ✨ Funcionalidades

## 👤 Usuários

- Cadastro de usuário
- Login
- Logout
- Controle de sessão
- Exibição do usuário autenticado

---

## 📋 Ocorrências

O sistema permite:

- ✅ Criar ocorrência
- ✏️ Editar ocorrência
- ❌ Excluir ocorrência
- ✔️ Concluir ocorrência
- 📞 Marcar como atendida
- 🔄 Atualizar informações
- 📄 Listar ocorrência

---

## 🏷 Organização

Cada tarefa possui:

- Título
- Descrição
- Área responsável
- Prioridade
- Status
- Data de criação

---

## 📊 Dashboard

O dashboard apresenta indicadores de:

- 📂 ocorrência abertas
- 📞 ocorrência atendidas
- ✅ ocorrência concluídas
- 🗑 ocorrência excluídas

Os indicadores são atualizados automaticamente.

---

## 🔍 Filtros

O usuário pode visualizar ocorrência por:

- Área
- Status

Status disponíveis:

- Aberta
- Atendida
- Concluída
- Excluída

---

# 🏗 Arquitetura

O projeto foi desenvolvido seguindo uma arquitetura modular baseada em componentes.

```
┌──────────────────────┐
│      Interface       │
│ HTML + CSS + JS UI   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Controllers (UI)     │
│ auth.js              │
│ tasks.js             │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ API Layer            │
│ api.js               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Backend REST API     │
│ Flask + JWT          │
└──────────────────────┘
```

A arquitetura foi dividida em responsabilidades:

- Interface
- Controladores
- Comunicação com API
- Backend

Essa separação facilita manutenção, escalabilidade e reutilização do código.

---

# 📁 Estrutura do Projeto

```
📦 checklist-front
│
├── index.html
├── login.css
├── app.js
├── api.js
│
├── ui
│   ├── auth.js
│   ├── tasks.js
│   └── utils.js
│
└── assets
```

---

# 🛠 Tecnologias Utilizadas

## Front-end

- 🌐 HTML5
- 🎨 CSS3
- ⚙️ JavaScript ES6+
- 📦 ES Modules

---

## Back-end

- 🐍 Python
- Flask
- Flask-JWT
- SQLAlchemy
- SQLite

---

## Comunicação

- REST API
- Fetch API
- JSON

---

## Armazenamento Local

Utilização do **LocalStorage** para armazenar:

- Token JWT
- Informações do usuário

---

# 🔄 Fluxo da Aplicação

## 1️⃣ Login

```
Usuário

↓

Tela de Login

↓

API

↓

JWT

↓

LocalStorage

↓

Dashboard
```

---

## 2️⃣ Cadastro

```
Usuário

↓

Tela de Cadastro

↓

API

↓

Banco de Dados

↓

Login Automático

↓

Dashboard
```

---

## 3️⃣ CRUD de Tarefas

```
Dashboard

↓

Cadastro

↓

API

↓

Banco

↓

Atualização da Lista
```

---

# 🔐 Autenticação

O sistema utiliza autenticação baseada em **JWT (JSON Web Token)**.

Fluxo:

```
Login

↓

API valida usuário

↓

Token JWT

↓

LocalStorage

↓

Requisições autenticadas
```

Sempre que uma requisição é enviada, o token é incluído no cabeçalho:

```http
Authorization: Bearer <token>
```

Caso o token expire:

- usuário é desconectado;
- sessão encerrada;
- retorno para tela de login.

---

# 📋 Gerenciamento de Tarefas

Cada ocorrência possui:

| Campo | Descrição |
|--------|-----------|
| Título | Nome da ocorrência |
| Descrição | Informações adicionais |
| Área | TI, Comercial ou Operação |
| Prioridade | Alta, Média ou Baixa |
| Status | Aberta, Atendida, Concluída ou Excluída |
| Data | Data de criação |


---

# 🎨 Interface

A interface foi desenvolvida seguindo princípios de:

- 🎯 Simplicidade
- 📱 Responsividade
- 🎨 Design moderno
- ⚡ Facilidade de uso

Os principais componentes são:

- Tela de Login
- Tela de Cadastro
- Dashboard
- Painel de ocorrência
- Cards de ocorrência
- Indicadores
- Toasts de mensagens

---

# 🔒 Segurança

O sistema implementa:

- Autenticação JWT
- Validação de sessão
- Logout seguro
- Proteção de rotas
- Tratamento de erros de autenticação

---

# 🚀 Possíveis Melhorias

O projeto pode evoluir com funcionalidades como:

- 👥 Controle de permissões por perfil
- 🔔 Notificações em tempo real
- 🌙 Tema Dark Mode
- 🐳 Docker
- ☁ Deploy em nuvem

---

# 📌 Conclusão

O **CheckList** é uma aplicação web moderna para gerenciamento de ocorrência, construída utilizando uma arquitetura modular e desacoplada, separando interface, regras de negócio e comunicação com a API.

A utilização de JavaScript modular, autenticação JWT e integração com uma API REST torna o sistema escalável, organizado e preparado para futuras evoluções, mantendo uma experiência simples e eficiente para o usuário final.