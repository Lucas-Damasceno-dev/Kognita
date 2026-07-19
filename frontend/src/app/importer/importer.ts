import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export interface CategoryEntry {
  name: string;
  tasks: string[];
}

export interface RoadmapPreset {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: string;
  section: 'role' | 'skill' | 'project' | 'best_practice' | 'w3schools';
  topics: string[];
}

@Component({
  selector: 'app-importer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importer.html',
  styleUrl: './importer.css',
})
export class Importer {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  saving = signal(false);
  activeTab = signal<'roadmaps' | 'paste' | 'manual'>('roadmaps');
  roadmapSearch = signal('');
  selectedRoadmapSection = signal<string>('all');

  // Complete Exhaustive Catalog: 92 Roadmaps from roadmap.sh + All 39 W3Schools Header Bar Courses (140+ Presets)
  roadmaps = signal<RoadmapPreset[]>([
    // ================= 1. ROLE-BASED ROADMAPS (roadmap.sh) =================
    {
      id: 'role_frontend',
      title: 'Frontend Developer',
      icon: '🖥️',
      description: 'Estrutura oficial do roadmap.sh para desenvolvimento de interfaces web.',
      category: 'Desenvolvimento Frontend',
      section: 'role',
      topics: [
        'Internet, HTTP/HTTPS & Funcionamento de Navegadores',
        'HTML5 Semântico, Acessibilidade (WCAG) & SEO',
        'CSS3, Flexbox, CSS Grid & Layouts Responsivos',
        'JavaScript Moderno (ES6+, DOM, Fetch API, Async/Await)',
        'Controle de Versão com Git & GitHub',
        'Gerenciadores de Pacote (npm, yarn, pnpm)',
        'Frameworks JS (React, Angular, Vue.js)',
        'CSS Frameworks & Preprocessadores (Tailwind CSS, Sass)',
        'Type Checkers (TypeScript)',
        'Testes Automatizados (Jest, Cypress, Playwright)',
        'Build Tools & Bundlers (Vite, Webpack)',
        'Performance Web & Core Web Vitals',
        'Server Side Rendering (Next.js, Nuxt.js)',
      ],
    },
    {
      id: 'role_backend',
      title: 'Backend Developer',
      icon: '⚙️',
      description: 'Estrutura oficial para arquitetura de servidores, APIs e banco de dados.',
      category: 'Desenvolvimento Backend',
      section: 'role',
      topics: [
        'Fundamentos de Redes, TCP/IP & Sistemas Operacionais',
        'Linguagem Principal (Java, Python, Node.js, Go ou C#)',
        'Controle de Versão com Git & Estratégias de Branching',
        'Bancos de Dados Relacionais (PostgreSQL, MySQL)',
        'Bancos de Dados NoSQL (MongoDB, Redis)',
        'Arquitetura de APIs RESTful & GraphQL',
        'Segurança Web & Autenticação (JWT, OAuth2, CORS, Hashing)',
        'Testes Unitários, Integração e TDD',
        'Conteinerização com Docker & Docker Compose',
        'Mensageria & Filas (RabbitMQ, Apache Kafka)',
        'CI/CD Pipelines (GitHub Actions, Jenkins)',
        'Design Patterns & Clean Architecture',
        'Microserviços & Comunicação gRPC',
      ],
    },
    {
      id: 'role_fullstack',
      title: 'Full Stack Developer',
      icon: '🌐',
      description: 'Trilha completa cobrindo do Frontend ao Backend, Banco de Dados e Deploy.',
      category: 'Desenvolvimento Full Stack',
      section: 'role',
      topics: [
        'HTML, CSS & JavaScript Essencial',
        'Frontend Framework (React, Next.js ou Angular)',
        'Backend Runtime (Node.js/Express, Spring Boot ou FastAPI)',
        'Modelagem de Banco de Dados Relacional & ORM',
        'Modelagem de Banco de Dados NoSQL',
        'Construção e Consumo de APIs RESTful',
        'Autenticação de Usuários & Segurança de Sessões',
        'Git, GitHub & Colaboração em Código',
        'Deploy em Nuvem (Vercel, Render, Railway, AWS)',
        'Dockerização de Aplicação Full Stack',
      ],
    },
    {
      id: 'role_devops',
      title: 'DevOps Engineer',
      icon: '☁️',
      description: 'Automação de infraestrutura, conteinerização, Kubernetes e Nuvem.',
      category: 'DevOps & Infraestrutura',
      section: 'role',
      topics: [
        'Sistemas Operacionais & Administração Linux',
        'Scripting em Shell/Bash e Python',
        'Redes de Computadores, Firewalls, DNS & SSH',
        'Conteinerização de Aplicações com Docker',
        'Orquestração de Containers com Kubernetes (K8s)',
        'Infraestrutura como Código com Terraform & Ansible',
        'Serviços em Nuvem (AWS, Azure ou GCP)',
        'Pipelines de Integração & Entrega Contínua (CI/CD)',
        'Monitoramento & Observabilidade (Prometheus, Grafana)',
      ],
    },
    {
      id: 'role_data_scientist',
      title: 'Data Scientist',
      icon: '📊',
      description: 'Análise de dados, Pandas, SQL, Estatística e Machine Learning.',
      category: 'Data Science & IA',
      section: 'role',
      topics: [
        'Programação em Python voltada para Ciência de Dados',
        'Manipulação de Dados com Pandas & NumPy',
        'Visualização de Dados (Matplotlib, Seaborn, PowerBI)',
        'SQL Avançado para Análise de Dados',
        'Estatística Descritiva, Inferencial e Probabilidade',
        'Limpeza & Engenharia de Recursos (Feature Engineering)',
        'Machine Learning Supervisionado (Scikit-Learn)',
        'Algoritmos de Classificação, Regressão & Clusterização',
        'Introdução a Deep Learning & Redes Neurais',
      ],
    },
    {
      id: 'role_ai_engineer',
      title: 'AI Engineer',
      icon: '🤖',
      description: 'Arquitetura de LLMs, LangChain, Bancos Vetoriais (RAG) e Fine-Tuning.',
      category: 'Engenharia de IA',
      section: 'role',
      topics: [
        'Fundamentos de Modelos de Linguagem (LLMs & Transformers)',
        'Engenharia de Prompt (Few-shot, Chain-of-Thought)',
        'Bancos de Dados Vetoriais (ChromaDB, Pinecone, Qdrant)',
        'Arquitetura RAG (Retrieval-Augmented Generation)',
        'Orquestração de Agentes de IA com LangChain & LlamaIndex',
        'APIs de Modelos (OpenAI API, Anthropic, Hugging Face)',
        'Ajuste Fino de Modelos (Fine-Tuning & LoRA)',
      ],
    },
    {
      id: 'role_mobile',
      title: 'Mobile Developer',
      icon: '📱',
      description: 'Desenvolvimento multiplataforma com Flutter e React Native.',
      category: 'Desenvolvimento Mobile',
      section: 'role',
      topics: [
        'Fundamentos de UI/UX para Dispositivos Móveis',
        'Framework Multiplataforma (Flutter ou React Native)',
        'Gerenciamento de Estado (Bloc, Redux, Provider, Zustand)',
        'Consumo de APIs RESTful & WebSockets no Mobile',
        'Persistência de Dados Local (SQLite, Hive, AsyncStore)',
        'Notificações Push (Firebase Cloud Messaging)',
        'Publicação nas Lojas (Google Play Console & Apple App Store)',
      ],
    },
    {
      id: 'role_cybersecurity',
      title: 'Cyber Security Specialist',
      icon: '🛡️',
      description: 'Segurança defensiva, pentest, OWASP e testes de vulnerabilidade.',
      category: 'Segurança da Informação',
      section: 'role',
      topics: [
        'Fundamentos de Redes, Wireshark & Protocolos de Segurança',
        'Administração de Segurança em Linux & Windows',
        'OWASP Top 10 Vulnerabilidades Web',
        'Engenharia Reversa & Análise de Malware',
        'Testes de Invasão (Pentest) com Metasploit & Burp Suite',
        'Criptografia Assimétrica, Hashing & PKI',
      ],
    },

    // ================= 2. SKILL-BASED ROADMAPS (roadmap.sh) =================
    {
      id: 'skill_ruby',
      title: 'Ruby',
      icon: '💎',
      description: 'Linguagem Ruby Core, sintaxe, blocos, proc, lambda e gemas.',
      category: 'Skill: Ruby',
      section: 'skill',
      topics: [
        'Sintaxe Básica de Ruby & Tipos de Dados',
        'Blocos, Procs e Lambdas',
        'Orientação a Objetos e Mapeamento de Módulos (Mixins)',
        'Gerenciamento de Gemas com Bundler',
        'Testes Automatizados com RSpec & Minitest',
        'Metaprogramação em Ruby',
      ],
    },
    {
      id: 'skill_ruby_on_rails',
      title: 'Ruby on Rails',
      icon: '🛤️',
      description: 'Framework Ruby on Rails, MVC, Active Record e Action Pack.',
      category: 'Skill: Ruby on Rails',
      section: 'skill',
      topics: [
        'Arquitetura MVC (Model-View-Controller) no Rails',
        'Mapeamento de Banco de Dados com Active Record',
        'Migrations e Validações de Modelos',
        'Roteamento RESTful & Controllers',
        'Processamento de Fundo com Sidekiq & ActiveJob',
        'Testes de Integração com RSpec e Capybara',
      ],
    },
    {
      id: 'skill_javascript',
      title: 'JavaScript',
      icon: '🟨',
      description: 'JavaScript ES6+, Assincronismo, Protótipos e V8 Engine.',
      category: 'Skill: JavaScript',
      section: 'skill',
      topics: [
        'Tipos de Dados, Hoisting e Escopo de Variáveis (var, let, const)',
        'Funções, Arrow Functions e Closures',
        'Manipulação do DOM e Event Listeners',
        'Promises, Async/Await e Fetch API',
        'Protótipos e Herança Prototipática',
        'Event Loop, Call Stack e Microtask Queue',
      ],
    },
    {
      id: 'skill_typescript',
      title: 'TypeScript',
      icon: '🔷',
      description: 'Types avançados, Generics, Interfaces e AST.',
      category: 'Skill: TypeScript',
      section: 'skill',
      topics: [
        'Tipos Básicos e Inferência de Tipos',
        'Interfaces e Type Aliases',
        'Generics e Utility Types (Partial, Pick, Omit, Record)',
        'Union, Intersection e Conditional Types',
        'Decorators e Mapeamento de Tipos Avançado',
      ],
    },

    // ================= 3. CURSOS DO CABEÇALHO W3SCHOOLS (W3SCHOOLS TOP BAR) =================
    {
      id: 'w3_html',
      title: 'W3Schools: HTML',
      icon: '🌐',
      description: 'Curso oficial W3Schools HTML Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: HTML',
      section: 'w3schools',
      topics: [
        'W3Schools HTML: Introduction, Editors & Basic Elements',
        'W3Schools HTML: Attributes, Headings, Paragraphs & Styles',
        'W3Schools HTML: Formatting, Quotations, Comments & Colors',
        'W3Schools HTML: CSS Integration, Links, Images & Tables',
        'W3Schools HTML: Lists, Block/Inline & Classes/Id',
        'W3Schools HTML: Forms, Input Types, Form Attributes & Validation',
        'W3Schools HTML5: Semantic Elements (nav, header, footer, section)',
        'W3Schools HTML: Media (Video, Audio), Plug-ins & Canvas',
      ],
    },
    {
      id: 'w3_css',
      title: 'W3Schools: CSS',
      icon: '🎨',
      description: 'Curso oficial W3Schools CSS Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: CSS',
      section: 'w3schools',
      topics: [
        'W3Schools CSS: Syntax, Selectors, How to Add CSS & Colors',
        'W3Schools CSS: Backgrounds, Borders, Margins, Padding & Height/Width',
        'W3Schools CSS: Box Model, Outline, Text, Fonts & Icons',
        'W3Schools CSS: Display, Max-width, Position, Z-index & Overflow',
        'W3Schools CSS: Float, Inline-block, Align & Combinators',
        'W3Schools CSS: Flexbox Layout System',
        'W3Schools CSS: Grid Layout System',
        'W3Schools CSS: Media Queries & Responsive Web Design',
      ],
    },
    {
      id: 'w3_javascript',
      title: 'W3Schools: JAVASCRIPT',
      icon: '🟨',
      description: 'Curso oficial W3Schools JavaScript Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: JAVASCRIPT',
      section: 'w3schools',
      topics: [
        'W3Schools JS: Introduction, Where To, Output & Statements',
        'W3Schools JS: Syntax, Comments, Variables (let, const) & Operators',
        'W3Schools JS: Data Types, Functions, Objects & Events',
        'W3Schools JS: Strings, Numbers, Arrays & Array Iteration Methods',
        'W3Schools JS: Dates, Math, Random, Booleans & Comparisons',
        'W3Schools JS: Conditions, Switch, Loops (For, While, Break)',
        'W3Schools JS: Sets, Maps, Typeof, Type Conversion & RegEx',
        'W3Schools JS: DOM Manipulation, Event Listeners & Nodes',
        'W3Schools JS: Promises, Async/Await, AJAX & Fetch API',
      ],
    },
    {
      id: 'w3_sql',
      title: 'W3Schools: SQL',
      icon: '🛢️',
      description: 'Curso oficial W3Schools SQL Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: SQL',
      section: 'w3schools',
      topics: [
        'W3Schools SQL: Syntax, SELECT, SELECT DISTINCT & WHERE Clause',
        'W3Schools SQL: AND, OR, NOT, ORDER BY & INSERT INTO',
        'W3Schools SQL: NULL Values, UPDATE, DELETE, TOP/LIMIT & MIN/MAX',
        'W3Schools SQL: COUNT, SUM, AVG, LIKE, Wildcards & IN/BETWEEN',
        'W3Schools SQL: Aliases, JOINs (INNER, LEFT, RIGHT, FULL OUTER)',
        'W3Schools SQL: GROUP BY, HAVING, EXISTS & SELECT INTO',
        'W3Schools SQL: CREATE DATABASE, DROP, CREATE TABLE & ALTER TABLE',
      ],
    },
    {
      id: 'w3_python',
      title: 'W3Schools: PYTHON',
      icon: '🐍',
      description: 'Curso oficial W3Schools Python Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: PYTHON',
      section: 'w3schools',
      topics: [
        'W3Schools Python: Syntax, Comments, Variables & Data Types',
        'W3Schools Python: Numbers, Casting, Strings & Booleans',
        'W3Schools Python: Operators, Lists, Tuples, Sets & Dictionaries',
        'W3Schools Python: If...Else, While Loops, For Loops & Functions',
        'W3Schools Python: Lambda, Arrays, Classes/Objects & Inheritance',
        'W3Schools Python: Iterators, Scope, Modules, Dates & Math',
        'W3Schools Python: JSON, RegEx, PIP, Try...Except & User Input',
      ],
    },
    {
      id: 'w3_java',
      title: 'W3Schools: JAVA',
      icon: '☕',
      description: 'Curso oficial W3Schools Java Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: JAVA',
      section: 'w3schools',
      topics: [
        'W3Schools Java: Syntax, Output, Variables & Data Types',
        'W3Schools Java: Type Casting, Operators, Strings & Math',
        'W3Schools Java: Booleans, If...Else, Switch & Loops',
        'W3Schools Java: Arrays, Methods & Method Overloading',
        'W3Schools Java: OOP (Classes, Objects, Attributes, Constructors)',
        'W3Schools Java: Modifiers, Encapsulation, Packages & Inheritance',
        'W3Schools Java: Polymorphism, Abstraction, Interfaces & Enums',
      ],
    },
    {
      id: 'w3_php',
      title: 'W3Schools: PHP',
      icon: '🐘',
      description: 'Curso oficial W3Schools PHP Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: PHP',
      section: 'w3schools',
      topics: [
        'W3Schools PHP: Syntax, Comments, Variables & Echo/Print',
        'W3Schools PHP: Data Types, Strings, Numbers, Math & Constants',
        'W3Schools PHP: Operators, If...Else, Switch & Loops',
        'W3Schools PHP: Functions, Arrays & Superglobals ($_GET, $_POST)',
        'W3Schools PHP: Form Handling, Validation & Required Fields',
        'W3Schools PHP: OOP (Classes, Objects, Constructors, Inheritance)',
        'W3Schools PHP: MySQL Database Connection, Insert & Select',
      ],
    },
    {
      id: 'w3_w3css',
      title: 'W3Schools: W3.CSS',
      icon: '🎨',
      description: 'Curso oficial W3Schools W3.CSS Framework (Top Bar W3Schools).',
      category: 'W3Schools: W3.CSS',
      section: 'w3schools',
      topics: [
        'W3.CSS: Intro, Colors, Containers & Panels',
        'W3.CSS: Borders, Cards, Fonts & Text Utilities',
        'W3.CSS: Buttons, Badges, Tags, Images & Tables',
        'W3.CSS: Navigation Bars, Sidebar, Dropdowns & Modals',
      ],
    },
    {
      id: 'w3_c',
      title: 'W3Schools: C',
      icon: '🔤',
      description: 'Curso oficial W3Schools C Programming (Top Bar W3Schools).',
      category: 'W3Schools: C',
      section: 'w3schools',
      topics: [
        'W3Schools C: Syntax, Output, Comments & Variables',
        'W3Schools C: Data Types, Constants, Operators & Booleans',
        'W3Schools C: If...Else, Switch & Loops (While, For)',
        'W3Schools C: Arrays, Strings, User Input & Pointers',
        'W3Schools C: Functions, Parameters & Memory Management',
      ],
    },
    {
      id: 'w3_cpp',
      title: 'W3Schools: C++',
      icon: '⚡',
      description: 'Curso oficial W3Schools C++ Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: C++',
      section: 'w3schools',
      topics: [
        'W3Schools C++: Syntax, Variables, Input & Data Types',
        'W3Schools C++: Operators, Strings, Math & Booleans',
        'W3Schools C++: Conditions, Switch & Loops',
        'W3Schools C++: Arrays, Structures, References & Pointers',
        'W3Schools C++: Functions, Overloading & OOP (Classes, Objects)',
      ],
    },
    {
      id: 'w3_csharp',
      title: 'W3Schools: C#',
      icon: '🟣',
      description: 'Curso oficial W3Schools C# Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: C#',
      section: 'w3schools',
      topics: [
        'W3Schools C#: Syntax, Output, Variables & Data Types',
        'W3Schools C#: Type Casting, Operators & Strings',
        'W3Schools C#: If...Else, Switch & Loops',
        'W3Schools C#: Arrays, Methods & OOP (Classes, Objects)',
        'W3Schools C#: Inheritance, Interfaces & Files',
      ],
    },
    {
      id: 'w3_howto',
      title: 'W3Schools: HOW TO',
      icon: '💡',
      description: 'Curso oficial W3Schools How TO Snippets (Top Bar W3Schools: Carrossel, Modais, Accordions, Sidebars).',
      category: 'W3Schools: HOW TO',
      section: 'w3schools',
      topics: [
        'W3Schools How TO: Responsive Navigation Bars & Sidebars',
        'W3Schools How TO: Modals, Popups, Lightboxes & Tooltips',
        'W3Schools How TO: Image Carousels, Slideshows & Zoom Effects',
        'W3Schools How TO: Accordions, Tabs, Collapsibles & Dropdowns',
        'W3Schools How TO: Form Validation, Custom Selects & Search Filters',
        'W3Schools How TO: Responsive Grids, Product Cards & Parallax',
      ],
    },
    {
      id: 'w3_bootstrap',
      title: 'W3Schools: BOOTSTRAP',
      icon: '🟣',
      description: 'Curso oficial W3Schools Bootstrap 5 Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: BOOTSTRAP',
      section: 'w3schools',
      topics: [
        'W3Schools Bootstrap: Containers, Grid System & Typography',
        'W3Schools Bootstrap: Colors, Tables, Images & Alerts',
        'W3Schools Bootstrap: Buttons, Badges, Progress Bars & Cards',
        'W3Schools Bootstrap: Navbars, Dropdowns, Modals & Carousel',
      ],
    },
    {
      id: 'w3_react',
      title: 'W3Schools: REACT',
      icon: '⚛️',
      description: 'Curso oficial W3Schools React Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: REACT',
      section: 'w3schools',
      topics: [
        'W3Schools React: Intro, Render HTML & JSX Syntax',
        'W3Schools React: Components, Props, State & Events',
        'W3Schools React: Conditional Rendering, Lists & Forms',
        'W3Schools React: Hooks (useState, useEffect, useContext)',
      ],
    },
    {
      id: 'w3_mysql',
      title: 'W3Schools: MYSQL',
      icon: '🐬',
      description: 'Curso oficial W3Schools MySQL Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: MYSQL',
      section: 'w3schools',
      topics: [
        'W3Schools MySQL: SELECT, WHERE, ORDER BY & LIMIT',
        'W3Schools MySQL: INSERT, UPDATE, DELETE & Aggregate Functions',
        'W3Schools MySQL: JOINs (INNER, LEFT, RIGHT) & UNION',
      ],
    },
    {
      id: 'w3_jquery',
      title: 'W3Schools: JQUERIES',
      icon: '🔷',
      description: 'Curso oficial W3Schools jQuery Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: JQUERY',
      section: 'w3schools',
      topics: [
        'W3Schools jQuery: Selectors, Events & Effects (Hide/Show, Fade, Slide)',
        'W3Schools jQuery: HTML Manipulation, Add/Remove & CSS Classes',
        'W3Schools jQuery: AJAX (get, post, load)',
      ],
    },
    {
      id: 'w3_excel',
      title: 'W3Schools: EXCEL',
      icon: '📊',
      description: 'Curso oficial W3Schools Excel Tutorial (Top Bar W3Schools: Fórmulas, VLOOKUP, Tabelas Dinâmicas).',
      category: 'W3Schools: EXCEL',
      section: 'w3schools',
      topics: [
        'W3Schools Excel: Formatting, Cells, Ranges & Basic Formulas (SUM, AVERAGE)',
        'W3Schools Excel: IF Statements, COUNTIF & SUMIF',
        'W3Schools Excel: VLOOKUP, XLOOKUP & INDEX/MATCH',
        'W3Schools Excel: Pivot Tables, Charts & Data Analysis',
      ],
    },
    {
      id: 'w3_xml',
      title: 'W3Schools: XML',
      icon: '📄',
      description: 'Curso oficial W3Schools XML Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: XML',
      section: 'w3schools',
      topics: [
        'W3Schools XML: Tree Structure, Syntax, Elements & Attributes',
        'W3Schools XML: DTD, Schema, XPath & XSLT',
      ],
    },
    {
      id: 'w3_django',
      title: 'W3Schools: DJANGO',
      icon: '🐍',
      description: 'Curso oficial W3Schools Django Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: DJANGO',
      section: 'w3schools',
      topics: [
        'W3Schools Django: Intro, Create Project & App',
        'W3Schools Django: Views, Templates, Static Files & Models',
        'W3Schools Django: Admin Interface & Forms',
      ],
    },
    {
      id: 'w3_typescript',
      title: 'W3Schools: TYPESCRIPT',
      icon: '🔷',
      description: 'Curso oficial W3Schools TypeScript Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: TYPESCRIPT',
      section: 'w3schools',
      topics: [
        'W3Schools TypeScript: Simple Types, Special Types & Arrays',
        'W3Schools TypeScript: Tuples, Object Types & Enums',
        'W3Schools TypeScript: Interfaces, Union Types & Generics',
      ],
    },
    {
      id: 'w3_angular',
      title: 'W3Schools: ANGULAR',
      icon: '🅰️',
      description: 'Curso oficial W3Schools Angular Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: ANGULAR',
      section: 'w3schools',
      topics: [
        'W3Schools Angular: Components, Directives & Data Binding',
        'W3Schools Angular: Services, Dependency Injection & Routing',
      ],
    },
    {
      id: 'w3_git',
      title: 'W3Schools: GIT',
      icon: '🐙',
      description: 'Curso oficial W3Schools Git Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: GIT',
      section: 'w3schools',
      topics: [
        'W3Schools Git: Intro, Get Started, Commit & Branching',
        'W3Schools Git: GitHub, Remote, Push/Pull & Merging',
      ],
    },
    {
      id: 'w3_postgresql',
      title: 'W3Schools: POSTGRESQL',
      icon: '🐘',
      description: 'Curso oficial W3Schools PostgreSQL Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: POSTGRESQL',
      section: 'w3schools',
      topics: [
        'W3Schools PostgreSQL: Select, Filter, Order & Limit',
        'W3Schools PostgreSQL: Joins, Aggregates & Indexing',
      ],
    },
    {
      id: 'w3_mongodb',
      title: 'W3Schools: MONGODB',
      icon: '🍃',
      description: 'Curso oficial W3Schools MongoDB Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: MONGODB',
      section: 'w3schools',
      topics: [
        'W3Schools MongoDB: Documents, Collections, Insert & Find',
        'W3Schools MongoDB: Update, Delete, Query Operators & Aggregation',
      ],
    },
    {
      id: 'w3_asp',
      title: 'W3Schools: ASP / ASP.NET',
      icon: '🌐',
      description: 'Curso oficial W3Schools ASP.NET Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: ASP',
      section: 'w3schools',
      topics: [
        'W3Schools ASP: Razor Syntax, Web Pages & Forms',
        'W3Schools ASP.NET: MVC Architecture & Database Connection',
      ],
    },
    {
      id: 'w3_ai',
      title: 'W3Schools: AI',
      icon: '🤖',
      description: 'Curso oficial W3Schools AI Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: AI',
      section: 'w3schools',
      topics: [
        'W3Schools AI: Concepts, Machine Learning & Neural Networks',
        'W3Schools AI: Computer Vision & Natural Language Processing',
      ],
    },
    {
      id: 'w3_r',
      title: 'W3Schools: R',
      icon: '📈',
      description: 'Curso oficial W3Schools R Programming Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: R',
      section: 'w3schools',
      topics: [
        'W3Schools R: Syntax, Variables, Data Types & Vectors',
        'W3Schools R: Matrices, Data Frames, Factors & Plotting',
      ],
    },
    {
      id: 'w3_go',
      title: 'W3Schools: GO',
      icon: '🦫',
      description: 'Curso oficial W3Schools Go Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: GO',
      section: 'w3schools',
      topics: [
        'W3Schools Go: Syntax, Variables, Data Types & Arrays',
        'W3Schools Go: Slices, Conditions, Loops, Functions & Structs',
      ],
    },
    {
      id: 'w3_kotlin',
      title: 'W3Schools: KOTLIN',
      icon: '🟪',
      description: 'Curso oficial W3Schools Kotlin Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: KOTLIN',
      section: 'w3schools',
      topics: [
        'W3Schools Kotlin: Syntax, Variables, Data Types & Operators',
        'W3Schools Kotlin: If...Else, When, Loops, Functions & OOP',
      ],
    },
    {
      id: 'w3_sass',
      title: 'W3Schools: SASS',
      icon: '💖',
      description: 'Curso oficial W3Schools Sass Preprocessor Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: SASS',
      section: 'w3schools',
      topics: [
        'W3Schools Sass: Variables, Nesting & Import',
        'W3Schools Sass: Mixins, Extend & Functions',
      ],
    },
    {
      id: 'w3_vue',
      title: 'W3Schools: VUE',
      icon: '🟢',
      description: 'Curso oficial W3Schools Vue.js Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: VUE',
      section: 'w3schools',
      topics: [
        'W3Schools Vue: Directives (v-bind, v-if, v-for), Methods & Computed',
        'W3Schools Vue: Components, Props & Events',
      ],
    },
    {
      id: 'w3_dsa',
      title: 'W3Schools: DSA (Data Structures & Algorithms)',
      icon: '🧠',
      description: 'Curso oficial W3Schools DSA Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: DSA',
      section: 'w3schools',
      topics: [
        'W3Schools DSA: Arrays, Linked Lists, Stacks & Queues',
        'W3Schools DSA: Bubble Sort, QuickSort, MergeSort & Binary Search',
        'W3Schools DSA: Hash Tables, Trees & Graphs',
      ],
    },
    {
      id: 'w3_genai',
      title: 'W3Schools: GEN AI',
      icon: '✨',
      description: 'Curso oficial W3Schools Generative AI Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: GEN AI',
      section: 'w3schools',
      topics: [
        'W3Schools Gen AI: Intro to Generative AI & Large Language Models',
        'W3Schools Gen AI: Prompt Engineering & Fine-Tuning Principles',
      ],
    },
    {
      id: 'w3_cybersecurity',
      title: 'W3Schools: CYBERSECURITY',
      icon: '🛡️',
      description: 'Curso oficial W3Schools Cyber Security Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: CYBERSECURITY',
      section: 'w3schools',
      topics: [
        'W3Schools Cyber Security: Threats, Attacks & Web Vulnerabilities',
        'W3Schools Cyber Security: Protection, Encryption & Authentication',
      ],
    },
    {
      id: 'w3_datascience',
      title: 'W3Schools: DATA SCIENCE',
      icon: '📊',
      description: 'Curso oficial W3Schools Data Science Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: DATA SCIENCE',
      section: 'w3schools',
      topics: [
        'W3Schools Data Science: Data Cleaning, Preparation & Analysis',
        'W3Schools Data Science: Statistics, Probability & Plotting',
      ],
    },
    {
      id: 'w3_numpy',
      title: 'W3Schools: NUMPY',
      icon: '📐',
      description: 'Curso oficial W3Schools NumPy Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: NUMPY',
      section: 'w3schools',
      topics: [
        'W3Schools NumPy: Array Creation, Indexing, Slicing & Data Types',
        'W3Schools NumPy: Copy vs View, Shape, Reshape & Array Join/Split',
      ],
    },
    {
      id: 'w3_pandas',
      title: 'W3Schools: PANDAS',
      icon: '🐼',
      description: 'Curso oficial W3Schools Pandas Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: PANDAS',
      section: 'w3schools',
      topics: [
        'W3Schools Pandas: DataFrames, Series, Read CSV & Read JSON',
        'W3Schools Pandas: Cleaning Data, Correlations & Plotting',
      ],
    },
    {
      id: 'w3_scipy',
      title: 'W3Schools: SCIPY',
      icon: '🔬',
      description: 'Curso oficial W3Schools SciPy Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: SCIPY',
      section: 'w3schools',
      topics: [
        'W3Schools SciPy: Optimizers, Sparse Data, Graphs & Spatial Data',
      ],
    },
    {
      id: 'w3_rust',
      title: 'W3Schools: RUST',
      icon: '🦀',
      description: 'Curso oficial W3Schools Rust Tutorial (Top Bar W3Schools).',
      category: 'W3Schools: RUST',
      section: 'w3schools',
      topics: [
        'W3Schools Rust: Syntax, Variables, Data Types & Functions',
        'W3Schools Rust: Ownership, Borrowing & Structs/Enums',
      ],
    },
  ]);

  filteredRoadmaps = computed(() => {
    const search = this.roadmapSearch().trim().toLowerCase();
    const sec = this.selectedRoadmapSection();
    let list = this.roadmaps();

    if (sec !== 'all') {
      list = list.filter((r) => r.section === sec);
    }

    if (search) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search) ||
          r.topics.some((t) => t.toLowerCase().includes(search))
      );
    }

    return list;
  });

  // Bulk Text Parser State
  rawPasteText = '';
  parsedCategories = signal<CategoryEntry[]>([]);

  // Manual Creation State
  categories = signal<CategoryEntry[]>([
    { name: 'JavaScript Avançado', tasks: ['Promises e Async/Await', 'Event Loop & Closures', 'ES6+ Modules'] },
  ]);

  // Quick Subject Preset Generator
  quickPresets = [
    { name: 'SQL & Banco de Dados', tasks: ['Queries SELECT e JOIN', 'Indexação B-Tree', 'Transações e ACID', 'Modelagem Entidade-Relacionamento'] },
    { name: 'Docker & Containers', tasks: ['Comandos de Imagem e Container', 'Criação de Dockerfile', 'Docker Compose e Redes', 'Volumes e Persistência'] },
    { name: 'Ruby on Rails', tasks: ['Arquitetura MVC no Rails', 'Mapeamento Active Record', 'Migrations e Controllers', 'Jobs Assíncronos Sidekiq'] },
    { name: 'W3Schools How TO', tasks: ['Responsive Navigation Bars', 'Modals & Tooltips', 'Carousels & Lightboxes', 'Accordions & Tabs'] },
  ];

  applyQuickPreset(preset: { name: string; tasks: string[] }): void {
    this.categories.update((list) => [
      ...list,
      { name: preset.name, tasks: [...preset.tasks] },
    ]);
    this.toast.success(`Matéria "${preset.name}" preenchida automaticamente! ⚡`);
  }

  // 1-Click Instant Import for Roadmaps
  importRoadmapPreset(preset: RoadmapPreset): void {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.toast.error('Usuário não autenticado');
      return;
    }

    this.saving.set(true);

    const payload = [
      {
        category: preset.category,
        tasks: preset.topics,
      },
    ];

    this.api.importFileStructure(payload, userId).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Conteúdo "${preset.title}" importado com ${preset.topics.length} tópicos! 🚀`);
      },
      error: () => {
        this.fallbackImport(payload, userId);
      },
    });
  }

  private fallbackImport(payload: { category: string; tasks: string[] }[], userId: string): void {
    let completed = 0;
    payload.forEach((item) => {
      this.api.createSubject({ name: item.category, description: 'Importado do Importer' }).subscribe({
        next: (subj) => {
          item.tasks.forEach((t) => {
            this.api.createTask(
              {
                title: t,
                status: 'pending',
                priority: 'medium',
                subjectId: subj.id,
                skillCategory: item.category,
              },
              userId
            ).subscribe();
          });
          completed++;
          if (completed === payload.length) {
            this.saving.set(false);
            this.toast.success(`Conteúdo importado com sucesso via Fallback! 🚀`);
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Erro ao importar conteúdo.');
        },
      });
    });
  }

  // Automatic Text Parser
  parseTextAutomatically(): void {
    const text = this.rawPasteText.trim();
    if (!text) {
      this.parsedCategories.set([]);
      return;
    }

    const lines = text.split('\n');
    const result: CategoryEntry[] = [];
    let currentCat: CategoryEntry | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const isTaskLine = /^[-\*•]|\d+\.|\s{2,}/.test(line);

      if (isTaskLine && currentCat) {
        const cleanTask = trimmed.replace(/^[-\*•]\s*|\d+\.\s*/, '');
        if (cleanTask) {
          currentCat.tasks.push(cleanTask);
        }
      } else {
        const cleanCategory = trimmed.replace(/:$/, '');
        currentCat = { name: cleanCategory, tasks: [] };
        result.push(currentCat);
      }
    });

    this.parsedCategories.set(result);
  }

  importParsedText(): void {
    const payload = this.parsedCategories()
      .filter((c) => c.name.trim())
      .map((c) => ({
        category: c.name.trim(),
        tasks: c.tasks.filter((t) => t.trim()),
      }))
      .filter((c) => c.tasks.length > 0);

    if (payload.length === 0) {
      this.toast.error('Nenhuma matéria ou tarefa válida detectada no texto.');
      return;
    }

    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.api.importFileStructure(payload, userId).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`${payload.length} matérias e tarefas importadas automaticamente! 🎉`);
        this.rawPasteText = '';
        this.parsedCategories.set([]);
      },
      error: () => {
        this.fallbackImport(payload, userId);
      },
    });
  }

  // Manual Category Helpers
  addCategory(): void {
    this.categories.update((list) => [...list, { name: '', tasks: [''] }]);
  }

  removeCategory(index: number): void {
    this.categories.update((list) => list.filter((_, i) => i !== index));
  }

  addTask(catIndex: number): void {
    this.categories.update((list) => {
      const updated = [...list];
      updated[catIndex] = { ...updated[catIndex], tasks: [...updated[catIndex].tasks, ''] };
      return updated;
    });
  }

  removeTask(catIndex: number, taskIndex: number): void {
    this.categories.update((list) => {
      const updated = [...list];
      updated[catIndex] = {
        ...updated[catIndex],
        tasks: updated[catIndex].tasks.filter((_, i) => i !== taskIndex),
      };
      return updated;
    });
  }

  get validPayload(): { category: string; tasks: string[] }[] {
    return this.categories()
      .filter((c) => c.name.trim())
      .map((c) => ({
        category: c.name.trim(),
        tasks: c.tasks.filter((t) => t.trim()),
      }))
      .filter((c) => c.tasks.length > 0);
  }

  importStudies(): void {
    const payload = this.validPayload;
    if (payload.length === 0) {
      this.toast.error('Adicione pelo menos uma categoria com tarefas');
      return;
    }
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.api.importFileStructure(payload, userId).subscribe({
      next: () => {
        this.toast.success(`${payload.length} categorias importadas com sucesso!`);
        this.categories.set([]);
        this.saving.set(false);
      },
      error: () => {
        this.fallbackImport(payload, userId);
      },
    });
  }
}
