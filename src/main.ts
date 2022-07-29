// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que:
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction

let apiKey: string | null;
let username: string | null;
let password: string | null;
let requestToken: string | null;
let sessionId: string | null;
let listId = "8212027";

const loginButton = document.getElementById(
  "login-button"
) as HTMLButtonElement;
const searchButton = document.getElementById(
  "search-button"
) as HTMLButtonElement;
const searchContainer = document.getElementById(
  "search-container"
) as HTMLDivElement;

const inputApi = document.getElementById("api-key") as HTMLInputElement;
const inputLogin = document.getElementById("login") as HTMLInputElement;
const inputSenha = document.getElementById("senha") as HTMLInputElement;
const inputQuery = document.getElementById("search") as HTMLInputElement;

inputApi.value = apiKey;
inputLogin.value = username;
inputSenha.value = password;
inputSenha.addEventListener("change", preencherSenha);
inputLogin.addEventListener("change", preencherLogin);
inputApi.addEventListener("change", preencherApi);

loginButton.addEventListener("click", async () => {
  await criarRequestToken();
  await logar();
  await criarSessao();
});

searchButton.addEventListener("click", async () => {
  let lista = document.getElementById("lista");
  if (lista) {
    lista.outerHTML = "";
  }
  let query = inputQuery.value;
  let listaDeFilmes = await procurarFilme(query);
  if (listaDeFilmes) {
    let ul = document.createElement("ul");
    ul.id = "lista";
    for (const item of listaDeFilmes.results) {
      let li: HTMLLIElement = document.createElement("li");

      li.setAttribute(
        "style",
        "display: flex;flex-direction: row;justify-content: space-between;"
      );

      let button: HTMLButtonElement = document.createElement("button");

      button.innerText = "Adicionar";
      button.addEventListener("click", async (e: Event) => {
        const thisbutton = e.target as HTMLButtonElement;
        let movieId: string | null = (<HTMLElement>(
          (<HTMLElement>e.target).parentNode
        )).id;
        await adicionarFilmeNaLista(Number(movieId), Number(listId));
        thisbutton.innerText = "Adicionado";
        thisbutton.disabled = true;
      });

      li.appendChild(document.createTextNode(item.original_title));
      li.appendChild(button);
      li.id = item.id.toString();
      ul.appendChild(li);
    }
    console.log(listaDeFilmes);
    searchContainer.appendChild(ul);
  }
});

function preencherSenha() {
  password = inputSenha.value;
  validateLoginButton();
}

function preencherLogin() {
  username = inputLogin.value;
  validateLoginButton();
}

function preencherApi() {
  apiKey = inputApi.value;
  validateLoginButton();
}

function validateLoginButton() {
  console.log(apiKey, username, password);
  if (password && username && apiKey) {
    loginButton.disabled = false;
  } else {
    loginButton.disabled = true;
  }
}

class HttpClient {
  static async get({
    url,
    method,
    body = null,
  }: {
    url: string;
    method: string;
    body?: any;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open(method, url, true);

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject({
            status: request.status,
            statusText: request.statusText,
          });
        }
      };
      request.onerror = () => {
        reject({
          status: request.status,
          statusText: request.statusText,
        });
      };

      if (body) {
        request.setRequestHeader(
          "Content-Type",
          "application/json;charset=UTF-8"
        );
        body = JSON.stringify(body);
      }
      request.send(body);
    });
  }
}

async function procurarFilme(query: string): Promise<{
  results: [{ title: string; original_title: string; id: number }];
} | null> {
  query = encodeURI(query);
  console.log(query);
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
    method: "GET",
  });
  return result;
}

async function adicionarFilme(filmeId: string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
    method: "GET",
  });
  console.log(result);
}

async function criarRequestToken() {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
    method: "GET",
  });
  requestToken = result.request_token;
  console.log("requestToken", requestToken);
}

async function logar() {
  await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
    method: "POST",
    body: {
      username: `${username}`,
      password: `${password}`,
      request_token: `${requestToken}`,
    },
  });
}

async function criarSessao() {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
    method: "GET",
  });
  sessionId = result.session_id;
  loginButton.textContent = "Login realizado com sucesso";
  loginButton.disabled = true;
}

async function criarLista(nomeDaLista: string, descricao?: string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      name: nomeDaLista,
      description: descricao,
      language: "pt-br",
    },
  });
  console.log(result);
}

async function adicionarFilmeNaLista(filmeId: number, listaId: number) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      media_id: filmeId,
    },
  });
  console.log(result);
}

async function pegarLista() {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
    method: "GET",
  });
  console.log(result);
}
