// Verificador de variáveis de ambiente
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'MONGODB_URI',
  'PORT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'JWT_SECRET',
  'MERCADO_PAGO_ACCESS_TOKEN'
];

function checkEnvironmentVariables() {
  console.log('🔍 Verificando variáveis de ambiente...\n');
  
  let allValid = true;
  
  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar];
    if (!value) {
      console.log(`❌ ${envVar} - NÃO DEFINIDA`);
      allValid = false;
    } else {
      // Mascarar valores sensíveis para exibição
      let displayValue = value;
      if (envVar.includes('KEY') || envVar.includes('TOKEN') || envVar.includes('SECRET')) {
        displayValue = value.substring(0, 10) + '...';
      }
      if (envVar === 'MONGODB_URI') {
        displayValue = value.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      }
      console.log(`✅ ${envVar} - DEFINIDA (${displayValue})`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('✅ Todas as variáveis de ambiente estão configuradas!');
    console.log('🚀 Aplicação pronta para deploy!');
    process.exit(0);
  } else {
    console.log('❌ Algumas variáveis de ambiente estão faltando!');
    console.log('📝 Verifique o arquivo .env.example para referência');
    process.exit(1);
  }
}

checkEnvironmentVariables();
