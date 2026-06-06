# Auditoria Completa: Strong Together Run Club

A auditoria identificou e corrigiu **todos os 5 bugs reportados**, além de descobrir **5 problemas críticos adicionais** que afetavam silenciosamente a estabilidade da aplicação. O código foi validado com testes de build (`npm run build`), lint (`npm run lint`) e testes de integração end-to-end com o banco de dados de produção do Supabase.

Abaixo está o detalhamento de cada problema e sua respectiva solução, já aplicada na branch `main`.

---

## 1. Bugs Reportados

### Bug 1: Erro no upload do Avatar
O código do componente de upload estava configurado corretamente para o bucket `avatars` com `upsert: true`. O problema estava na política de *Row Level Security* (RLS) do Supabase Storage. A política de `UPDATE` exigia que o usuário fosse o `owner` original do arquivo, o que falhava quando o usuário tentava sobrescrever a foto, pois o `owner` poderia ser `null` ou não corresponder durante o upsert.
**Solução:** Foi criada a *Migration 004*, que substitui a checagem do `owner` por uma validação do prefixo do caminho do arquivo (`(storage.foldername(name))[1] = auth.uid()::text`). Isso garante que o usuário sempre possa sobrescrever arquivos dentro de sua própria pasta.

### Bug 2: Race condition no botão "Skip" do Onboarding
O botão "Skip for now" não avançava corretamente. Isso ocorria porque a função `handleSkip` tentava executar um `upsert` na tabela `profiles` antes que o `userId` estivesse disponível no estado do componente, resultando em uma operação silenciosamente ignorada.
**Solução:** O `useEffect` foi refatorado para garantir que a interface aguarde a resolução do `userId`. A função `handleSkip` agora verifica explicitamente a existência do `userId` antes de prosseguir e inclui tratamento de erro (try/catch) para evitar falhas silenciosas.

### Bug 3: Input de foto "travado" após seleção
No Step 1 do onboarding, se o usuário selecionasse uma foto, cancelasse e tentasse selecionar a mesma foto novamente, o navegador não disparava o evento `onChange`, pois o valor do input (`<input type="file">`) não havia mudado.
**Solução:** O valor do input foi resetado manualmente (`e.target.value = ''`) ao final da função `handleFileChange`. Além disso, foi adicionada uma propriedade `key` dinâmica ao input para forçar a re-renderização do componente após a seleção, garantindo que o ciclo de vida do React acompanhe o estado do DOM.

### Bug 4a: Dashboard não redirecionava usuários sem perfil
O `dashboard/page.tsx` verificava se `profile.onboarding_complete` era verdadeiro, mas falhava em tratar o caso onde `profile` era `null` (quando a trigger de criação de usuário falhava ou o usuário pulava etapas cruciais). Isso resultava em um dashboard quebrado mostrando "Runner" como fallback, em vez de forçar o usuário a completar o cadastro.
**Solução:** A lógica de redirecionamento no servidor foi ajustada. Agora, se `profile` for `null` ou `profile.onboarding_complete` for falso, o usuário é imediatamente redirecionado para a rota `/onboarding`.

### Bug 4b: Dados do Onboarding não persistiam
O botão "Let's Run" executava o `upsert` final, mas os dados não eram salvos no banco. A causa raiz era que as colunas necessárias (`display_name`, `goals`, `badges`) haviam sido definidas na *Migration 003*, mas essa migração **nunca havia sido aplicada no banco de dados de produção**. O PostgREST falhava silenciosamente porque a aplicação não logava o erro do Supabase.
**Solução:** A *Migration 003* foi aplicada manualmente via Supabase SQL Editor. O código do `handleFinish` foi refatorado para não engolir erros silenciosamente, adicionando logs e validações de sucesso antes de redirecionar o usuário.

---

## 2. Bugs Críticos Ocultos (Descobertos na Auditoria)

Durante a revisão e os testes de integração end-to-end, os seguintes problemas não reportados foram identificados e corrigidos:

### Bug Extra 1: Avatar e Nome dessincronizados no Header
O componente `Header.tsx` e o formulário `RSVPForm.tsx` estavam lendo o nome e a foto diretamente dos metadados de autenticação do Google (`user.user_metadata`), em vez de ler da tabela `profiles`. Como o onboarding atualiza apenas a tabela `profiles`, as alterações feitas pelo usuário nunca refletiam na interface principal.
**Solução:** Os componentes foram alterados para ler `avatar_url` e `display_name` diretamente da tabela `profiles`, garantindo consistência de dados em toda a aplicação.

### Bug Extra 2: Documentação de Setup Incompleta
O arquivo `README.md` não mencionava a *Migration 003*, fazendo com que qualquer novo desenvolvedor que clonasse o repositório ficasse com o banco de dados quebrado, replicando o Bug 4b localmente.
**Solução:** As instruções de setup no `README.md` foram atualizadas para incluir a ordem exata e a descrição de todas as migrações necessárias.

### Bug Extra 3: Erro 42703 (Coluna `bio` inexistente)
Durante o teste end-to-end do fluxo completo de onboarding, o dashboard falhou ao carregar, retornando um erro de RLS (perfil nulo). A investigação dos logs do servidor Next.js revelou o erro PostgREST `42703 column profiles.bio does not exist`. A coluna `bio` era referenciada no Step 2 do onboarding, no Dashboard e no Perfil, mas **nunca havia sido criada em nenhuma migração anterior**.
**Solução:** Foi criada e aplicada a *Migration 005*, adicionando a coluna `bio text` à tabela `profiles`. O arquivo principal `schema.sql` também foi atualizado para refletir a estrutura canônica correta.

### Bug Extra 4: Código Morto no Auth Callback
O arquivo `app/page.tsx` continha a montagem do componente `AuthCodeHandler`, que estava obsoleto. O fluxo OAuth atual utiliza a rota server-side `/api/auth/callback` para trocar o código PKCE por uma sessão.
**Solução:** O código morto foi removido para evitar confusão arquitetural e melhorar a performance de renderização da homepage.

### Bug Extra 5: Problemas de Lint
O código-fonte continha variáveis declaradas com `let` que nunca sofriam reatribuição, imports não utilizados (como a variável `router` no cliente de check-in) e definições de tipos ociosas. Esses problemas geravam avisos indesejados durante a compilação do Next.js.
**Solução:** As variáveis `let` em `app/admin/page.tsx` e `app/page.tsx` foram convertidas para `const`, e os imports e tipos não utilizados foram removidos dos arquivos afetados.

---

## Conclusão

O repositório agora está estável. O fluxo de registro (Google OAuth) -> Onboarding (4 passos) -> Dashboard -> Perfil foi testado com sucesso contra o banco de dados de produção. O build de produção compila sem erros de TypeScript e o linter (`eslint`) não reporta mais avisos sobre variáveis não utilizadas ou tipagens incorretas.

As alterações já foram commitadas e enviadas para a branch `main`.
