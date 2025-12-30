# 📱 LovableGrowth Android App

Aplicación Android nativa que se conecta con la API de LovableGrowth para gestionar goals, chat con IA y marketplace.

## 🚀 Características

### ✅ Autenticación
- Login con email y password
- Persistencia de sesión con DataStore
- Gestión automática de tokens JWT

### 💬 Chat con IA
- Chatbot inteligente integrado
- Respuestas en tiempo real del agente de IA
- Historial de conversaciones

### 🎯 Gestión de Goals
- Ver lista de objetivos personales
- Crear nuevos goals con título, descripción y target
- Actualizar progreso en tiempo real
- Eliminar goals completados
- Indicadores visuales de progreso

### 🏪 Marketplace
- Explorar productos, founders, inversores, validadores
- Sistema de filtros por tipo de usuario
- Votar por productos y proyectos
- Ver detalles completos de cada producto
- Enlaces directos a LinkedIn, Twitter, sitios web

## 🏗️ Arquitectura

### Stack Tecnológico
- **Lenguaje**: Kotlin
- **UI**: XML Layouts con ViewBinding
- **Networking**: Retrofit + OkHttp
- **Async**: Kotlin Coroutines + Flow
- **Storage**: DataStore Preferences
- **Architecture**: MVVM-lite (Activities + ViewBinding)

### Estructura del Proyecto

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/lovablegrowth/chatbot/
│   │   │   ├── api/
│   │   │   │   ├── ApiService.kt          # Definición de endpoints
│   │   │   │   └── RetrofitClient.kt      # Cliente HTTP
│   │   │   ├── models/
│   │   │   │   └── Models.kt              # Data classes
│   │   │   ├── adapters/
│   │   │   │   ├── ChatAdapter.kt         # RecyclerView para chat
│   │   │   │   ├── GoalsAdapter.kt        # RecyclerView para goals
│   │   │   │   └── ProductsAdapter.kt     # RecyclerView para marketplace
│   │   │   ├── utils/
│   │   │   │   └── PreferencesManager.kt  # Gestión de preferencias
│   │   │   ├── SplashActivity.kt
│   │   │   ├── LoginActivity.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── ChatActivity.kt
│   │   │   ├── GoalsActivity.kt
│   │   │   ├── MarketplaceActivity.kt
│   │   │   └── ProductDetailActivity.kt
│   │   ├── res/
│   │   │   ├── layout/                    # XML layouts
│   │   │   ├── values/                    # Strings, colors, themes
│   │   │   ├── drawable/                  # Imágenes e iconos
│   │   │   └── menu/                      # Menús
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## 📦 Dependencias Principales

```gradle
// AndroidX
androidx.core:core-ktx:1.12.0
androidx.appcompat:appcompat:1.6.1
com.google.android.material:material:1.11.0

// Lifecycle & Coroutines
androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0
org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3

// Networking
com.squareup.retrofit2:retrofit:2.9.0
com.squareup.retrofit2:converter-gson:2.9.0
com.squareup.okhttp3:logging-interceptor:4.12.0

// Storage
androidx.datastore:datastore-preferences:1.0.0

// RecyclerView
androidx.recyclerview:recyclerview:1.3.2
```

## 🚀 Instalación y Compilación

### Requisitos Previos
- Android Studio Hedgehog | 2023.1.1 o superior
- JDK 17
- Android SDK API 34
- Gradle 8.2+

### Pasos de Instalación

1. **Abrir en Android Studio**
```bash
cd android-app
# Abrir con Android Studio
```

2. **Sync Gradle**
```
File > Sync Project with Gradle Files
```

3. **Configurar API Base URL**

Editar `app/build.gradle`:
```gradle
buildConfigField "String", "API_BASE_URL", "\"https://webapp-46s.pages.dev\""
```

Para desarrollo local:
```gradle
buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:3000\""
```

4. **Compilar y Ejecutar**
```bash
# Via Android Studio: Run > Run 'app'
# Via CLI:
./gradlew assembleDebug
./gradlew installDebug
```

## 📱 Uso de la App

### 1. Login
- Abrir la app
- Ingresar email y contraseña de tu cuenta LovableGrowth
- Tocar "Login"

### 2. Chat con IA
- Desde la pantalla principal, seleccionar pestaña "Chat Agent"
- Escribir mensaje en el campo de texto
- Tocar "Send" para enviar
- El agente de IA responderá automáticamente

### 3. Gestionar Goals
- Seleccionar pestaña "Goals"
- Tocar el botón flotante "+" para crear un nuevo goal
- Llenar título, descripción y target (opcional)
- Tocar "Create"
- Para actualizar progreso, usar botón "+" en cada goal
- Para editar, tocar sobre el goal
- Para eliminar, tocar el botón "Delete"

### 4. Explorar Marketplace
- Seleccionar pestaña "Marketplace"
- Usar chips en la parte superior para filtrar por tipo
- Tocar sobre un producto para ver detalles
- Tocar "Vote" para votar por un producto
- Tocar botones de redes sociales para abrir enlaces

## 🔧 Configuración de API

La app se conecta a la API de LovableGrowth en:
```
https://webapp-46s.pages.dev
```

### Endpoints Utilizados

**Autenticación:**
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Obtener usuario actual

**Chat:**
- `POST /api/chat-agent/message` - Enviar mensaje al agente IA
- `GET /api/chat/conversations` - Lista de conversaciones
- `POST /api/chat/conversations/{id}/messages` - Enviar mensaje

**Goals:**
- `GET /api/dashboard/goals` - Obtener goals
- `POST /api/dashboard/goals` - Crear goal
- `PUT /api/dashboard/goals/{id}` - Actualizar goal
- `DELETE /api/dashboard/goals/{id}` - Eliminar goal

**Marketplace:**
- `GET /api/marketplace/products` - Lista de productos
- `GET /api/marketplace/products/{id}` - Detalle de producto
- `POST /api/marketplace/products/{id}/vote` - Votar producto

## 🎨 Personalización

### Cambiar Colores

Editar `app/src/main/res/values/colors.xml`:
```xml
<color name="purple_500">#FF6200EE</color>
<color name="purple_700">#FF3700B3</color>
```

### Cambiar Textos

Editar `app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Tu App Name</string>
```

### Cambiar API URL

Editar `app/src/main/java/com/lovablegrowth/chatbot/api/RetrofitClient.kt`:
```kotlin
private const val BASE_URL = "https://tu-api-url.com/"
```

## 🐛 Debugging

### Ver logs de red
Los requests HTTP se loguean automáticamente con `HttpLoggingInterceptor`.

```bash
# Ver logs en Logcat
adb logcat | grep "OkHttp"
```

### Problemas comunes

**Error de conexión:**
- Verificar que el backend esté corriendo
- Para emulador, usar `http://10.0.2.2:3000` en lugar de `localhost`
- Para dispositivo físico, usar IP de tu computadora

**Token expirado:**
- Logout y volver a hacer login
- Los tokens JWT tienen validez de 7 días

**RecyclerView vacío:**
- Verificar que el usuario tenga datos en el backend
- Hacer pull-to-refresh

## 📋 Roadmap

### Próximas Features
- [ ] Notificaciones push
- [ ] Chat entre usuarios (no solo IA)
- [ ] Upload de imágenes para productos
- [ ] Modo offline con Room Database
- [ ] Dark mode completo
- [ ] Google OAuth login
- [ ] Compartir productos en redes sociales
- [ ] Estadísticas y gráficos de goals
- [ ] Filtros avanzados en marketplace
- [ ] Búsqueda de productos

## 🧪 Testing

```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest
```

## 📦 Build para Producción

```bash
# Generar APK firmado
./gradlew assembleRelease

# Generar AAB (Android App Bundle)
./gradlew bundleRelease
```

APK generado en: `app/build/outputs/apk/release/app-release.apk`

## 🔐 Seguridad

- Los tokens se guardan de forma segura con DataStore
- Comunicación HTTPS con el backend
- No se guardan contraseñas en el dispositivo
- Validación de inputs en formularios

## 👥 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NewFeature`)
3. Commit tus cambios (`git commit -m 'Add NewFeature'`)
4. Push a la rama (`git push origin feature/NewFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

- **GitHub Issues**: [Reportar un bug](https://github.com/cadamar1236/proyectolovablemasgowth/issues)
- **Email**: support@lovablegrowth.com
- **Web**: [webapp-46s.pages.dev](https://webapp-46s.pages.dev)

---

⭐ Si te gusta esta app, dale una estrella al repositorio!
