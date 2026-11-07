# RP Modas Cereja · Lingerie

Catálogo com **Python/FastAPI + SQLite**, HTML, CSS e JavaScript separados, preto, vinho profundo e dourado, e pedidos pelo WhatsApp. Não depende de Node, npm, Vite ou Next.js.

Esta versão acrescenta busca e filtros, login, redes sociais opcionais, categorias editáveis, dashboard e uma animação discreta de texto.

## Primeira execução no Windows

Instale Python 3.10 ou superior. Extraia o ZIP e abra o terminal na pasta que contém `server.py`:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
# Apenas na primeira instalação, se o .env ainda não existir:
Copy-Item .env.example .env
# Edite .env e preencha ADMIN_PASSWORD antes de iniciar.
.venv\Scripts\python.exe server.py
```

Preencha `ADMIN_PASSWORD` no `.env` com uma senha de pelo menos 8 caracteres. Preserve o `.env` se já existir. Não é necessário ativar o ambiente virtual.

- Loja: http://localhost:8000
- Admin: http://localhost:8000/admin
- Login: http://localhost:8000/admin/login
- Estado: http://localhost:8000/health
- Documentação da API: http://localhost:8000/api/docs

Mantenha o terminal aberto. Para parar, pressione **Ctrl+C**. Nas próximas execuções, basta usar `.venv\Scripts\python.exe server.py`.

Linux/macOS:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
# Apenas se o .env ainda não existir; depois, edite ADMIN_PASSWORD:
cp .env.example .env
.venv/bin/python server.py
```

Execute `server.py`: um servidor estático como `python -m http.server` não executa o banco nem a API.

## Atualizar a instalação anterior

Pare o servidor e faça um backup de toda a pasta `data`. Atualize os arquivos do código, **preserve a sua pasta `data` e o `.env`**, instale novamente `requirements.txt` e confira as variáveis de ambiente. Depois, inicie o servidor.

As novas tabelas são criadas automaticamente. Produtos, fotos e configurações anteriores continuam no banco. O catálogo inicial é inserido uma única vez; excluir todas as peças não faz os exemplos reaparecerem.

## Ambiente e login

O `.env` é carregado pelo caminho absoluto da raiz, antes da escolha do diretório dos dados. Variáveis já definidas pela hospedagem têm prioridade sobre o arquivo.

Para configurar manualmente, copie `.env.example` para `.env` e preencha:

```dotenv
ADMIN_PASSWORD=sua-senha
COOKIE_SECURE=false
HOST=127.0.0.1
PORT=8000
```

Substitua `sua-senha` pela sua senha real, com pelo menos 8 caracteres. Sem uma senha válida, o servidor interrompe a inicialização. O `.env` real fica fora do ZIP, do Git e da imagem Docker.

O admin usa sessões de até **8 horas**, com cookie HttpOnly e SameSite strict. O token é aleatório e só seu hash fica no banco. As alterações administrativas exigem o token CSRF da sessão. A senha nunca é retornada pela API pública.

**Sair** revoga a sessão no servidor. Reiniciar também exige um novo login. Para trocar a senha, edite `ADMIN_PASSWORD` e reinicie. Depois de 10 tentativas erradas por endereço de origem em uma janela de 10 minutos, novas tentativas são bloqueadas até essa janela expirar.

Em HTTPS, configure `COOKIE_SECURE=true`. Para HTTP em localhost, deixe `false`.

Além da proteção específica do login, a API possui limite em memória por IP: 120 requisições por minuto nas leituras públicas e no painel, 60 visualizações de produto por minuto e 20 preparos de pedido por minuto. Ao atingir o limite, a API responde `429` e informa `Retry-After`. Em uma instalação com várias instâncias, use um limitador compartilhado (como Redis) para que o limite seja global.

## Busca e filtros da loja

A busca procura pelo nome da peça, sem diferenciar acentos, maiúsculas ou minúsculas. Combine categoria, preço mínimo/máximo, tamanho, cor e somente peças disponíveis. Os preços aceitam valores como `129,90`.

Ordene por destaques, menor preço, maior preço ou nome. **Limpar filtros** restaura a coleção. O texto discreto abaixo do botão da coleção é escrito e apagado em um ciclo suave; fica estático com a preferência de movimento reduzido e pausa quando a aba fica oculta.

## Dashboard

Disponível depois do login, junto com **Peças** e **Configurações**:

- Quantidade de peças no catálogo.
- Total de unidades em estoque, sem representar vendas.
- Preço médio dos produtos publicados, sem ponderar pela quantidade em estoque.
- Visualizações nos últimos 14 dias, com gráfico por dia.
- Peças mais vistas nos últimos 14 dias.
- Peças com mais unidades em estoque.
- Estoque por categoria.

Uma visualização é registrada quando o visitante **abre os detalhes de uma peça**. O mesmo navegador, na mesma peça e no mesmo dia UTC, conta uma vez. Acessos feitos com uma sessão administrativa válida não entram na contagem.

A identificação usa um cookie aleatório. As métricas são aproximações por navegador: limpar cookies, usar outro navegador ou acessos automatizados podem alterar os números. O gráfico começa com zeros e não inventa histórico. Os dias são agrupados em UTC, indicado no painel. **Atualizar** consulta novamente as métricas.

Não há cálculo de faturamento, conversão, quantidade vendida ou vendas confirmadas: os pedidos são combinados no WhatsApp.

## Peças

Cadastre e edite nome, categoria, cor, descrição, preço, preço anterior opcional, tamanhos, estoque, foto, publicação e destaque.

- **Foto:** JPG, PNG ou WebP de até 5 MB e 25 megapixels; envie um arquivo ou use uma URL HTTP/HTTPS.
- **Tamanhos:** separe por vírgulas, como `P, M, G, GG` ou `40, 42, 44`.
- **Estoque:** total da peça, somando os tamanhos. Esta versão não separa estoque por tamanho.
- **Na vitrine:** aparece na loja. **Rascunho:** fica apenas no painel.
- **Estoque zero:** mantém a peça visível como esgotada, sem permitir pedidos.
- **Destacar:** coloca a peça antes das outras e adiciona uma pequena etiqueta.
- **Duplicar:** cria uma cópia como rascunho, sem copiar visualizações.
- **Excluir:** remove a peça após confirmação, incluindo suas métricas.
- **Exportar:** salva um JSON com produtos e nomes das categorias.
- **Importar:** substitui a coleção após confirmação e validação completa, cadastrando as categorias necessárias. As novas peças recebem novas identidades e as visualizações da coleção anterior são removidas.

As fotos, os nomes e os preços iniciais são demonstrativos. Substitua-os pelos produtos reais. Há busca por nome, categoria ou cor e filtros por publicação e estoque no painel.

## Configurações e categorias

**Marca e WhatsApp:** configure o nome e o telefone com código do país e DDD. No Brasil, use `55` + DDD + número. Nenhum destinatário real vem cadastrado.

**Instagram e TikTok:** informe o @usuário ou a URL HTTPS do perfil da própria rede e habilite cada botão separadamente. Os botões aparecem no rodapé somente quando a rede está habilitada e tem perfil. Desabilitar o botão preserva o perfil preenchido.

**Categorias:** adicione e exclua categorias. Se uma categoria tiver peças, escolha outra para recebê-las antes de excluir. A transferência preserva as peças e suas visualizações. Para excluir a última categoria usada, primeiro crie outra ou remova suas peças. Uma peça precisa de uma categoria cadastrada.

## Sacola e WhatsApp

O cliente escolhe tamanho e quantidade. **Pedir só esta peça** prepara apenas essa seleção. **Adicionar à sacola** permite continuar escolhendo, alterar quantidades e remover itens; a sacola mostra o total.

O Python verifica os preços atuais, publicação, tamanhos e estoque antes de gerar a mensagem, inclusive a soma da mesma peça em tamanhos diferentes. A mensagem contém peças, cores, tamanhos, quantidades, subtotais e total. O frete fica a combinar.

O cliente confirma o envio no WhatsApp. Abrir a conversa não confirma uma venda, não registra pagamento e não reserva nem reduz estoque. Atualize o estoque após confirmar uma venda.

Produtos, fotos, categorias, redes e métricas são compartilhados por quem acessa o mesmo servidor. Sacola e tema ficam no navegador. Recarregar ou voltar à aba da loja atualiza o catálogo.

## Persistência e backup

O SQLite já faz parte do Python; não é necessário instalar um servidor de banco de dados. O arquivo é criado automaticamente ao iniciar `server.py`. Para criar ou verificar o banco sem iniciar a aplicação, execute na pasta do projeto:

```powershell
python init_db.py
```

Se você usa o ambiente virtual, execute `.venv\Scripts\python.exe init_db.py`. O comando carrega o `.env`, cria as tabelas que faltarem e verifica a integridade do banco. Pode ser executado novamente: preserva os dados existentes e as sessões administrativas. Os produtos de exemplo são inseridos somente na primeira inicialização.

```text
data/
  cereja.sqlite3
  uploads/
```

Para um backup completo, pare o servidor e copie **toda a pasta `data`**, além de guardar seu `.env` de forma privada. O JSON exportado não contém fotos, configurações nem histórico de visualizações.

Fotos removidas de uma peça permanecem na pasta para preservar outras referências e backups. Defina `CEREJA_DATA_DIR` no `.env` se quiser guardar os dados em outro diretório ou disco persistente:

```dotenv
CEREJA_DATA_DIR=E:\cereja-dados
```

## Estrutura

```text
projeto_aghata/
  backend/
    main.py               criação e composição da aplicação FastAPI
    core/                 configuração, middleware, erros e rate limit
    routes/               endpoints HTTP separados por funcionalidade
      router.py           composição da API pública e do admin
      dependencies.py     autenticação e proteção CSRF
      pages.py            rotas das páginas do frontend
      products.py         produtos públicos e administrativos
      categories.py       categorias
      settings.py         configurações da loja
      auth.py             login, sessão e logout
      analytics.py        visualizações e dashboard
      catalog.py          importação e exportação
      checkout.py         preparo do pedido por WhatsApp
      uploads.py          envio de fotos
      health.py           estado da aplicação e do banco
    services/             regras de negócio e limites das transações
    repositories/         consultas SQL e acesso aos dados
    schemas/              contratos e validação das entradas com Pydantic
    db/
      session.py          conexão e transações SQLite
      schema.py           criação das tabelas e inicialização
      seed.json           catálogo demonstrativo
    cli/                  comandos administrativos
  frontend/
    pages/
      index.html          página da loja
      admin/index.html    página do painel
      admin/login.html    página de login
    static/
      css/                estilos públicos
      js/                 scripts da loja, login e funções compartilhadas
      assets/             imagens e ícones
    admin-assets/
      css/                estilos do painel
      js/                 scripts do painel
  tests/                  testes do banco e dos fluxos HTTP
  data/                   banco SQLite e uploads persistentes
  server.py               atalho para iniciar o backend
  init_db.py              atalho para criar e verificar o banco
  requirements.txt        dependências da aplicação
  requirements-dev.txt    dependências para executar os testes
  .env.example            modelo das variáveis de ambiente
```

O fluxo do backend é **rota → serviço → repositório → SQLite**. Rotas recebem os dados HTTP e chamam serviços; serviços aplicam as regras e controlam as transações; repositórios concentram as consultas SQL. Os schemas validam as entradas antes de qualquer alteração no banco.

Os endpoints existentes continuam em `/api/...` e `/api/admin/...`. O grupo administrativo recebe autenticação e CSRF em um único ponto de `routes/router.py`. As páginas ficam no frontend e são entregues pelas rotas de `routes/pages.py`. Os arquivos públicos usam `/static`; os assets do painel usam `/admin-assets` e exigem sessão. O diretório inteiro do frontend não é exposto como servidor estático.

Para adicionar uma funcionalidade, crie o schema, o repositório e o serviço conforme necessário; adicione seu módulo de rotas ao agregador em `backend/routes/router.py`. A documentação em `/api/docs` agrupa os endpoints por funcionalidade.

Os caminhos do frontend, do `.env` e do banco são resolvidos a partir da raiz do projeto. Um `CEREJA_DATA_DIR` relativo também usa essa raiz. A organização do código não muda o arquivo existente em `data/cereja.sqlite3`.

## Hospedar

É necessária uma hospedagem Python. Enviar apenas `frontend` para uma hospedagem estática não executa o banco nem a API.

Instale `requirements.txt`, configure `ADMIN_PASSWORD`, use HTTPS com `COOKIE_SECURE=true` e um disco persistente em `CEREJA_DATA_DIR`:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Também pode executar `python server.py`, com `HOST=0.0.0.0` e a variável `PORT` fornecida pela hospedagem. Se houver um proxy HTTPS, configure o Uvicorn para confiar apenas nos cabeçalhos dos proxies da infraestrutura, permitindo reconhecer o esquema HTTPS na verificação de origem.

Execute uma única instância com este SQLite local. Réplicas sem disco compartilhado não têm o mesmo catálogo. Com Docker, monte um volume em `/app/data` e forneça as variáveis na execução, sem colocar a senha na imagem.

## Verificação

Execute os testes na raiz do projeto:

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

Os testes usam bancos e uploads temporários. Cobrem persistência e rollback, catálogo, login e CSRF, páginas e assets, categorias, importação/exportação, métricas, fotos e preparo de pedidos. Não enviam mensagens pelo WhatsApp.

Referências: [python-dotenv](https://pypi.org/project/python-dotenv/), [cookies no Starlette](https://www.starlette.io/responses/), [arquivos no FastAPI](https://fastapi.tiangolo.com/tutorial/request-files/) e [WhatsApp](https://faq.whatsapp.com/5913398998672934/?locale=pt_BR).
