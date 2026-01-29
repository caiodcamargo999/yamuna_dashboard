/**
 * SCRIPT SIMPLIFICADO PARA RENOVAR O GOOGLE REFRESH TOKEN
 * 
 * Este script NÃO precisa de servidor local!
 * Use o Google OAuth Playground para gerar o token.
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   RENOVAR GOOGLE REFRESH TOKEN - GUIA PASSO A PASSO           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Suas credenciais atuais:\n');
console.log('   CLIENT_ID: 735005026704-urfnm43lo56kkofuu4p47d71il66ckq2.apps.googleusercontent.com');
console.log('   CLIENT_SECRET: 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\n');

console.log('🔧 PASSO 1: Abra o OAuth 2.0 Playground');
console.log('   → https://developers.google.com/oauthplayground/\n');

console.log('🔧 PASSO 2: Configure suas credenciais');
console.log('   → Clique no ícone de ENGRENAGEM (⚙️) no canto superior direito');
console.log('   → Marque a opção: "Use your own OAuth credentials"');
console.log('   → Cole as credenciais acima\n');

console.log('🔧 PASSO 3: Selecione o escopo');
console.log('   → No campo "Input your own scopes", cole:');
console.log('   → https://www.googleapis.com/auth/analytics.readonly');
console.log('   → Clique em "Authorize APIs"\n');

console.log('🔧 PASSO 4: Autorize');
console.log('   → Faça login com: caiomilennials@gmail.com');
console.log('   → Aceite todas as permissões\n');

console.log('🔧 PASSO 5: Gere o token');
console.log('   → Clique em "Exchange authorization code for tokens"');
console.log('   → Copie o REFRESH TOKEN que aparece\n');

console.log('🔧 PASSO 6: Cole o token aqui');
console.log('   → Quando solicitado, cole o refresh token e pressione ENTER\n');

console.log('═══════════════════════════════════════════════════════════════\n');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('📝 Cole o REFRESH TOKEN aqui e pressione ENTER: ', (refreshToken) => {
    refreshToken = refreshToken.trim();

    if (!refreshToken || refreshToken.length < 20) {
        console.log('\n❌ Token inválido! O refresh token deve ter mais de 20 caracteres.');
        console.log('   Por favor, copie o token completo do OAuth Playground.\n');
        process.exit(1);
    }

    // Save to .new-google-token.json
    const tokenData = {
        GOOGLE_CLIENT_ID: '735005026704-urfnm43lo56kkofuu4p47d71il66ckq2.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: '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',
        GOOGLE_REFRESH_TOKEN: refreshToken
    };

    const tokenPath = path.join(__dirname, '..', '.new-google-token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));

    console.log('\n✅ Token salvo com sucesso em: .new-google-token.json\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Agora atualize seu .env.local com esta linha:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✨ Depois de atualizar o .env.local, reinicie o servidor (npm run dev)\n');

    // Also show the update script
    console.log('💡 Ou rode este comando para atualizar automaticamente:');
    console.log('   node scripts/update-env-token.js\n');

    rl.close();
    process.exit(0);
});
