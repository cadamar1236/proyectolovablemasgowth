# 🔐 Configuración de Google OAuth para Android

Para que la autenticación con Google funcione en la app Android, necesitas configurar Google OAuth:

## 📋 Pasos de Configuración

### 1. Obtener Google Client ID

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **APIs & Services > Credentials**
4. Haz clic en **Create Credentials > OAuth 2.0 Client ID**
5. Selecciona **Android** como tipo de aplicación

### 2. Configurar Cliente Android

Necesitarás:
- **Package name**: `com.lovablegrowth.chatbot`
- **SHA-1 certificate fingerprint**: Obtén el SHA-1 de tu keystore

#### Obtener SHA-1 (Debug)

```bash
# Windows
cd android-app
.\gradlew signingReport

# O con keytool
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copia el SHA-1 que aparece y pégalo en Google Cloud Console.

### 3. Obtener el Client ID

Después de crear el cliente, Google te dará un **Client ID** que se ve así:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### 4. Configurar en la App

Edita `android-app/app/src/main/res/values/strings.xml`:

```xml
<string name="google_client_id">TU_CLIENT_ID_AQUI.apps.googleusercontent.com</string>
```

**⚠️ IMPORTANTE**: Reemplaza `YOUR_GOOGLE_CLIENT_ID` con tu Client ID real.

### 5. Usar el mismo Client ID del Backend

**Opción Recomendada**: Usa el MISMO Google Client ID que usas en tu web backend.

Tu backend ya tiene configurado Google OAuth. Busca en tu código web el `GOOGLE_CLIENT_ID` y usa ese mismo en la app Android (solo necesitas registrar la app Android en el mismo proyecto de Google Cloud).

## 🔧 Client ID desde Variables de Entorno

Si ya tienes el Client ID en tu backend, búscalo en:
- Variables de entorno de Cloudflare
- Archivo `.env` local
- Código del backend en `src/api/auth.ts`

## 📱 Probar la App

Una vez configurado:

1. Compila la app: `./gradlew assembleDebug`
2. Instala en dispositivo/emulador
3. Toca "Sign in with Google"
4. Selecciona tu cuenta de Google
5. La app enviará el código de autorización a tu backend
6. El backend valida con Google y retorna un JWT
7. ¡Listo! Estás autenticado

## 🐛 Troubleshooting

### Error: "Developer Error" o "Sign in failed"
- Verifica que el SHA-1 sea correcto
- Asegúrate de que el package name sea exactamente `com.lovablegrowth.chatbot`
- Espera unos minutos después de crear las credenciales (pueden tardar en propagarse)

### Error: "Invalid client"
- Verifica que el Client ID esté correctamente copiado en `strings.xml`
- Asegúrate de que el Client ID sea del tipo **Android**, no Web

### Error de backend
- Verifica que tu backend esté corriendo
- Confirma que la URL en `RetrofitClient.kt` sea correcta
- Revisa los logs del backend para ver si recibe el request

## 🔑 Configuración Completa

**Google Cloud Console:**
1. OAuth consent screen configurado
2. Android OAuth Client creado con:
   - Package: `com.lovablegrowth.chatbot`
   - SHA-1: Tu fingerprint
3. Client ID copiado

**App Android:**
1. `strings.xml` con el Client ID correcto
2. Dependencia `play-services-auth` en `build.gradle` ✅ (ya está)
3. Permisos de Internet en `AndroidManifest.xml` ✅ (ya está)

**Backend:**
1. Endpoint `/api/auth/google` funcionando ✅
2. Validación del auth code con Google ✅
3. Generación de JWT ✅

---

¿Necesitas ayuda para obtener el SHA-1 o configurar Google Cloud Console?
