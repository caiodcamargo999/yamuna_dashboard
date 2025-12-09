const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');

// 1. PREENCHA AQUI COM OS DADOS DO SEU "ID DO CLIENTE OAUTH"
// (Crie em: Google Cloud > Credenciais > Criar Credenciais > ID do cliente do OAuth > App para Desktop)
const CLIENT_ID = 'SEU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'SEU_CLIENT_SECRET_AQUI';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Escopos necessários para ler o Analytics
const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

console.log('--- GERADOR DE REFRESH TOKEN GOOGLE ---');
console.log('1. Certifique-se de ter criado uma credencial "ID do cliente do OAuth" (Tipo Desktop) no Google Cloud.');
console.log('2. Edite este arquivo e coloque seu CLIENT_ID e CLIENT_SECRET no topo.');

if (CLIENT_ID === 'SEU_CLIENT_ID_AQUI') {
    console.error('\n[ERRO] Você precisa editar o arquivo scripts/auth-google.js e colocar suas credenciais primeiro!');
    process.exit(1);
}

// Servidor temporário para receber o código
const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/oauth2callback')) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        res.end('Autenticacao OK! Pode fechar esta janela e olhar o terminal.');
        server.close();

        console.log(`\nCódigo recebido: ${code}`);
        console.log('Trocando código por tokens...');

        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n----------------------------------------');
        console.log('SUCESSO! Copie e salve estas chaves no seu .env.local:');
        console.log('----------------------------------------');
        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('----------------------------------------\n');
        process.exit(0);
    }
}).listen(3000);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});

console.log(`\n3. Abra este link no navegador para autorizar: \n${authUrl}`);
